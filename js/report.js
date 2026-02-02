const STORAGE_KEY = "surokkha_reports_v1";
let lastSaved = null;

// Keep attachment in memory for PDF download (works in same session)
let lastAttachmentDataUrl = null;
let lastAttachmentType = "";

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

// ---------- PDF HELPERS ----------

function readFileAsDataURL(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ()=> resolve(reader.result);
    reader.onerror = ()=> reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getImageSize(dataUrl){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=> resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Download report as PDF and embed image if provided.
 * Requires jsPDF:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 */
async function downloadPdf(r, attachmentDataUrl = null, attachmentType = ""){
  const { jsPDF } = (window.jspdf || {});
  if(!jsPDF){
    toast("PDF library not loaded (jsPDF). Check report.html script.", "danger");
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = 60;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Surokkha — Issue Report", margin, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Report ID: ${r.id}`, margin, y);

  y += 14;
  doc.text(`Created: ${new Date(r.createdAt).toLocaleString()}`, margin, y);

  y += 18;
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 22;

  const printRow = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const text = String(value || "");
    const wrapped = doc.splitTextToSize(text, pageW - margin * 2 - 110);
    doc.text(wrapped, margin + 110, y);

    y += Math.max(18, wrapped.length * 14);
  };

  printRow("Issue Type:", r.issueType);
  printRow("Date & Time:", new Date(r.datetime).toLocaleString());
  printRow("Location:", r.location);
  printRow("Attachment:", r.attachmentName ? r.attachmentName : "None");

  // Description
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Description:", margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const descLines = doc.splitTextToSize(String(r.description || ""), pageW - margin * 2);
  doc.text(descLines, margin, y);

  y += descLines.length * 14 + 18;

  // Embed image (if image attachment)
  if(attachmentDataUrl && attachmentType && attachmentType.startsWith("image/")){
    // Ensure enough space, otherwise add new page
    if (y > pageH - margin - 200) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Attached Image:", margin, y);
    y += 12;

    // Get image dimensions
    let dim;
    try {
      dim = await getImageSize(attachmentDataUrl);
    } catch (e) {
      // If image can't be read, skip embed
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("(Could not load image preview)", margin, y);
      doc.save(`surokkha-report-${r.id}.pdf`);
      return;
    }

    const maxW = pageW - margin * 2;
    const maxH = 360; // keep it clean on one page

    let drawW = maxW;
    let drawH = (dim.h / dim.w) * drawW;

    if(drawH > maxH){
      drawH = maxH;
      drawW = (dim.w / dim.h) * drawH;
    }

    // Center the image horizontally in page content area
    const x = margin + (maxW - drawW) / 2;

    // Add new page if needed
    if (y + drawH > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    // Determine format
    const fmt =
      attachmentType.includes("png") ? "PNG" :
      attachmentType.includes("webp") ? "WEBP" :
      "JPEG";

    // Draw a light border box (optional)
    doc.setDrawColor(180);
    doc.rect(x - 2, y - 2, drawW + 4, drawH + 4);

    // Add image
    doc.addImage(attachmentDataUrl, fmt, x, y, drawW, drawH);

    y += drawH + 14;
  }

  doc.save(`surokkha-report-${r.id}.pdf`);
}

document.addEventListener("DOMContentLoaded", ()=>{
  qs("#dt").value = nowLocalDatetimeValue();
  renderRecent();

  qs("#useMyLoc").addEventListener("click", getMyLocationIntoField);

  qs("#issueForm").addEventListener("submit", async (e)=>{
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

    // Read attachment into memory (for PDF embedding)
    lastAttachmentDataUrl = null;
    lastAttachmentType = "";

    if(file){
      lastAttachmentType = file.type || "";
      if(lastAttachmentType.startsWith("image/")){
        try{
          lastAttachmentDataUrl = await readFileAsDataURL(file);
        }catch(err){
          lastAttachmentDataUrl = null;
          toast("Could not read image file. PDF will download without image.", "danger");
        }
      }
    }

    qs("#resultText").textContent = `Saved locally with ID ${report.id}. PDF downloaded. You can also copy a summary.`;
    qs("#result").style.display = "block";
    toast("Report saved ✅");

    // ✅ Auto-download PDF after submit (with embedded image if available)
    await downloadPdf(report, lastAttachmentDataUrl, lastAttachmentType);

    // reset form (keep datetime)
    qs("#desc").value = "";
    qs("#file").value = "";
    renderRecent();
  });

  // Keep the same button id, but download PDF now
  qs("#downloadJson").addEventListener("click", async ()=>{
    if(!lastSaved) return;
    await downloadPdf(lastSaved, lastAttachmentDataUrl, lastAttachmentType);
  });

  qs("#copySummary").addEventListener("click", async ()=>{
    if(!lastSaved) return;
    await copyText(buildSummary(lastSaved));
  });
});
