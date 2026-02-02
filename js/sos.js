let watchId = null;
let latest = null;

function formatCoord(n){ return (typeof n==="number") ? n.toFixed(6) : "—"; }

function setStatus(on){
  const dot = qs("#sosDot");
  const status = qs("#sosStatus");
  if(on){
    dot.classList.add("danger");
    status.textContent = "ON";
  }else{
    dot.classList.remove("danger");
    status.textContent = "OFF";
  }
}

function updateUI(pos){
  latest = pos;
  const { latitude, longitude, accuracy } = pos.coords;
  const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
  qs("#coords").textContent = `${formatCoord(latitude)}, ${formatCoord(longitude)}`;
  qs("#acc").textContent = `${Math.round(accuracy)} meters`;
  qs("#mapLink").innerHTML = `<a href="${link}" target="_blank" rel="noopener">Open in Google Maps</a>`;
}

function startSOS(){
  if(!("geolocation" in navigator)){
    toast("Geolocation not supported on this device.", "danger");
    return;
  }
  setStatus(true);
  toast("SOS activated. Getting live location…");

  // Live tracking:
  watchId = navigator.geolocation.watchPosition(
    (pos)=>{ updateUI(pos); },
    (err)=>{
      toast("Location error: " + err.message, "danger");
      setStatus(false);
      if(watchId) navigator.geolocation.clearWatch(watchId);
      watchId = null;
    },
    { enableHighAccuracy:true, maximumAge:2000, timeout:10000 }
  );
}

function stopSOS(){
  setStatus(false);
  if(watchId){
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  toast("SOS stopped.");
}

function buildSosMessage(){
  const dest = qs("#dest").value.trim();
  if(!latest) return "SOS: I need help. My location is not available yet. Please call me.";
  const { latitude, longitude } = latest.coords;
  const maps = `https://www.google.com/maps?q=${latitude},${longitude}`;
  let msg = `SOS: I need help.\n\nMy live location: ${maps}\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n`;
  if(dest) msg += `\nSafety destination: ${dest}\n`;
  msg += `\nPlease contact me immediately and/or alert security.`;
  return msg;
}

function openDirections(){
  const dest = qs("#dest").value.trim();
  if(!latest){
    toast("Turn SOS on first to get your current location.", "danger");
    return;
  }
  if(!dest){
    toast("Add a safety destination (optional) to open directions.", "danger");
    return;
  }
  const { latitude, longitude } = latest.coords;
  const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
  window.open(url, "_blank", "noopener");
}

document.addEventListener("DOMContentLoaded", ()=>{
  setStatus(false);

  const btn = qs("#sosBtn");
  btn.addEventListener("click", ()=>{
    if(watchId) stopSOS(); else startSOS();
  });
  btn.addEventListener("keydown", (e)=>{
    if(e.key==="Enter" || e.key===" "){ e.preventDefault(); btn.click(); }
  });

  qs("#btnCopyMsg").addEventListener("click", async ()=>{
    const msg = buildSosMessage();
    await copyText(msg);
  });

  qs("#btnDirections").addEventListener("click", openDirections);
});
