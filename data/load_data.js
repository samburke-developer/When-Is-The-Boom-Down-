require('dotenv').config({ path: __dirname + '/../variables.env' });
const fs = require('fs');

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises

// import all of our models - they need to be imported only once
const Boomgate = require('../models/Boomgate');

const boomgates = JSON.parse(fs.readFileSync(__dirname + '/boomgates.json', 'utf-8'));

async function deleteData() {
  await Boomgate.remove();
  process.exit();
}

async function loadData() {
  try {
    await Boomgate.insertMany(boomgates);
    console.log('Done!');
    process.exit();
  } catch(e) {
    console.log('\n Error! The Error info is below');
    console.log(e);
    process.exit();
  }
}
if (process.argv.includes('--delete')) {
  deleteData();
} else {
  loadData();
}
