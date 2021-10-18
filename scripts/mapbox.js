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

function geoJsonFeatureFromTrip(trip) {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: trip.coords.map(obj => [obj.lng, obj.lat]),
    },
    properties: {
      between: trip.between,
    },
  };
}

function addSourceAndLayerForTripType(map, type, color, places={}) {
  fetch(`data/${type}.json`, {cache: "no-store"})
    .then(response => response.json())
    .then(paths => {
      map.addSource(type, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: paths.map(trip => {
            switch (type) {
              case 'drives':
              case 'trainrides':
              case 'busrides':
                return geoJsonFeatureFromTrip(trip)
              case 'flights':
              case 'boatrides':
                return flightPathFromFlight(trip, places)
            }
          }),
        },
      });
      map.addLayer(routeLayer(`${type}-layer`, type, color), 'visited-layer');
    });
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
  const lineDistance = turf.lineDistance(route, 'kilometers');

  const arc = [];

  // Number of steps to use in the arc and animation, more steps means
  // a smoother arc and animation, but too many steps will result in a
  // low frame rate
  const steps = 500;

  // Draw an arc between the `origin` & `destination` of the two points
  for (let i = 0; i < lineDistance; i += lineDistance / steps) {
    const segment = turf.along(route, i, 'kilometers');
    arc.push(segment.geometry.coordinates);
  }
  arc.push(route.geometry.coordinates[route.geometry.coordinates.length-1]);

  // Update the route with calculated arc coordinates
  route.geometry.coordinates = arc;
  return route;
}

function routeLayer(id, sourceId, color) {
  const baseWidth = 3;
  const baseZoom = 1;
  return {
    id: id,
    source: sourceId,
    type: 'line',
    paint: {
      "line-width": {
        "type": "exponential",
        "base": 2,
        "stops": [
            [0, baseWidth * Math.pow(2, (0 - baseZoom))],
            [24, baseWidth * Math.pow(2, (18 - baseZoom))]
        ]
      },
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
    'circle-radius': 5,
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
  fetch('data/places.json', {cache: "no-store"})
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
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });
      map.on('mousemove', 'visited-layer', function(e) {
        if (e.features.length > 0) {
          // Create a popup, but don't add it to the map yet.
          const coordinates = e.features[0].geometry.coordinates.slice();
          const name = e.features[0].properties.name;
          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          // Populate the popup and set its coordinates
          // based on the feature found.
          popup
            .setLngLat(coordinates)
            .setHTML(`<strong>${name}</strong>`)
            .addTo(map);

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
        popup.remove();
        if (hoveredPlaceId) {
          map.setFeatureState(
            { source: 'visited', id: hoveredPlaceId },
            { hover: false }
          );
        }
        hoveredPlaceId = null;
      });

      addSourceAndLayerForTripType(map, 'boatrides', '#6666FF', places);
      addSourceAndLayerForTripType(map, 'flights', '#FF6666', places);
      addSourceAndLayerForTripType(map, 'drives', '#6666FF');
      addSourceAndLayerForTripType(map, 'trainrides', '#009933');
      addSourceAndLayerForTripType(map, 'busrides', '#CC00CC');
    });
});
