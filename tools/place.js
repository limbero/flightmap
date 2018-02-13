const fs = require('fs');
const fetch = require('node-fetch');

const args = process.argv.slice(2);

if (!Array.isArray(args) || args.length < 2 || args[0] === '-h' || args[0] === '--help') {
  console.log('Usage: node place.js [shortname] [address]');
    return -1;
}

const shortname = args[0];
const address = args.slice(1).join(' ');

let requesturl = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyAAM_ApG-DqokDURdJ4yZAEjAXL-Hsze-U';
requesturl += '&address=' + encodeURIComponent(address);

fetch(requesturl)
.then(response => response.json())
.then(geocoding => {
  const coords = geocoding.results[0].geometry.location;
  
  addPlace(shortname, {
    name: address,
    coords: coords
  });
});

function addPlace(shortname, place) {
  let filename = '../data/places.json';
  let places = JSON.parse(fs.readFileSync(filename, 'utf8'));
  places[shortname] = place;
  fs.writeFileSync(filename, JSON.stringify(places, null, 2));
}
