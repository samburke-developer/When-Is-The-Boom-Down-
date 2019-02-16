const express = require('express');

const router = express.Router();
const trainController = require('../controllers/trainController');
// Do work here
router.get('/', trainController.renderHome);

router.post('/nearby', trainController.getNearBoomGatesPromises);
router.post('/ip', trainController.getLocation, trainController.getNearBoomGatesPromises);


module.exports = router;
