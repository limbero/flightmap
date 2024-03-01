// couldn't have done this without http://blog.mastermaps.com/2013/09/creating-webgl-earth-with-threejs.html
// and http://www.brunodigiuseppe.com/en/flight-paths-with-three-js/

let place_markers = {};
let trip_lines = {};
let place_marker_list = [];
let trip_line_list = [];
let trip_list;

let tripShown;

let emoji = {
  busride: '🚌',
  trainride: '🚂',
  drive: '🚗',
  flight: '✈️',
};

let scene;
let camera;
let controls;
let renderer;
let globeMesh;
let cloudMesh;

document.addEventListener('DOMContentLoaded', async event => {
  initiateGlobeWithClouds();

  let lastTimeMsec = null;
  requestAnimationFrame(function animate(nowMsec) {
    // keep looping
    requestAnimationFrame(animate);
    // measure time
    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
    let deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
    lastTimeMsec = nowMsec;

    // earthMesh.rotateY(1/64 * deltaMsec/1000);
    cloudMesh.rotateY(((1 / 64) * deltaMsec) / 1000);

    controls.update();
    renderer.clear();
    renderer.render(scene, camera);
  });

  await fetchAllData();

  let infobox = document.getElementById('infobox');
  infobox.getElementsByTagName('h2')[0].innerHTML = 'Trips';

  let div = document.createElement('div');
  trip_list.forEach((trip, index) => {
    let p = document.createElement('p');
    let a = document.createElement('a');
    a.innerHTML = `${trip.name} (${trip.when})`;
    a.setAttribute('data-index', index);

    a.onclick = event => {
      let index = event.target.getAttribute('data-index');
      if (tripShown === index) {
        tripShown = undefined;
        toggleAllVisibility(true);
      } else {
        showTrip(index);
        tripShown = index;
      }
    };
    p.appendChild(a);
    div.appendChild(p);
  });
  let p = infobox.getElementsByTagName('p')[0];
  while (p.hasChildNodes()) {
    p.removeChild(p.lastChild);
  }
  infobox.appendChild(div);

  infobox.style.visibility = 'visible';
});

function fetchJson(uri) {
  return fetch(uri).then(response => response.json());
}
async function fetchAllData() {
  const places = await fetchJson('data/places.json');

  Object.keys(places).forEach(key => {
    let place = makeMarker(places[key].coords, 0xffffff, key);
    place_markers[key] = place;
    place_marker_list.push(place);
    earthMesh.add(place);
  });

  const flights = await fetchJson('data/flights.json');
  flights.forEach(flight => {
    let [to, from] = flight;
    addFlight(places[from].coords, places[to].coords, earthMesh, from, to);
  });

  const drives = await fetchJson('data/drives.json');
  drives.forEach(drive => {
    addDrive(drive.coords, earthMesh, drive.between[0], drive.between[1]);
  });

  const busrides = await fetchJson('data/busrides.json');
  busrides.forEach(busride => {
    addBusRide(
      busride.coords,
      earthMesh,
      busride.between[0],
      busride.between[1]
    );
  });

  const trainrides = await fetchJson('data/trainrides.json');
  trainrides.forEach(trainride => {
    addTrainRide(
      trainride.coords,
      earthMesh,
      trainride.between[0],
      trainride.between[1]
    );
  });

  const trips = await fetchJson('data/trips.json');
  trip_list = trips.sort((a, b) => {
    return a.when - b.when;
  });
}

function initiateGlobeWithClouds() {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  renderer.setClearColor(0xffffff, 0.0);

  document.getElementById('globe').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
  );
  camera.position.z = 300;

  let ambientLight = new THREE.AmbientLight(0x999999);
  scene.add(ambientLight);

  let directionalLight = new THREE.DirectionalLight(0xcccccc, 1);
  directionalLight.position.set(0, 250, 250);
  scene.add(directionalLight);

  let earthGeometry = new THREE.SphereGeometry(100, 64, 32);

  let earthMaterial = new THREE.MeshPhongMaterial();
  earthMaterial.map = new THREE.TextureLoader().load('globe/earth_4k.jpg');
  earthMaterial.bumpMap = new THREE.TextureLoader().load(
    'globe/earth_bump_4k.jpg'
  );
  earthMaterial.bumpScale = 1;
  earthMaterial.specularMap = new THREE.TextureLoader().load(
    'globe/water_4k.png'
  );
  earthMaterial.specular = new THREE.Color('grey');
  earthMaterial.shininess = 5;

  earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);

  let cloudGeometry = new THREE.SphereGeometry(103, 64, 32);
  let cloudMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load('globe/fair_clouds_4k.png'),
    side: THREE.DoubleSide,
    opacity: 1,
    transparent: true,
    depthWrite: false,
  });
  cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloudMesh.name = 'clouds';
  earthMesh.add(cloudMesh);

  scene.add(earthMesh);

  controls = new THREE.OrbitControls(camera);
  controls.minDistance = 150;
  controls.maxDistance = 500;
  controls.enableDamping = true;
  controls.dampingFactor = 0.5;
}

