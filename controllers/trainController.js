const mongoose = require('mongoose');
const request = require("request-promise");
const crypto = require('crypto'); 
const moment = require('moment');
const momenttz = require('moment-timezone');

const Boomgate = mongoose.model('Boomgate');
momenttz.tz.setDefault("Australia/Sydney");

// route_type      
// 0 Train (metropolitan)
// 1 Tram
// 2 Bus (metropolitan, regional and Skybus, but not V/Line) 
// 3 V/Line train and coach
// 4 Night Bus 

exports.renderHome = async(req,res) => 
{
	res.render('home');
}

exports.getLocation = async(req,res, next) => 
{
	var ip = (req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress).split(",")[0];

	if(process.env.NODE_ENV == "development") ip = '45.77.85.244';
	const options = {  
  		method: 'GET',
  		uri: `https://ipinfo.io/${ip || "49.199.229.202"}`,
  		json: true
	}
	request(options)  
  	.then(function (response) 
  	{
  		console.log(response)
  		req.body.lat = response.loc.split(',')[0];
		req.body.lng = response.loc.split(',')[1];
  		next();
  	});
}

async function getNearbyStations(lat, lng)
{
	apiUrl = '/v3/stops/location/';
	params = lat + ',' + lng + '?route_types=0&max_distance=15000'
	uri = generateFinalUri(apiUrl,params);
	options = createJsonOptions(uri);
	stations = {"stops": []};
	await request(options)  
  	.then(function (response) 
  	{
  		//console.log(response)
  		for (let key in response.stops)
  		{
  			stations.stops.push({	"id": response.stops[key].stop_id, 
  									"name": response.stops[key].stop_name, 
  									"distance": response.stops[key].stop_distance
  								});
  		}
  	})
  	.catch(function (err) 
  	{
  		console.log("Error getting nearby stations")
    	//console.log(err);
  	})

  	return stations;
}

exports.getNearBoomGatesPromises = async(req,res, next) => 
{
	let station_ids = [];
	let stations = [];
	//Find all stop_ids of nearby stations 
	await getNearbyStations(req.body.lat, req.body.lng).then(function(result)
	{
		station_ids = result.stops.map((stop) => stop.id)
		stations = result;
	});	

	//Find all level crossings that have stop_id's of nearby station that are listed in the database
	let boomgates = await Boomgate.find(
	{
			"stations.station2.stop_id": station_ids,
			"stations.station1.stop_id": station_ids,
	});

	boomPromises = [];
	
	boomgates.forEach((boom) => 
	{
		stations.stops.forEach((station) => 
		{
			if(station.id == boom.stations.station1.stop_id)
			{
				boom.stations.station1.distance1 = station.distance
				boom.stations.station2.distance2 = station.distance
			}else if(station.id == boom.stations.station2.stop_id){
				boom.stations.station2.distance1 = station.distance
				boom.stations.station1.distance2 = station.distance
			}
		});

		boom.stations.station1.boom_name = boom.name
		boom.stations.station2.boom_name = boom.name
		boomPromises.push(whenIsTrainDepartingV2(boom.stations.station1))
		boomPromises.push(whenIsTrainDepartingV2(boom.stations.station2))
	})

	boomgates = {};
	Promise.all(boomPromises)
	.then(function(departures) 
	{
		//filter out empty depatures, sort by distance from user and start to build boomgate variable
		departures = departures.filter((val) => val.length > 0)
		.sort((a,b) => parseInt((a[0].distance1 + a[0].distance2)/ 2) - parseInt((b[0].distance1 + b[0].distance2) / 2))
		.forEach((departure) => 
		{
			let boom = ''
			departure.forEach((train) => {
				boom = train.boom_name
				if(boomgates.hasOwnProperty(train.boom_name)){
					boomgates[train.boom_name].push(train)
				}else{
					boomgates[train.boom_name] = [train]
				}
				boomgates[boom].departuresText = generateDepatureTextV2(boomgates[boom])
				boomgates[boom].distance = `~${Math.ceil(((boomgates[boom][0].distance1 + boomgates[boom][0].distance2)/ 2) / 100) * 100}m away`
			});
		});

  		res.status(200).render('homeFromLocation', {boomgates: boomgates});
	})
}

async function whenIsTrainDepartingV2(station)
{
	return new Promise(
        async function (resolve, reject) 
        {
            apiUrl = '/v3/departures/route_type';
			params = '/0/stop/'+ station.stop_id + '?max_results=3'; 
			let departures = [];
			uri = generateFinalUri(apiUrl,params);
			options = createJsonOptions(uri);
			await request(options)  
		  	.then(function (response) 
		  	{
		  		//console.log(response.departures)
		  		response.departures.forEach((depature) => {
		  			if (station.direction_id.indexOf(depature.direction_id) > -1 )
		  			{
		  				depature.distance1 = station.distance1
		  				depature.distance2 = station.distance2
		  				depature.boom_name = station.boom_name
		  				departures.push(depature)
		  			}
		  		})
		  	})
		  	.catch(function (err) 
		  	{
		  		console.log("Error getting departures")
		    	reject(err);
		  	})
		  	resolve(departures);
        }
    )
}

function generateDepatureTextV2(departures)
{
	//console.log(departures)
	if (departures != undefined)
	{
		departures.sort((a, b) => moment.utc(a.estimated_departure_utc||a.scheduled_departure_utc).valueOf() > moment.utc(b.estimated_departure_utc||b.scheduled_departure_utc).valueOf())
		let text = departures.map((depature) => 
		{
			//checking not null and less than 30 mins
			if(depature != null &&
		  		moment.utc(depature.estimated_departure_utc||depature.scheduled_departure_utc).valueOf() < moment.utc(moment().add(30, 'minutes')).valueOf())
			{
				return "Will be down " + moment(depature.estimated_departure_utc||depature.scheduled_departure_utc).add(depature.delay || 0,'m').fromNow() + 
			  		" (" + moment(depature.estimated_departure_utc||depature.scheduled_departure_utc).format('LT') + ")"; 
			}
		})
		//Filters out duplicates 
		return text.filter((item, pos, self) => self.indexOf(item) == pos)
	} else
	{
		return null;
	}
}

function generateFinalUri(apiUrl, params)
{	
	let urlWithParamsAndDevId;
	if(params.includes('?'))
	{
		urlWithParamsAndDevId= apiUrl + params + '&devid=' + process.env.devid;
	}else urlWithParamsAndDevId= apiUrl + params + '?devid=' + process.env.devid;
	
	const hash = crypto.createHmac('sha1', process.env.signature).update(urlWithParamsAndDevId).digest('hex');
	return finalUri = process.env.baseUri + urlWithParamsAndDevId + '&signature=' + hash;
}

function createJsonOptions(url){
	
	const options = {  
  		method: 'GET',
  		uri: url,
  		json: true
	}
	return options;
}
