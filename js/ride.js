const BOOKED_KEY = "surokkha_booked_seats_v1";
const DEFAULT_BOOKED = [1,2,10,16]; // matches your screenshot style

let booked = new Set();
let selected = new Set();

function loadBooked(){
  try{
    const saved = JSON.parse(localStorage.getItem(BOOKED_KEY) || "null");
    if(Array.isArray(saved) && saved.length) return new Set(saved);
  }catch(e){}
  return new Set(DEFAULT_BOOKED);
}

function saveBooked(){
  localStorage.setItem(BOOKED_KEY, JSON.stringify(Array.from(booked)));
}

function render(){
  const grid = qs("#seatGrid");
  grid.innerHTML = "";
  for(let i=1;i<=16;i++){
    const d = document.createElement("div");
    d.className = "seat";
    d.textContent = String(i);

    if(booked.has(i)){
      d.classList.add("booked");
    }else{
      d.addEventListener("click", ()=>{
        if(selected.has(i)) selected.delete(i); else selected.add(i);
        render();
      });
    }

    if(selected.has(i)) d.classList.add("selected");
    grid.appendChild(d);
  }
}

function confirm(){
  if(selected.size===0){
    toast("Select at least 1 available seat.", "danger");
    return;
  }
  selected.forEach(s=>booked.add(s));
  saveBooked();

  const route = qs("#route").value.trim();
  const date = qs("#date").value;
  const seats = Array.from(selected).sort((a,b)=>a-b);

  qs("#bookingResult").style.display="block";
  qs("#bookingResult").innerHTML = `
    <b>Booking confirmed ✅</b><br/>
    Seats: <b>${seats.join(", ")}</b><br/>
    ${date ? `Date: <b>${date}</b><br/>` : ""}
    ${route ? `Route: <b>${route}</b><br/>` : ""}
    <span class="help">Saved locally in your browser.</span>
  `;
  toast("Booking saved ✅");
  selected.clear();
  render();
}

document.addEventListener("DOMContentLoaded", ()=>{
  // set date default to today
  const d = new Date();
  const pad = (n)=>String(n).padStart(2,"0");
  qs("#date").value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

  booked = loadBooked();
  render();

  qs("#clearSel").addEventListener("click", ()=>{
    selected.clear();
    qs("#bookingResult").style.display="none";
    render();
  });

  qs("#confirm").addEventListener("click", confirm);
});
