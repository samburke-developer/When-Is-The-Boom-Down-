const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const boomgateSchema = new mongoose.Schema({
	name: {
		type : String,
	},
	stations:
	{
		station1:
		{
			stop_id: String,
			direction_id: [String],
			delay: String
		},

		station2:
		{
			stop_id: String,
			direction_id: [String],
			delay: String
		}
	}
},
{
		toJSON: {virtuals: true},
		toObject: {virtuals: true},
});

module.exports = mongoose.model('Boomgate', boomgateSchema);