var airports = {};

// sweden
airports.arn = { name: "Stockholm Arlanda", coords: {lat: 59.6498, lng: 17.9238} };
airports.bma = { name: "Stockholm Bromma", coords: {lat: 59.3548, lng: 17.9427} };
airports.got = { name: "Göteborg Landvetter", coords: {lat: 57.6688, lng: 12.2923} };
airports.lla = { name: "Luleå Kallax", coords: {lat: 65.3240, lng: 22.0741} };
airports.mmx = { name: "Malmö Sturup", coords: {lat: 55.5355, lng: 13.3724} };
airports.nyo = { name: "Stockholm Skavsta", coords: {lat: 58.7890, lng: 16.9154} };
airports.ume = { name: "Umeå", coords: {lat: 63.7930, lng: 20.2893} };

// usa
airports.bos = { name: "Boston Logan", coords: {lat: 42.3656, lng: -71.0096} };
airports.den = { name: "Denver", coords: {lat: 39.8561, lng: -104.6737} };
airports.iad = { name: "Washington D.C. Dulles", coords: {lat: 38.9531, lng: -77.4565} };
airports.sfo = { name: "San Francisco", coords: {lat: 37.7749, lng: -122.4194} };
airports.mia = { name: "Miami", coords: {lat: 25.7959, lng: -80.2870} };
airports.sea = { name: "Seattle-Tacoma", coords: {lat: 47.4502, lng: -122.3088} };
airports.lax = { name: "Los Angeles", coords: {lat: 33.9416, lng: -118.4085} };
airports.jfk = { name: "New York John F. Kennedy", coords: {lat: 40.6413, lng: -73.7781} };

// europe
airports.aja = { name: "Corsica Ajaccio", coords: {lat: 41.9214, lng: 8.7966} };
airports.biq = { name: "Biarritz", coords: {lat: 43.4692, lng: -1.5303} };
airports.cdg = { name: "Paris Charles de Gaulle", coords: {lat: 49.0097, lng: 2.5479} };
airports.cph = { name: "Copenhagen Kastrup", coords: {lat: 55.6180, lng: 12.6508} };
airports.dub = { name: "Dublin", coords: {lat: 53.4264, lng: -6.2499} };
airports.fco = { name: "Rome Leonardo da Vinci–Fiumicino", coords: {lat: 41.7999, lng: 12.2462} };
airports.hel = { name: "Helsinki", coords: {lat: 60.3210, lng: 24.9529} };
airports.lhr = { name: "London Heathrow", coords: {lat: 51.4700, lng: -0.4543} };
airports.lgw = { name: "London Gatwick", coords: {lat: 51.1537, lng: -0.1821} };
airports.mad = { name: "Madrid", coords: {lat: 40.4839, lng: -3.5680} };
airports.ory = { name: "Paris Orly", coords: {lat: 48.7262, lng: 2.3652} };
airports.osl = { name: "Oslo Gardermoen", coords: {lat: 60.1976, lng: 11.1004} };
airports.szg = { name: "Salzburg Wolfgang Amadeus Mozart", coords: {lat: 47.7926, lng: 13.0029} };
airports.waw = { name: "Warsaw Chopin", coords: {lat: 52.1672, lng: 20.9679} };
airports.zrh = { name: "Zürich", coords: {lat: 47.4582, lng: 8.5555} };

// asia
airports.hkg = { name: "Hong Kong", coords: {lat: 22.3080, lng: 113.9185} };
airports.pek = { name: "Beijing", coords: {lat: 40.0799, lng: 116.6031} };

// africa
airports.rmf = { name: "Marsa Alam", coords: {lat: 25.5588, lng: 34.5882} };
airports.lpa = { name: "Gran Canaria Las Palmas", coords: {lat: 27.9332, lng: -15.3877} };

var map, icon_filled, icon_filled_05, icon_filled_01, flights = [], airport_markers = {};

function newflight(path) {
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

  var bounds = new google.maps.LatLngBounds();
  for (var id in airports) {
    bounds.extend(airports[id].coords);
    newairport(airports[id].coords, id);
  }
  map.fitBounds(bounds);
  // map.setZoom(map.getZoom()-1);

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

  var paths = [
                ["arn", "bos"],
                ["arn", "hel"],
                ["hel", "hkg"],
                ["arn", "pek"],
                ["pek", "hkg"],
                ["sfo", "cph"],
                ["cph", "arn"],
                ["bos", "den"],
                ["arn", "lhr"],
                ["lhr", "iad"],
                ["bos", "lgw"],
                ["lgw", "arn"],
                ["bos", "mia"],
                ["bos", "sea"],
                ["sea", "sfo"],
                ["lax", "bos"],
                ["arn", "jfk"],
                ["nyo", "biq"],
                ["arn", "zrh"],
                ["zrh", "bos"],
                ["arn", "cdg"],
                ["cdg", "bos"],
                ["arn", "ory"],
                ["arn", "rmf"],
                ["bma", "mmx"],
                ["arn", "osl"],
                ["arn", "got"],
                ["arn", "ume"],
                ["nyo", "lpa"],
                ["arn", "fco"],
                ["arn", "szg"],
                ["arn", "waw"],
                ["arn", "dub"],
                ["nyo", "aja"],
                ["mia", "mad"],
                ["mad", "arn"],
                ["cph", "lhr"],
                ["arn", "lla"],
                ["bos", "cph"]
              ];
  for (var i=0; i < paths.length; i++) {
    newflight(paths[i]);
  }
}
