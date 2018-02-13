const fs = require('fs');
const polyline = require('@mapbox/polyline');
const fetch = require('node-fetch');

const args = process.argv.slice(2);

if (!Array.isArray(args) || args.length < 3 || args[0] === '-h' || args[0] === '--help') {
  console.log('Usage: node trip.js [trip type] [origin] [destination]');
    return -1;
}

const places = JSON.parse(fs.readFileSync('../data/places.json', 'utf8'));

let filename;
let mode;
switch (args[0]) {
  case 'drive':
    filename = 'drives.json';
    mode = 'driving';
    break;
  case 'train':
    filename = 'trainrides.json';
    mode = 'transit&transit_mode=train';
    break;
  case 'bus':
    filename = 'busrides.json';
    mode = 'transit&transit_mode=bus';
    break;
  case 'flight':
    addTrip('flights.json', [args[1], args[2]]);
    process.exit(0);
  default:
    console.log('You must supply a valid trip type as the first argument [drive, bus, train, flight]');
    process.exit(-1);
}

let requesturl = 'https://maps.googleapis.com/maps/api/directions/json?key=AIzaSyAAM_ApG-DqokDURdJ4yZAEjAXL-Hsze-U';
requesturl += '&origin=' + places[args[1]].coords.lat + ',' + places[args[1]].coords.lng;
requesturl += '&destination=' + places[args[2]].coords.lat + ',' + places[args[2]].coords.lng;
// requesturl += '&waypoints=Slates%20Hot%20Springs|Notleys%20Landing,%20CA|Santa%20Cruz';

fetch(requesturl)
.then(response => response.json())
.then(trip => {
  const coords = trip.routes[0].legs.flatMap(route => {
    return route.steps.flatMap(step => {
      return polyline.decode(step.polyline.points);
    }).map(coordpair => {
      return {lat: coordpair[0], lng: coordpair[1]}
    });
  });
  
  addTrip(filename, {
    coords: coords,
    between: [
      args[1],
      args[2]
    ]
  });
})
.catch(error => console.log(error));

function addTrip(filename, trip) {
  let trips = JSON.parse(fs.readFileSync('../data/' + filename, 'utf8'));
  trips.push(trip);

  fs.writeFileSync('../data/' + filename, JSON.stringify(trips, null, 2));
}

// https://stackoverflow.com/a/39838385
const concat = (x,y) =>
  x.concat(y)
const flatMap = (f,xs) =>
  xs.map(f).reduce(concat, [])
Array.prototype.flatMap = function(f) {
  return flatMap(f,this)
}
