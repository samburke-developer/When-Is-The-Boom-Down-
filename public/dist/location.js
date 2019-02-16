var options = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
};


function sendLatLngtoServer(lat, lng) 
{
  
  data = {lat: lat, lng: lng};
  var xhttp = new XMLHttpRequest();  
  
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState === 4) {
      document.body.innerHTML = ''; 
      document.write(xhttp.response);
    }
  }

  xhttp.open("POST", window.location.href + "nearby");
  xhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhttp.send(JSON.stringify(data));
  
}

function success(pos) {
  var crd = pos.coords;
  //window.location.href = window.location.href +"nearby/" + crd.latitude+ "&" + crd.longitude;
  console.log('Your current position is:');
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);
  sendLatLngtoServer(crd.latitude, crd.longitude);
};



function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
  sendLatLngtoServer('-37.860008', '145.057917')
};

function getLocation()
{
  console.log('Getting Location')
	navigator.geolocation.getCurrentPosition(success, error, options);
}

window.onload = getLocation;