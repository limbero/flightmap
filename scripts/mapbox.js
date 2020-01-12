mapboxgl.accessToken =
  'pk.eyJ1IjoibGltYmVybyIsImEiOiJjazU5eTR0Zm8wdWU2M21wM3gybG9udWFmIn0.Ys0BrsAvUY_7Jmii5pnpcg';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v8',
});
map.on('load', () => {
  fetch('data/places.json')
    .then(response => response.json())
    .then(places => {
      map.addSource('visited-places', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: Object.entries(places)
            .filter(([_, place]) => !place.layover)
            .map(([placeId, place], i) => ({
              type: 'Feature',
              id: i,
              geometry: {
                type: 'Point',
                coordinates: [place.coords.lng, place.coords.lat],
              },
              properties: {
                name: place.name,
                id: placeId,
              },
            })),
        },
      });
      map.addLayer({
        id: 'visited',
        source: {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-streets-v8',
        },
        // 'source-layer': 'poi_label',
        source: 'visited-places',
        type: 'circle',
        paint: {
          'circle-radius': 4,
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#FF0000',
            '#FFFFFF',
          ],
          'circle-stroke-color': '#FF0000',
          'circle-stroke-width': 1,
          // Mapbox Style Specification paint properties
        },
        layout: {
          // Mapbox Style Specification layout properties
        },
      });

      let hoveredPlaceId;
      map.on('mousemove', 'visited', function(e) {
        if (e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          if (typeof hoveredPlaceId !== 'undefined') {
            map.setFeatureState(
              { source: 'visited-places', id: hoveredPlaceId },
              { hover: false }
            );
          }
          hoveredPlaceId = e.features[0].id;
          console.log(hoveredPlaceId);
          map.setFeatureState(
            { source: 'visited-places', id: hoveredPlaceId },
            { hover: true }
          );
        }
      });

      // When the mouse leaves the state-fill layer, update the feature state of the
      // previously hovered feature.
      map.on('mouseleave', 'visited', function() {
        map.getCanvas().style.cursor = '';
        if (hoveredPlaceId) {
          map.setFeatureState(
            { source: 'visited-places', id: hoveredPlaceId },
            { hover: false }
          );
        }
        hoveredPlaceId = null;
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
