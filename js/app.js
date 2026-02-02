function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

function toast(msg, type="info"){
  let t = document.createElement("div");
  t.textContent = msg;
  t.style.position="fixed";
  t.style.left="50%";
  t.style.bottom="20px";
  t.style.transform="translateX(-50%)";
  t.style.padding="12px 14px";
  t.style.borderRadius="14px";
  t.style.background= type==="danger" ? "rgba(217,4,41,.92)" : "rgba(6,43,69,.92)";
  t.style.color="white";
  t.style.fontWeight="800";
  t.style.boxShadow="0 14px 30px rgba(0,0,0,.25)";
  t.style.zIndex="9999";
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2400);
}

async function copyText(text){
  try{
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  }catch(e){
    toast("Copy failed (your browser blocked it)", "danger");
  }
}

function goBack(){
  if(history.length>1) history.back();
  else location.href = "index.html";
}