function toggleAllVisibility(bool) {
  place_marker_list.forEach(marker => {
    marker.visible = bool;
  });
  trip_line_list.forEach(trip => {
    trip.visible = bool;
  });
}
function showTrip(index) {
  toggleAllVisibility(false);
  let trip = trip_list[index];
  trip.legs.forEach(leg => {
    place_markers[leg.from].visible = true;
    for (let i = 0; i < trip_lines[leg.from].length; i++) {
      let line = trip_lines[leg.from][i];
      if (line.to === leg.to && line.type === leg.type) {
        line.trip.visible = true;
        break;
      }
    }
  });
}

function addBusRide(coords, scene, loc1, loc2) {
  addComplexPath(coords, scene, 0xcc00cc, loc1, loc2, 'busride');
}

function addDrive(coords, scene, loc1, loc2) {
  addComplexPath(coords, scene, 0x003399, loc1, loc2, 'drive');
}

function addFlight(from, to, scene, loc1, loc2) {
  let vT = convertCoordsToVec3(to);
  let vF = convertCoordsToVec3(from);

  let flight = makeFlightPath(vF, vT);
  addToTripLines(flight, loc1, loc2, 'flight');
  scene.add(flight);
}

function addTrainRide(coords, scene, loc1, loc2) {
  addComplexPath(coords, scene, 0x009933, loc1, loc2, 'trainride');
}

function addComplexPath(coords, scene, color, loc1, loc2, type) {
  let geometry = new THREE.Geometry();
  geometry.vertices = coords.map(coord => convertCoordsToVec3(coord));

  let line = new MeshLine();
  line.setGeometry(geometry, p => {
    return 1 * Maf.parabola(p, 1);
  });

  let meshMaterial = new MeshLineMaterial({
    lineWidth: 0.3,
    color: new THREE.Color(color),
  });

  let mesh = new THREE.Mesh(line.geometry, meshMaterial);
  addToTripLines(mesh, loc1, loc2, type);
  scene.add(mesh);
}

function addToTripLines(trip, loc1, loc2, type) {
  trip_line_list.push(trip);
  if (!trip_lines.hasOwnProperty(loc1)) {
    trip_lines[loc1] = [];
  }
  trip_lines[loc1].push({ trip: trip, to: loc2, type: type });

  if (!trip_lines.hasOwnProperty(loc2)) {
    trip_lines[loc2] = [];
  }
  trip_lines[loc2].push({ trip: trip, to: loc1, type: type });
}

// credit to http://www.brunodigiuseppe.com/en/flight-paths-with-three-js/
function makeFlightPath(vF, vT) {
  let dist = vF.distanceTo(vT);
  let radius = 68 + dist / 7;

  // here we are creating the control points for the first ones.
  // the 'c' in front stands for control.
  let cvT = vT.clone();
  let cvF = vF.clone();

  // then you get the half point of the vectors points.
  let xC = 0.5 * (vF.x + vT.x);
  let yC = 0.5 * (vF.y + vT.y);
  let zC = 0.5 * (vF.z + vT.z);

  // then we create a vector for the midpoints.
  let mid = new THREE.Vector3(xC, yC, zC);

  let smoothDist = map(dist, 0, 10, 0, 15 / dist);

  mid.setLength(radius * smoothDist);

  cvT.add(mid);
  cvF.add(mid);

  cvT.setLength(radius * smoothDist);
  cvF.setLength(radius * smoothDist);

  let curve = new THREE.CubicBezierCurve3(vF, cvF, cvT, vT);

  let curveGeometry = new THREE.Geometry();
  curveGeometry.vertices = curve.getPoints(50);

  let line = new MeshLine();
  line.setGeometry(curveGeometry, p => {
    return 1 * Maf.parabola(p, 1);
  });

  let meshMaterial = new MeshLineMaterial({
    lineWidth: 0.5,
    color: new THREE.Color(0x990033),
  });

  let mesh = new THREE.Mesh(line.geometry, meshMaterial);

  return mesh;
}
function map(x, in_min, in_max, out_min, out_max) {
  return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

// credit to stemkoski @ github
function convertCoordsToVec3(coords) {
  let lat = coords.lat;
  let lon = coords.lng;
  lat = (lat * Math.PI) / 180.0;
  lon = (-lon * Math.PI) / 180.0;
  return new THREE.Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.sin(lon)
  ).multiplyScalar(100);
}
function makeMarker(coordinates, color, name) {
  let marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 16),
    new THREE.MeshBasicMaterial({ color: color })
  );
  let coords = convertCoordsToVec3(coordinates);
  marker.position.set(coords.x, coords.y, coords.z);
  marker.name = name;
  return marker;
}
