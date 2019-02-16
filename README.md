# When Is The Boom Down?
Living near boom gates in Melbourne can be a hassle. This Node.js application predicts when your nearest boom gates will be down!

This app interacts with the [PTV public API](https://www.data.vic.gov.au/data/dataset/ptv-timetable-api) and predicts when boomgates will be down.

Boomgate data was manually collected and is stored in a MongoDB database using [mLab](https://mlab.com/) as a service.

[whenistheboomdown.com](https://whenistheboomdown.com/) is hosted on [Zeit's Now](https://zeit.co/now) service.

The application runs on Node.js using the Express.js web application framework.

The application finds, filters, sorts, builds and delivers data that is provided by [PTV's public API](https://www.data.vic.gov.au/data/dataset/ptv-timetable-api).

A users location is found using two different methods. First the users location is found using IP geolocation with services provided by [ipinfo.io](https://ipinfo.io/). This method isn't super indictive of the users location so the second method that is used uses the browsers geolocation service, as long as the user provides permission for it to be enabled. 