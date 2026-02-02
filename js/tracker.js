let map, marker, circle;
let watchId = null;
let lastPos = null;

function setTracking(on){
  const dot = qs("#trkDot");
  const st = qs("#trkStatus");
  const btn = qs("#btnStart");
  if(on){
    dot.classList.add("on");
    st.textContent = "ON";
    btn.textContent = "Stop";
  }else{
    dot.classList.remove("on");
    st.textContent = "OFF";
    btn.textContent = "Start";
  }
}

function initMap(){
  map = L.map('map', { zoomControl:true }).setView([23.8103, 90.4125], 12); // default Dhaka
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  marker = L.marker([23.8103, 90.4125]).addTo(map);
  circle = L.circle([23.8103, 90.4125], { radius: 50 }).addTo(map);
}

function update(pos){
  lastPos = pos;
  const { latitude, longitude, accuracy } = pos.coords;
  const lat = latitude.toFixed(6);
  const lng = longitude.toFixed(6);
  const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
  qs("#lat").textContent = lat;
  qs("#lng").textContent = lng;
  qs("#accuracy").textContent = `${Math.round(accuracy)} meters`;
  qs("#updated").textContent = new Date(pos.timestamp).toLocaleTimeString();
  qs("#maps").innerHTML = `<a href="${link}" target="_blank" rel="noopener">Open link</a>`;

  marker.setLatLng([latitude, longitude]);
  circle.setLatLng([latitude, longitude]);
  circle.setRadius(Math.max(accuracy, 20));
  map.setView([latitude, longitude], 16, { animate:true });
}

function start(){
  if(!("geolocation" in navigator)){
    toast("Geolocation not supported.", "danger");
    return;
  }
  setTracking(true);
  toast("Tracking started…");

  watchId = navigator.geolocation.watchPosition(
    update,
    (err)=>{
      toast("Location error: " + err.message, "danger");
      stop();
    },
    { enableHighAccuracy:true, maximumAge:1500, timeout:10000 }
  );
}

function stop(){
  setTracking(false);
  if(watchId){
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  initMap();
  setTracking(false);

  qs("#btnStart").addEventListener("click", ()=>{
    if(watchId) stop(); else start();
  });

  qs("#copyLink").addEventListener("click", async ()=>{
    if(!lastPos){ toast("Start tracking first.", "danger"); return; }
    const { latitude, longitude } = lastPos.coords;
    const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
    await copyText(link);
  });

  qs("#openMaps").addEventListener("click", ()=>{
    if(!lastPos){ toast("Start tracking first.", "danger"); return; }
    const { latitude, longitude } = lastPos.coords;
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank", "noopener");
  });
});
