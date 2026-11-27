/* ================= LIVE FARM (Ozhinka's Cheat Sheet mod) =================
   When a farm is connected, the date, fish, bundles, spouse and bus repair come from the game
   (uploaded by the mod each night). Manual checkmarks are kept aside and restored on disconnect. */
const LIVE_API="https://ozhinkas-cheat-sheet.ozhinkas-cheat-sheet-server.workers.dev/api/farms/";
const live={snap:null,updatedAt:null,error:null,loading:false};

// "Wood ×99 (2nd)" → "wood", "The Missing Bundle" → "themissing", "Large Egg (Brown)" → "largeegg"
const liveNorm=s=>String(s).toLowerCase().replace(/\s*×.*$/,"").replace(/\(.*?\)/g,"").replace(/\bbundle\b/g,"").replace(/[^a-z0-9]/g,"");
const liveCode=s=>{const m=String(s||"").toUpperCase().match(/[A-Z2-9]{12}/);return m?m[0]:null;};
// Friendship with a villager for the shown farmer: undefined = no farm connected, null = not met yet
const liveFriend=name=>{if(!st.farmCode||!live.snap)return undefined;const f=liveFarmer(live.snap);return (f&&f.friendships.find(x=>x.npc===name))||null;};
const liveFarmer=s=>s.farmers.find(f=>f.id===st.farmerId)||s.farmers.find(f=>f.isHost)||s.farmers[0];

function applyLive(s){
  st.season=s.date.season;st.day=s.date.day;st.year=s.date.year;
  const f=liveFarmer(s);
  const caught=new Set((f?.fishCaught||[]).map(x=>liveNorm(x.name)));
  st.fish={};FISH.forEach(x=>{if(caught.has(liveNorm(x.n)))st.fish[x.n]=1;});
  st.bundles={};
  const game=new Map(s.communityCenter.bundles.map(b=>[liveNorm(b.name),b]));
  BUNDLES.forEach(b=>{
    const g=game.get(liveNorm(b.n));if(!g)return;
    const left=(g.placed||[]).map(liveNorm);
    b.items.forEach(i=>{const ix=left.indexOf(liveNorm(i));if(ix>=0){st.bundles[b.n+"|"+i]=1;left.splice(ix,1);}});
    // completed bundles (e.g. the Vault's gold) count as fully done
    const need=b.need||b.items.length;let have=b.items.filter(i=>st.bundles[b.n+"|"+i]).length;
    if(g.complete)for(const i of b.items){if(have>=need)break;if(!st.bundles[b.n+"|"+i]){st.bundles[b.n+"|"+i]=1;have++;}}
  });
  st.spouse=f?.spouse||null;
  st.busOK=!!s.communityCenter.rooms.vault;
}

async function liveLoad(){
  if(!st.farmCode||live.loading)return;
  live.loading=true;
  try{
    const r=await fetch(LIVE_API+st.farmCode,{cache:"no-store"});const j=await r.json();
    if(!r.ok)throw new Error(j.error||("error "+r.status));
    live.snap=j.snapshot;live.updatedAt=j.updatedAt;live.error=null;
    applyLive(live.snap);save();syncHeader();render();
  }catch(e){live.error=e.message;}
  live.loading=false;liveBadge();
  if($("modal").classList.contains("open")&&$("farmBox"))farmMenu();
}

function liveConnect(code){
  if(!st.manual)st.manual={season:st.season,day:st.day,year:st.year,fish:st.fish,bundles:st.bundles,spouse:st.spouse??null,busOK:st.busOK??null};
  st.farmCode=code;delete st.farmerId;save();liveLoad();
}
function liveDisconnect(){
  if(st.manual)Object.assign(st,st.manual);
  delete st.manual;delete st.farmCode;delete st.farmerId;
  live.snap=null;live.error=null;save();syncHeader();render();liveBadge();
}

