let spawnedPosition;

var panorama;
var actualPositionMarker;
var yourPositionMarker;
var path;
var map;

const coordinateSet = {
  giubiasco: {
    lat: 46.167943,
    lng: 9.00221,
  },
  locarno: {
    lat: 46.164811,
    lng: 8.797227,
  },
  losone: {
    lat: 46.167904,
    lng: 8.762117,
  },
  lugano: {
    lat: 46.004911,
    lng: 8.951043,
  },
  biasca: {
    lat: 46.359044,
    lng: 8.969399,
  },
  sevran: {
    lat: 48.932313,
    lng: 2.540885,
  },
};

const CIRCLE_RADIUS = 1000;
async function initialize(latLng) {
  document.getElementById("pano").style.pointerEvents = "auto";
  document.getElementById("map").style.pointerEvents = "auto";
  result.innerHTML = "";
  do {
    spawnedPosition = getRandomCoordinate(
      latLng.lat,
      latLng.lng,
      CIRCLE_RADIUS
    );
  } while (await validCoordinates(spawnedPosition.lat, spawnedPosition.lng));

  map = new google.maps.Map(document.getElementById("map"), {
    center: spawnedPosition,
    zoom: 12.5,
    streetViewControl: false,
  });

  panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
    {
      addressControl: false,
      position: spawnedPosition,
      pov: {
        heading: 34,
        pitch: 10,
      },
    }
  );
  map.addListener("click", handlePositionGuess);
}

document.getElementById("selectPlace").addEventListener("change", (event) => {
  initialize(coordinateSet[event.target.value.toString()]);
  resetTimer();
});

const handlePositionGuess = (e) => {
  const distanceInMeters = calculateDistance(
    e.latLng.lng(),
    e.latLng.lat(),
    panorama.getLocation().latLng.lng(),
    panorama.getLocation().latLng.lat()
  );

  yourPositionMarker && yourPositionMarker.setMap(null);
  actualPositionMarker && actualPositionMarker.setMap(null);
  actualPositionMarker = new google.maps.Marker({
    position: e.latLng,
    title: "Your answer",
    map: map,
  });

  document.getElementById("confimationModal");
  $("#confimationModal").modal("show");
  document.getElementById("confirmGuess").addEventListener("click", () => {
    var yourPositionMarkerIcon = {
      path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
      fillColor: "green",
      fillOpacity: 0.8,
      strokeWeight: 0,
      rotation: 0,
      scale: 2,
      anchor: new google.maps.Point(15, 30),
    };

    yourPositionMarker = new google.maps.Marker({
      position: panorama.getLocation().latLng,
      icon: yourPositionMarkerIcon,
      map: map,
    });

    $("#confimationModal").modal("hide");

    // nei 10m sono 1000pt, il massimo, da 10,1 km di distanza sono 0pt

    const timeInMinutes =
      milliseconds / 60000 + seconds / 60 + minutes + hours * 60;
    let points = Math.floor(
      (-1 / 10) * distanceInMeters + timeInMinutes * 1000 + 1010
    );

    if (points < 0) points = 0;
    document.getElementById("result").innerHTML =
      Math.round(distanceInMeters * 100) / 100 + "m - " + points + " pt";

    path && path.setMap(null);
    path = new google.maps.Polyline({
      path: [e.latLng, spawnedPosition],
      geodesic: true,
      strokeColor: "green",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });

    path.setMap(map);

    document.getElementById("pano").style.pointerEvents = "none";
    document.getElementById("map").style.pointerEvents = "none";
    stopTimer();
  });

  document
    .getElementById("cancelGuess")
    .addEventListener("click", () => {
      $("#confimationModal").modal("hide");
      actualPositionMarker.setMap(null);
    })
    .bind(actualPositionMarker);
};

const getRandomCoordinate = (x0, y0, radius) => {
  // Convert radius from meters to degrees
  let radiusInDegrees = radius / 111000;

  let u = Math.random();
  let v = Math.random();
  let w = radiusInDegrees * Math.sqrt(u);
  let t = 2 * Math.PI * v;
  let x = w * Math.cos(t);
  let y = w * Math.sin(t);

  let foundLongitude = x + x0;
  let foundLatitude = y + y0;
  return { lng: foundLatitude, lat: foundLongitude };
};

const calculateDistance = (lon1, lat1, lon2, lat2) => {
  // The math module contains a function
  // named toRadians which converts from
  // degrees to radians.
  lon1 = (lon1 * Math.PI) / 180;
  lon2 = (lon2 * Math.PI) / 180;
  lat1 = (lat1 * Math.PI) / 180;
  lat2 = (lat2 * Math.PI) / 180;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

  let c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth in kilometers. Use 3956
  // for miles
  let r = 6371;

  // calculate the result in meters
  return c * r * 1000;
};
const validCoordinates = (lat, lng) => {
  const endpoint = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=AIzaSyBe5DAYLop4Cjf4ao1gA077ig-3NUsAsKA`;
  return fetch(endpoint)
    .then((res) => res.text())
    .then((result) => JSON.parse(result).status !== "OK");
};

let [milliseconds, seconds, minutes, hours] = [0, 0, 0, 0];
let int = null;

const timerRef = document.getElementById("stopwatch");
function displayTimer() {
  milliseconds += 10;
  if (milliseconds == 1000) {
    milliseconds = 0;
    seconds++;
    if (seconds == 60) {
      seconds = 0;
      minutes++;
      if (minutes == 60) {
        minutes = 0;
        hours++;
      }
    }
  }
  let h = hours < 10 ? "0" + hours : hours;
  let m = minutes < 10 ? "0" + minutes : minutes;
  let s = seconds < 10 ? "0" + seconds : seconds;
  let ms =
    milliseconds < 10
      ? "00" + milliseconds
      : milliseconds < 100
      ? "0" + milliseconds
      : milliseconds;

  timerRef.innerHTML = ` ${h} : ${m} : ${s} : ${ms}`;
}

function resetTimer() {
  clearInterval(int);
  [milliseconds, seconds, minutes, hours] = [0, 0, 0, 0];
  timerRef.innerHTML = "00 : 00 : 00 : 000 ";
  int = setInterval(displayTimer, 10);
}

function stopTimer() {
  clearInterval(int);
}

window.initialize = () => initialize(coordinateSet.giubiasco);
int = setInterval(displayTimer, 10);
