var map, icon_filled, icon_filled_05, icon_filled_01, flights = [], airport_markers = {};

function newflight(path, airports) {
  var geodesicPoly = new google.maps.Polyline({
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
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    id: id,
    icon: icon_filled_05
  });

  airport_markers[marker.id] = marker;

  google.maps.event.addListener(marker, 'mouseover', function (event) {
    for (var id in airport_markers) {
      airport_markers[id].setIcon(icon_filled_01);
    }

    this.setIcon(icon_filled);
    var this_airport_name = airports[this.id].name;
    var connects = [];

    for (var i=0; i < flights.length; i++) {
      if (this.id == flights[i].path[0]) {
        airport_markers[flights[i].path[1]].setIcon(icon_filled);
        connects.push(airports[flights[i].path[1]].name);
        flights[i].polygon.setOptions({
                strokeOpacity : 1.0
            });
      } else if (this.id == flights[i].path[1]) {
        airport_markers[flights[i].path[0]].setIcon(icon_filled);
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

    var infobox = document.getElementById("infobox");
    infobox.getElementsByTagName("h2")[0].innerHTML = this_airport_name;

    var ul = document.createElement("ul");
    for (var i=0; i < connects.length; i++) {
      var li = document.createElement("li");
      li.innerHTML = connects[i];
      ul.appendChild(li)
    }
    var p = infobox.getElementsByTagName("p")[0];
    while (p.hasChildNodes()) {
      p.removeChild(p.lastChild);
    }
    p.appendChild(ul);

    infobox.style.visibility = "visible";
  });

  google.maps.event.addListener(marker, 'mouseout', function (event) {
    for (var id in airport_markers) {
      airport_markers[id].setIcon(icon_filled_05);
    }

    for (var i=0; i < flights.length; i++) {
      flights[i].polygon.setOptions({
              strokeOpacity : 1.0
          });
    }

    var infobox = document.getElementById("infobox");
    infobox.style.visibility = "hidden";
  });
}

function initMap() {
  icon_filled = {
    path: google.maps.SymbolPath.CIRCLE,
    strokeColor: '#990033',
    strokeOpacity: 0.0,
    strokeWeight: 0,
    fillColor: '#990033',
    fillOpacity: 1.0,
    scale: 3 //pixels
  };

  icon_filled_05 = {
    path: google.maps.SymbolPath.CIRCLE,
    strokeColor: '#990033',
    strokeOpacity: 0.0,
    strokeWeight: 0,
    fillColor: '#990033',
    fillOpacity: 0.5,
    scale: 3 //pixels
  };

  icon_filled_01 = {
    path: google.maps.SymbolPath.CIRCLE,
    strokeColor: '#990033',
    strokeOpacity: 0.0,
    strokeWeight: 0,
    fillColor: '#990033',
    fillOpacity: 0.1,
    scale: 3 //pixels
  };

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 45.000, lng: 0.000},
    zoom: 4,
    streetViewControl: false
  });

  fetch('theme.json').then(function(response) {
    return response.json();
  }).then(function(theme) {
    map.setOptions({styles: theme});
  });

  fetch('airports.json')
  .then(function(response) {
    return response.json();
  })
  .then(function(airports) {
    console.log(airports);
    var bounds = new google.maps.LatLngBounds();
    for (var id in airports) {
      bounds.extend(airports[id].coords);
      newairport(airports[id].coords, id, airports);
    }
    map.fitBounds(bounds);
    // map.setZoom(map.getZoom()-1);

    fetch('flights.json')
    .then(function(response) {
      return response.json();
    })
    .then(function(paths) {
      for (var i=0; i < paths.length; i++) {
        newflight(paths[i], airports);
      }
    });
  });

}
