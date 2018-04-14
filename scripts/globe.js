// couldn't have done this without http://blog.mastermaps.com/2013/09/creating-webgl-earth-with-threejs.html
// and http://www.brunodigiuseppe.com/en/flight-paths-with-three-js/

let renderer	= new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
renderer.setClearColor(0xFFFFFF, 0.0);

document.body.appendChild(renderer.domElement);

let scene	= new THREE.Scene();
scene.background = new THREE.Color( 0xFFFFFF );

let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.z = 400;

let ambientLight	= new THREE.AmbientLight(0x999999);
scene.add(ambientLight);

let directionalLight	= new THREE.DirectionalLight(0xCCCCCC, 1);
directionalLight.position.set(0, 250, 250);
scene.add(directionalLight);

let earthGeometry = new THREE.SphereGeometry(100, 64, 32);

let earthMaterial = new THREE.MeshPhongMaterial();
earthMaterial.map = new THREE.TextureLoader().load('globe/earth_4k_2.jpg');
earthMaterial.bumpMap = new THREE.TextureLoader().load('globe/earth_bump_4k_2.jpg');
earthMaterial.bumpScale = 1;
earthMaterial.specularMap = new THREE.TextureLoader().load('globe/water_4k.png');
earthMaterial.specular = new THREE.Color('grey');
earthMaterial.shininess = 5;

let earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);

let cloudGeometry = new THREE.SphereGeometry(103, 64, 32)
let cloudMaterial = new THREE.MeshPhongMaterial({
  map: new THREE.TextureLoader().load('globe/fair_clouds_4k.png'),
  side: THREE.DoubleSide,
  opacity: 1,
  transparent: true,
  depthWrite: false,
});
let cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial)
earthMesh.add(cloudMesh)

scene.add(earthMesh);

let controls = new THREE.OrbitControls(camera);
controls.minDistance = 200;
controls.maxDistance = 500;
controls.enableDamping = true;
controls.dampingFactor = 0.5;

let lastTimeMsec = null;
requestAnimationFrame(function animate(nowMsec) {
  // keep looping
  requestAnimationFrame(animate);
  // measure time
  lastTimeMsec	= lastTimeMsec || nowMsec - 1000/60;
  let deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
  lastTimeMsec	= nowMsec;
  
  // earthMesh.rotateY(1/64 * deltaMsec/1000);
  // cloudMesh.rotateY(1/128 * deltaMsec/1000);

  controls.update();
	renderer.clear();
  renderer.render(scene, camera);
});

fetch('data/places.json')
.then(response => response.json())
.then(places => {
  Object.keys(places).forEach(key => {
    earthMesh.add(makeMarker(places[key].coords, 0xFFFFFF));
  });

  fetch('data/flights.json')
  .then(response => response.json())
  .then(flights => {
    flights.forEach(flight => {
      let [to, from] = flight;
      addFlight(places[from].coords, places[to].coords, earthMesh);
    });
  });

  fetch('data/drives.json')
  .then(response => response.json())
  .then(drives => {
    drives.forEach(drive => {
      addDrive(drive.coords, earthMesh);
    });
  });

  fetch('data/busrides.json')
  .then(response => response.json())
  .then(drives => {
    drives.forEach(drive => {
      addBusRide(drive.coords, earthMesh);
    });
  });

  fetch('data/trainrides.json')
  .then(response => response.json())
  .then(drives => {
    drives.forEach(drive => {
      addTrainRide(drive.coords, earthMesh);
    });
  });
});

function addBusRide(coords, scene) {
  addComplexPath(coords, scene, 0xCC00CC);
}

function addDrive(coords, scene) {
  addComplexPath(coords, scene, 0x003399);
}

function addFlight(from, to, scene) {
  let vT = convertCoordsToVec3(to);
  let vF = convertCoordsToVec3(from);

  scene.add(makeFlightPath(vF, vT));
}

function addTrainRide(coords, scene) {
  addComplexPath(coords, scene, 0x009933);
}

function addComplexPath(coords, scene, color) {
  let geometry = new THREE.Geometry();
  geometry.vertices = coords.map(coord => convertCoordsToVec3(coord));

  let line = new MeshLine();
  line.setGeometry(geometry, (p) => { return 1 * Maf.parabola(p, 1); });

  let meshMaterial = new MeshLineMaterial({
    lineWidth: 0.3,
    color: new THREE.Color(color)
  });

  let mesh = new THREE.Mesh(line.geometry, meshMaterial);
  scene.add(mesh);
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
  let xC = ( 0.5 * (vF.x + vT.x) );
  let yC = ( 0.5 * (vF.y + vT.y) );
  let zC = ( 0.5 * (vF.z + vT.z) );

  // then we create a vector for the midpoints.
  let mid = new THREE.Vector3(xC, yC, zC);

  let smoothDist = map(dist, 0, 10, 0, 15/dist );

  mid.setLength( radius * smoothDist );
  
  cvT.add(mid);
  cvF.add(mid);
  
  cvT.setLength( radius * smoothDist );
  cvF.setLength( radius * smoothDist );

  let curve = new THREE.CubicBezierCurve3( vF, cvF, cvT, vT );

  let curveGeometry = new THREE.Geometry();
  curveGeometry.vertices = curve.getPoints( 50 );

  let line = new MeshLine();
  line.setGeometry(curveGeometry, (p) => { return 1 * Maf.parabola(p, 1); });

  let meshMaterial = new MeshLineMaterial({
    lineWidth: 0.5,
    color: new THREE.Color(0x990033)
  });

  let mesh = new THREE.Mesh(line.geometry, meshMaterial);

  return mesh;
}
function map( x,  in_min,  in_max,  out_min,  out_max){
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// credit to stemkoski @ github
function convertCoordsToVec3(coords) {
  let lat = coords.lat;
  let lon = coords.lng;
  lat =  lat * Math.PI / 180.0;
  lon = -lon * Math.PI / 180.0;
  return new THREE.Vector3( 
    Math.cos(lat) * Math.cos(lon), 
    Math.sin(lat), 
    Math.cos(lat) * Math.sin(lon) ).multiplyScalar(100);
}
function makeMarker(coordinates, color) {
  let marker = new THREE.Mesh( new THREE.SphereGeometry(0.3, 32, 16), new THREE.MeshBasicMaterial({color: color}) );
  let coords = convertCoordsToVec3(coordinates);
  marker.position.set(coords.x, coords.y, coords.z);
  return marker;
}
