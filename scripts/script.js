let map, trips = [], place_markers = {};
const iconSizeAtZoomLevel = [null, 3, 3, 3, 3, 5, 7, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9];
let emoji = {
  busride: '🚌',
  trainride: '🚂',
  drive: '🚗',
  flight: '✈️'
};

function newPath(coords, color) {
  return geodesicPoly = new google.maps.Polyline({
    path: coords,
    strokeColor: color,
    strokeOpacity: 1.0,
    strokeWeight: 2,
    geodesic: true,
    map: map
  });
}

function newFlight(between, places) {
  trips.push({
    between: between,
    polygon: newPath([places[between[0]].coords, places[between[1]].coords], '#FF6666'),
    type: 'flight'
  });
}

function newDrive(between, path) {
  trips.push({
    between: between,
    polygon: newPath(path, '#6666FF'),
    type: 'drive'
  });
}

function newBusRide(between, path) {
  trips.push({
    between: between,
    polygon: newPath(path, '#CC00CC'),
    type: 'busride'
  });
}

function newTrainRide(between, path) {
  trips.push({
    between: between,
    polygon: newPath(path, '#009933'),
    type: 'trainride'
  });
}

function newPlace(location, id, places, layover) {
  let marker = new google.maps.Marker({
    position: location,
    map: map,
    id: id,
    icon: circleIcon(layover ? 0.0 : 1.0, iconSizeAtZoomLevel[map.getZoom()])
  });

  place_markers[marker.id] = marker;

  google.maps.event.addListener(marker, 'mouseover', function (event) {
    if (places[this.id].layover) { return; }
    for (let id in place_markers) {
      place_markers[id].setIcon(circleIcon(0.1, iconSizeAtZoomLevel[map.getZoom()]));
    }

    this.setIcon(circleIcon(1.0, iconSizeAtZoomLevel[map.getZoom()]));
    let this_place_name = places[this.id].name;
    let connects = [];

    for (let i=0; i < trips.length; i++) {
      if (this.id == trips[i].between[0]) {
        place_markers[trips[i].between[1]].setIcon(circleIcon(places[trips[i].between[1]].layover ? 0.0 : 1.0, iconSizeAtZoomLevel[map.getZoom()]));
        const name = places[trips[i].between[1]].name;
        if (!connects.hasOwnProperty(name)) {
          connects[name] = [emoji[trips[i].type]];
        } else {
          connects[name].push(emoji[trips[i].type]);
        }
        trips[i].polygon.setOptions({
          strokeOpacity : 1.0
        });
      } else if (this.id == trips[i].between[1]) {
        place_markers[trips[i].between[0]].setIcon(circleIcon(places[trips[i].between[0]].layover ? 0.0 : 1.0, iconSizeAtZoomLevel[map.getZoom()]));
        const name = places[trips[i].between[0]].name;
        if (!connects.hasOwnProperty(name)) {
          connects[name] = [emoji[trips[i].type]];
        } else {
          connects[name].push(emoji[trips[i].type]);
        }
        trips[i].polygon.setOptions({
          strokeOpacity : 1.0
        });
      } else {
        trips[i].polygon.setOptions({
          strokeOpacity : 0.1
        });
      }
    }

    let infobox = document.getElementById("infobox");
    infobox.getElementsByTagName("h2")[0].innerHTML = this_place_name;

    let div = document.createElement("div");
    let keys = Object.keys(connects);
    keys.sort();
    for (let i=0; i < keys.length; i++) {
      let p = document.createElement("p");
      p.innerHTML = connects[keys[i]].join('') + ' ' + keys[i];
      div.appendChild(p)
    }
    let p = infobox.getElementsByTagName("p")[0];
    while (p.hasChildNodes()) {
      p.removeChild(p.lastChild);
    }
    p.appendChild(div);

    infobox.style.visibility = "visible";
  });

  google.maps.event.addListener(marker, 'mouseout', function (event) {
    for (let id in place_markers) {
      place_markers[id].setIcon(circleIcon(places[id].layover ? 0.0 : 1.0, iconSizeAtZoomLevel[map.getZoom()]));
    }

    for (let i=0; i < trips.length; i++) {
      trips[i].polygon.setOptions({
        strokeOpacity : 1.0
      });
    }

    let infobox = document.getElementById("infobox");
    infobox.style.visibility = "hidden";
  });
}

function circleIcon(opacity, scale) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    strokeColor: '#FFFFFF',
    strokeOpacity: 0.0,
    strokeWeight: 0,
    fillColor: '#FFFFFF',
    fillOpacity: opacity,
    scale: scale //pixels
  };
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 45.000, lng: 0.000},
    zoom: 3,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false
  });

  google.maps.event.addListener(map, 'zoom_changed', function() {
    console.log('new zoom: ' + map.getZoom());
    for (let id in place_markers) {
      let oldOpacity = place_markers[id].getIcon().fillOpacity;
      place_markers[id].setIcon(circleIcon(oldOpacity, iconSizeAtZoomLevel[map.getZoom()]));
    }
  });

  fetch('data/theme.json').then(function(response) {
    return response.json();
  }).then(function(theme) {
    map.setOptions({styles: theme});
  });

  fetch('data/places.json')
  .then(response => response.json())
  .then(places => {
    console.log(places);
    let bounds = new google.maps.LatLngBounds();
    for (let id in places) {
      bounds.extend(places[id].coords);
      newPlace(places[id].coords, id, places, places[id].layover);
    }
    map.fitBounds(bounds);
    // map.setZoom(map.getZoom()-1);

    fetch('data/trainrides.json')
    .then(response => response.json())
    .then(trainrides => {
      trainrides.map(trainride => newTrainRide(trainride.between, trainride.coords));

      fetch('data/busrides.json')
      .then(response => response.json())
      .then(busrides => {
        busrides.map(busride => newBusRide(busride.between, busride.coords));
      
        fetch('data/drives.json')
        .then(response => response.json())
        .then(drives => {
          drives.map(drive => newDrive(drive.between, drive.coords));
          
          fetch('data/flights.json')
          .then(response => response.json())
          .then(paths => paths.map(between => newFlight(between, places)));
        });
      });
    });
  });

}
