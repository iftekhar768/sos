const STORAGE_KEY = "surokkha_reports_v1";
let lastSaved = null;

function loadReports(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  }catch(e){
    return [];
  }
}

function saveReports(reports){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function renderRecent(){
  const list = loadReports().slice(-5).reverse();
  const root = qs("#recent");
  if(!list.length){
    root.innerHTML = `<div class="help">No reports yet.</div>`;
    return;
  }
  root.innerHTML = list.map(r=>`
    <div class="notice" style="margin:10px 0;">
      <b>${r.issueType}</b> • <span>${new Date(r.datetime).toLocaleString()}</span><br/>
      <span class="help">${r.location}</span><br/>
      <span class="help">${(r.description || "").slice(0,80)}${(r.description||"").length>80?"…":""}</span>
    </div>
  `).join("");
}

function nowLocalDatetimeValue(){
  // returns YYYY-MM-DDTHH:MM in local time
  const d = new Date();
  const pad = (n)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getMyLocationIntoField(){
  if(!("geolocation" in navigator)){
    toast("Geolocation not supported.", "danger");
    return;
  }
  toast("Getting your location…");
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      const { latitude, longitude } = pos.coords;
      qs("#loc").value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      toast("Location filled.");
    },
    (err)=>toast("Location error: " + err.message, "danger"),
    { enableHighAccuracy:true, timeout:10000 }
  );
}

function buildSummary(r){
  let s = `Surokkha Issue Report\n\n`;
  s += `Issue: ${r.issueType}\n`;
  s += `Date & Time: ${new Date(r.datetime).toLocaleString()}\n`;
  s += `Location: ${r.location}\n`;
  s += `Description: ${r.description}\n`;
  if(r.attachmentName) s += `Attachment: ${r.attachmentName}\n`;
  s += `Report ID: ${r.id}\n`;
  return s;
}

function downloadJson(r){
  const blob = new Blob([JSON.stringify(r, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `surokkha-report-${r.id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

document.addEventListener("DOMContentLoaded", ()=>{
  qs("#dt").value = nowLocalDatetimeValue();
  renderRecent();

  qs("#useMyLoc").addEventListener("click", getMyLocationIntoField);

  qs("#issueForm").addEventListener("submit", (e)=>{
    e.preventDefault();

    const issueType = qs("#issueType").value;
    const datetime = qs("#dt").value;
    const location = qs("#loc").value.trim();
    const description = qs("#desc").value.trim();
    const file = qs("#file").files[0];

    if(!datetime){ toast("Please choose date & time.", "danger"); return; }
    if(!location){ toast("Please enter location.", "danger"); return; }
    if(description.length < 20){ toast("Description must be at least 20 characters.", "danger"); return; }

    const report = {
      id: Math.random().toString(16).slice(2,10).toUpperCase(),
      createdAt: new Date().toISOString(),
      issueType, datetime,
      location,
      description,
      attachmentName: file ? file.name : ""
    };

    const reports = loadReports();
    reports.push(report);
    saveReports(reports);
    lastSaved = report;

    qs("#resultText").textContent = `Saved locally with ID ${report.id}. You can download or copy a summary.`;
    qs("#result").style.display = "block";
    toast("Report saved ✅");

    // reset form (keep datetime)
    qs("#desc").value = "";
    qs("#file").value = "";
    renderRecent();
  });

  qs("#downloadJson").addEventListener("click", ()=>{
    if(!lastSaved) return;
    downloadJson(lastSaved);
  });

  qs("#copySummary").addEventListener("click", async ()=>{
    if(!lastSaved) return;
    await copyText(buildSummary(lastSaved));
  });
});
