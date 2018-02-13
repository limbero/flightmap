let map, flights = [], airport_markers = {};
const iconSizeAtZoomLevel = [null, 3, 3, 3, 3, 5, 7, 9]

function newflight(path, airports) {
  let geodesicPoly = new google.maps.Polyline({
    strokeColor: '#990033',
    strokeOpacity: 1.0,
    strokeWeight: 1,
    geodesic: true,
    map: map
  });

  flights.push({path: path, polygon: geodesicPoly});
  geodesicPoly.setPath([airports[path[0]].coords, airports[path[1]].coords]);
}

function newairport(location, id, airports) {
  let marker = new google.maps.Marker({
    position: location,
    map: map,
    id: id,
    icon: circleIcon(0.5, iconSizeAtZoomLevel[map.getZoom()])
  });

  airport_markers[marker.id] = marker;

  google.maps.event.addListener(marker, 'mouseover', function (event) {
    for (let id in airport_markers) {
      airport_markers[id].setIcon(circleIcon(0.1, iconSizeAtZoomLevel[map.getZoom()]));
    }

    this.setIcon(circleIcon(1.0, iconSizeAtZoomLevel[map.getZoom()]));
    let this_airport_name = airports[this.id].name;
    let connects = [];

    for (let i=0; i < flights.length; i++) {
      if (this.id == flights[i].path[0]) {
        airport_markers[flights[i].path[1]].setIcon(circleIcon(1.0, iconSizeAtZoomLevel[map.getZoom()]));
        connects.push(airports[flights[i].path[1]].name);
        flights[i].polygon.setOptions({
                strokeOpacity : 1.0
            });
      } else if (this.id == flights[i].path[1]) {
        airport_markers[flights[i].path[0]].setIcon(circleIcon(1.0, iconSizeAtZoomLevel[map.getZoom()]));
        connects.push(airports[flights[i].path[0]].name);
        flights[i].polygon.setOptions({
                strokeOpacity : 1.0
            });
      } else {
        flights[i].polygon.setOptions({
                strokeOpacity : 0.1
            });
      }
    }
    connects.sort();

    let infobox = document.getElementById("infobox");
    infobox.getElementsByTagName("h2")[0].innerHTML = this_airport_name;

    let ul = document.createElement("ul");
    for (let i=0; i < connects.length; i++) {
      let li = document.createElement("li");
      li.innerHTML = connects[i];
      ul.appendChild(li)
    }
    let p = infobox.getElementsByTagName("p")[0];
    while (p.hasChildNodes()) {
      p.removeChild(p.lastChild);
    }
    p.appendChild(ul);

    infobox.style.visibility = "visible";
  });

  google.maps.event.addListener(marker, 'mouseout', function (event) {
    for (let id in airport_markers) {
      airport_markers[id].setIcon(circleIcon(0.5, iconSizeAtZoomLevel[map.getZoom()]));
    }

    for (let i=0; i < flights.length; i++) {
      flights[i].polygon.setOptions({
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
    strokeColor: '#990033',
    strokeOpacity: 0.0,
    strokeWeight: 0,
    fillColor: '#990033',
    fillOpacity: opacity,
    scale: scale //pixels
  };
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 45.000, lng: 0.000},
    zoom: 3,
    streetViewControl: false
  });

  google.maps.event.addListener(map, 'zoom_changed', function() {
    console.log('new zoom: ' + map.getZoom());
    for (let id in airport_markers) {
      airport_markers[id].setIcon(circleIcon(0.5, iconSizeAtZoomLevel[map.getZoom()]));
    }
  });

  fetch('../data/theme.json').then(function(response) {
    return response.json();
  }).then(function(theme) {
    map.setOptions({styles: theme});
  });

  fetch('../data/airports.json')
  .then(function(response) {
    return response.json();
  }).then(function(airports) {
    console.log(airports);
    let bounds = new google.maps.LatLngBounds();
    for (let id in airports) {
      bounds.extend(airports[id].coords);
      newairport(airports[id].coords, id, airports);
    }
    map.fitBounds(bounds);
    // map.setZoom(map.getZoom()-1);

    fetch('../data/flights.json')
    .then(function(response) {
      return response.json();
    }).then(function(paths) {
      for (let i=0; i < paths.length; i++) {
        newflight(paths[i], airports);
      }
    });
  });

}
