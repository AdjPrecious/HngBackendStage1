const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

function classifyAge(age) {
  if (age <= 12) return 'child';
  if (age <= 19) return 'teenager';
  if (age <= 59) return 'adult';
  return 'senior';
}

async function enrichName(name) {
  const encodedName = encodeURIComponent(name);

  const [genderData, agifyData, nationalizeData] = await Promise.all([
    fetchJson(`https://api.genderize.io?name=${encodedName}`),
    fetchJson(`https://api.agify.io?name=${encodedName}`),
    fetchJson(`https://api.nationalize.io?name=${encodedName}`),
  ]);

  // Validate Genderize
  if (!genderData.gender || !genderData.count || genderData.count === 0) {
    const err = new Error('Genderize returned an invalid response');
    err.statusCode = 502;
    err.api = 'Genderize';
    throw err;
  }

  // Validate Agify
  if (agifyData.age === null || agifyData.age === undefined) {
    const err = new Error('Agify returned an invalid response');
    err.statusCode = 502;
    err.api = 'Agify';
    throw err;
  }

  // Validate Nationalize
  if (!nationalizeData.country || nationalizeData.country.length === 0) {
    const err = new Error('Nationalize returned an invalid response');
    err.statusCode = 502;
    err.api = 'Nationalize';
    throw err;
  }

  // Pick country with highest probability
  const topCountry = nationalizeData.country.reduce((best, curr) =>
    curr.probability > best.probability ? curr : best
  );

  return {
    gender: genderData.gender,
    gender_probability: genderData.probability,
    sample_size: genderData.count,
    age: agifyData.age,
    age_group: classifyAge(agifyData.age),
    country_id: topCountry.country_id,
    country_probability: topCountry.probability,
  };
}

module.exports = { enrichName };
