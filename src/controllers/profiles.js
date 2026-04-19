const { pool } = require('../db');
const { enrichName } = require('../services/enrichment');
const { uuidv7 } = require('../services/uuidv7');

// POST /api/profiles
async function createProfile(req, res, next) {
  try {
    const { name } = req.body;

    if (name === undefined || name === null) {
      return res.status(400).json({ status: 'error', message: 'Missing required field: name' });
    }
    if (typeof name !== 'string') {
      return res.status(422).json({ status: 'error', message: 'Invalid type: name must be a string' });
    }
    if (name.trim() === '') {
      return res.status(400).json({ status: 'error', message: 'name must not be empty' });
    }

    const normalizedName = name.trim().toLowerCase();

    // Idempotency check
    const existing = await pool.query(
      'SELECT * FROM profiles WHERE name = $1',
      [normalizedName]
    );

    if (existing.rows.length > 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Profile already exists',
        data: formatProfile(existing.rows[0]),
      });
    }

    // Enrich via external APIs
    const enriched = await enrichName(normalizedName);

    const id = uuidv7();
    const createdAt = new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO profiles
         (id, name, gender, gender_probability, sample_size, age, age_group, country_id, country_probability, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        id,
        normalizedName,
        enriched.gender,
        enriched.gender_probability,
        enriched.sample_size,
        enriched.age,
        enriched.age_group,
        enriched.country_id,
        enriched.country_probability,
        createdAt,
      ]
    );

    return res.status(201).json({
      status: 'success',
      data: formatProfile(result.rows[0]),
    });
  } catch (err) {
    if (err.statusCode === 502) {
      return res.status(502).json({
        status: '502',
        message: `${err.api} returned an invalid response`,
      });
    }
    next(err);
  }
}

// GET /api/profiles
async function listProfiles(req, res, next) {
  try {
    const { gender, country_id, age_group } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (gender) {
      conditions.push(`LOWER(gender) = LOWER($${idx++})`);
      values.push(gender);
    }
    if (country_id) {
      conditions.push(`LOWER(country_id) = LOWER($${idx++})`);
      values.push(country_id);
    }
    if (age_group) {
      conditions.push(`LOWER(age_group) = LOWER($${idx++})`);
      values.push(age_group);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT id, name, gender, age, age_group, country_id FROM profiles ${where} ORDER BY created_at DESC`,
      values
    );

    return res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/profiles/:id
async function getProfile(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    return res.status(200).json({
      status: 'success',
      data: formatProfile(result.rows[0]),
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/profiles/:id
async function deleteProfile(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM profiles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Profile not found' });
    }

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function formatProfile(row) {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    gender_probability: parseFloat(row.gender_probability),
    sample_size: row.sample_size,
    age: row.age,
    age_group: row.age_group,
    country_id: row.country_id,
    country_probability: parseFloat(row.country_probability),
    created_at: new Date(row.created_at).toISOString(),
  };
}

module.exports = { createProfile, listProfiles, getProfile, deleteProfile };
