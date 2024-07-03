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
    // mode = 'transit&transit_mode=bus';
    mode = 'driving';
    break;
  case 'flight':
    addTrip('flights.json', [args[1], args[2]]);
    process.exit(0);
  case 'boat':
    addTrip('boatrides.json', [args[1], args[2]]);
    process.exit(0);
  default:
    console.log('You must supply a valid trip type as the first argument [drive, bus, train, flight, boat]');
    process.exit(-1);
}

let requesturl = 'https://maps.googleapis.com/maps/api/directions/json?key=' + process.env.GMAPS_API_KEY;
requesturl += '&origin=' + places[args[1]].coords.lat + ',' + places[args[1]].coords.lng;
requesturl += '&destination=' + places[args[2]].coords.lat + ',' + places[args[2]].coords.lng;
requesturl += '&mode=' + mode;

fetch(requesturl)
.then(response => response.json())
.then(trip => {
  addTrip(filename, {
    polyline: trip.routes[0].overview_polyline.points,
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