// The character button: while connected it switches between the farm's farmers
function liveBadge(){
  const b=$("charBox");if(!b)return;
  if(!st.farmCode||!live.snap){b.title="Character select (click to switch)";b.classList.remove("live");return;}
  const f=liveFarmer(live.snap);b.classList.add("live");
  b.title=`${f.name} · ${live.snap.farmName} Farm (from the game, updated ${new Date(live.updatedAt).toLocaleString()})`+(live.snap.farmers.length>1?". Click to switch farmer":". Click for farm info");
}
$("charBox").onclick=()=>{
  if(st.farmCode&&live.snap){
    const fs=live.snap.farmers;
    if(fs.length>1){const i=fs.indexOf(liveFarmer(live.snap));st.farmerId=fs[(i+1)%fs.length].id;applyLive(live.snap);save();syncHeader();render();liveBadge();}
    else farmMenu();
    return;
  }
  st.char=st.char==="dog"?"cat":"dog";applyChar();save();
};

function farmMenu(){
  let h=`<h1>${ic("Farmer")} Connect your farm</h1><div id="farmBox">`;
  if(!st.farmCode){
    h+=`<p class="small">With the <b>Ozhinka's Cheat Sheet</b> mod installed, your farm uploads its progress every night when you sleep. Connect it here and the date, fish, bundles and spouse fill in by themselves.</p>
    <p class="small">Your farm code is in the SMAPI console when you load your save (“Farm code: …”).</p>
    <div class="toolbar"><input id="farmCodeIn" placeholder="Farm code or link" style="flex:1;min-width:0;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:inherit;font:inherit"><button class="iconbtn" id="farmGo">Connect</button></div>
    <p class="small muted">Your manual checkmarks are kept safe and come back if you disconnect.</p>`;
  }else{
    const s=live.snap;
    if(live.error)h+=`<p class="small" style="color:var(--love)">Couldn't load the farm: ${esc(live.error)}</p>`;
    if(s){
      h+=`<p><b>${esc(s.farmName)} Farm</b> · ${cap(s.date.season)} ${s.date.day}, Year ${s.date.year}<br><span class="small muted">Last upload: ${new Date(live.updatedAt).toLocaleString()}</span></p>`;
      if(s.farmers.length>1)h+=`<p class="small">Showing: <select id="farmWho">${s.farmers.map(f=>`<option value="${esc(f.id)}" ${f===liveFarmer(s)?"selected":""}>${esc(f.name)}${f.isHost?" (host)":""}</option>`).join("")}</select></p>`;
      else h+=`<p class="small">Farmer: <b>${esc(s.farmers[0]?.name||"?")}</b></p>`;
    }else if(!live.error)h+=`<p class="small muted">Loading…</p>`;
    h+=`<p class="small muted">Farm code: ${esc(st.farmCode)}. While connected, the date, fish, bundles and spouse come from the game and update after each in-game night.</p>
    <div class="toolbar"><button class="iconbtn" id="farmRefresh">Refresh now</button><button class="iconbtn" id="farmOff" style="color:var(--love)">Disconnect</button></div>`;
  }
  openModal(h+"</div>");
  const go=$("farmGo");
  if(go)go.onclick=()=>{const c=liveCode($("farmCodeIn").value);if(!c){alert("That doesn't look like a farm code (12 letters and numbers).");return;}liveConnect(c);farmMenu();};
  if($("farmRefresh"))$("farmRefresh").onclick=()=>liveLoad();
  if($("farmOff"))$("farmOff").onclick=()=>{if(confirm("Disconnect this farm? Your earlier manual checkmarks come back."))liveDisconnect();closeModal();};
  if($("farmWho"))$("farmWho").onchange=e=>{st.farmerId=e.target.value;applyLive(live.snap);save();syncHeader();render();liveBadge();};
}

// Start: a link like index.html?farm=CODE connects straight away (handy on a phone)
(()=>{const p=liveCode(new URLSearchParams(location.search).get("farm"));if(p&&p!==st.farmCode)liveConnect(p);else liveLoad();})();
document.addEventListener("visibilitychange",()=>{if(!document.hidden)liveLoad();});
