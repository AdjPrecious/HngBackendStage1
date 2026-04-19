const express = require('express');
const router = express.Router();
const { createProfile, listProfiles, getProfile, deleteProfile } = require('../controllers/profiles');

router.post('/', createProfile);
router.get('/', listProfiles);
router.get('/:id', getProfile);
router.delete('/:id', deleteProfile);

module.exports = router;
