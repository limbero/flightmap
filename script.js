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

function newairport(location, id) {
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

  retro = [
            {
              elementType: 'geometry',
              stylers: [{color: '#ebe3cd'}]
            },
            {
              elementType: 'labels.text.fill',
              stylers: [{visibility: "off"}] // stylers: [{color: '#523735'}]
            },
            {
              elementType: 'labels.text.stroke',
              stylers: [{visibility: "off"}] // stylers: [{color: '#f5f1e6'}]
            },
            {
              featureType: 'administrative',
              elementType: 'geometry.stroke',
              stylers: [{color: '#c9b2a6'}]
            },
            {
              featureType: 'administrative.land_parcel',
              elementType: 'geometry.stroke',
              stylers: [{color: '#dcd2be'}]
            },
            {
              featureType: 'administrative.land_parcel',
              elementType: 'labels.text.fill',
              stylers: [{visibility: "off"}] // stylers: [{color: '#ae9e90'}]
            },
            {
              featureType: 'landscape.natural',
              elementType: 'geometry',
              stylers: [{color: '#dfd2ae'}]
            },
            {
              featureType: 'poi',
              elementType: 'geometry',
              stylers: [{color: '#dfd2ae'}]
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{visibility: "off"}] // stylers: [{color: '#93817c'}]
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry.fill',
              stylers: [{color: '#a5b076'}]
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [{visibility: "off"}] // stylers: [{color: '#447530'}]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{color: '#f5f1e6'}]
            },
            {
              featureType: 'road.arterial',
              elementType: 'geometry',
              stylers: [{color: '#fdfcf8'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{color: '#f8c967'}]
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{color: '#e9bc62'}]
            },
            {
              featureType: 'road.highway.controlled_access',
              elementType: 'geometry',
              stylers: [{color: '#e98d58'}]
            },
            {
              featureType: 'road.highway.controlled_access',
              elementType: 'geometry.stroke',
              stylers: [{color: '#db8555'}]
            },
            {
              featureType: 'road.local',
              elementType: 'labels.text.fill',
              stylers: [{color: '#806b63'}]
            },
            {
              featureType: 'transit.line',
              elementType: 'geometry',
              stylers: [{color: '#dfd2ae'}]
            },
            {
              featureType: 'transit.line',
              elementType: 'labels.text.fill',
              stylers: [{color: '#8f7d77'}]
            },
            {
              featureType: 'transit.line',
              elementType: 'labels.text.stroke',
              stylers: [{color: '#ebe3cd'}]
            },
            {
              featureType: 'transit.station',
              elementType: 'geometry',
              stylers: [{color: '#dfd2ae'}]
            },
            {
              featureType: 'water',
              elementType: 'geometry.fill',
              stylers: [{color: '#b9d3c2'}]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{color: '#92998d'}]
            }
          ];
  map.setOptions({styles: retro});

  fetch('airports.json')
  .then(function(response) {
    return response.json();
  })
  .then(function(airports) {
    console.log(airports);
    var bounds = new google.maps.LatLngBounds();
    for (var id in airports) {
      bounds.extend(airports[id].coords);
      newairport(airports[id].coords, id);
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
