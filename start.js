const mongoose = require('mongoose');
// import environmental variables from our variables.env file
require('dotenv').config({ path: 'variables.env' });


mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
  console.error(`${err.message}`);
});

require('./models/Boomgate')

const app = require('./app');
app.set('port', process.env.PORT || 7777);
const server = app.listen(app.get('port'), () => {
  console.log(`Express running → PORT ${server.address().port}`);
});
