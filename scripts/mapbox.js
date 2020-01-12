mapboxgl.accessToken =
  'pk.eyJ1IjoibGltYmVybyIsImEiOiJjazU5eTR0Zm8wdWU2M21wM3gybG9udWFmIn0.Ys0BrsAvUY_7Jmii5pnpcg';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/limbero/ck5bf2gyh0p221cp2gzkpzovj',
});

function nonLayoverPlacesToGeoJsonFeatures(places) {
  return Object.entries(places)
    .filter(([_, place]) => !place.layover)
    .map(([placeId, place], i) => myPlaceToGeoJsonFeature(place, placeId, i));
}

function myPlaceToGeoJsonFeature(place, textId, index) {
  return {
    type: 'Feature',
    id: index,
    geometry: {
      type: 'Point',
      coordinates: [place.coords.lng, place.coords.lat],
    },
    properties: {
      name: place.name,
      id: textId,
    },
  };
}

function coordsArray(coordsObject) {
  return [coordsObject.lng, coordsObject.lat];
}

function coordsArraysForFlightPoints(flight, places) {
  return [
    coordsArray(places[flight[0]].coords),
    coordsArray(places[flight[1]].coords),
  ];
}

function flightPathFromFlight(flight, places) {
  // A simple line from origin to destination.
  const route = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordsArraysForFlightPoints(flight, places),
    },
  };

  // Calculate the distance in kilometers between route start/end point.
  var lineDistance = turf.lineDistance(route, 'kilometers');

  var arc = [];

  // Number of steps to use in the arc and animation, more steps means
  // a smoother arc and animation, but too many steps will result in a
  // low frame rate
  var steps = 200;

  // Draw an arc between the `origin` & `destination` of the two points
  for (var i = 0; i < lineDistance; i += lineDistance / steps) {
    var segment = turf.along(route, i, 'kilometers');
    arc.push(segment.geometry.coordinates);
  }

  // Update the route with calculated arc coordinates
  route.geometry.coordinates = arc;
  return route;
}

function routeLayer(id, sourceId, color) {
  return {
    id: id,
    source: sourceId,
    type: 'line',
    paint: {
      'line-width': 1,
      'line-color': color,
    },
  };
}

const visitedLayer = {
  id: 'visited-layer',
  source: {
    type: 'vector',
    url: 'mapbox://mapbox.mapbox-streets-v8',
  },
  source: 'visited',
  type: 'circle',
  paint: {
    'circle-radius': 4,
    'circle-color': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      '#FF6666',
      '#FFFFFF',
    ],
    'circle-stroke-color': '#FF6666',
    'circle-stroke-width': 1,
  },
  layout: {
    // Mapbox Style Specification layout properties
  },
};

map.on('load', () => {
  fetch('data/places.json')
    .then(response => response.json())
    .then(places => {
      map.addSource('visited', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: nonLayoverPlacesToGeoJsonFeatures(places),
        },
      });

      map.addLayer(visitedLayer);

      let hoveredPlaceId;
      map.on('mousemove', 'visited-layer', function(e) {
        if (e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          if (typeof hoveredPlaceId !== 'undefined') {
            map.setFeatureState(
              { source: 'visited', id: hoveredPlaceId },
              { hover: false }
            );
          }
          hoveredPlaceId = e.features[0].id;
          map.setFeatureState(
            { source: 'visited', id: hoveredPlaceId },
            { hover: true }
          );
        }
      });

      map.on('mouseleave', 'visited-layer', function() {
        map.getCanvas().style.cursor = '';
        if (hoveredPlaceId) {
          map.setFeatureState(
            { source: 'visited', id: hoveredPlaceId },
            { hover: false }
          );
        }
        hoveredPlaceId = null;
      });

      fetch('data/flights.json')
        .then(response => response.json())
        .then(paths => {
          map.addSource('flights', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: paths.map(between =>
                flightPathFromFlight(between, places)
              ),
            },
          });
          map.addLayer(routeLayer('flights-layer', 'flights', '#FF6666'), 'visited-layer');
        });

      // let bounds = new google.maps.LatLngBounds();
      // for (let id in places) {
      //   bounds.extend(places[id].coords);
      //   newPlace(places[id].coords, id, places, places[id].layover);
      // }
      // map.fitBounds(bounds);
      // // map.setZoom(map.getZoom()-1);

      // fetch('data/trainrides.json')
      // .then(response => response.json())
      // .then(trainrides => {
      //   trainrides.map(trainride => newTrainRide(trainride.between, trainride.coords));

      //   fetch('data/busrides.json')
      //   .then(response => response.json())
      //   .then(busrides => {
      //     busrides.map(busride => newBusRide(busride.between, busride.coords));

      //     fetch('data/drives.json')
      //     .then(response => response.json())
      //     .then(drives => {
      //       drives.map(drive => newDrive(drive.between, drive.coords));

      //       fetch('data/flights.json')
      //       .then(response => response.json())
      //       .then(paths => paths.map(between => newFlight(between, places)));
      //     });
      //   });
      // });
    });
});
