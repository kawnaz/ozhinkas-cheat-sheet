/* ================= LIVE FARM (Ozhinka's Cheat Sheet mod) =================
   When a farm is connected, the date, fish, bundles, spouse and bus repair come from the game
   (uploaded by the mod each night). Manual checkmarks are kept aside and restored on disconnect. */
const LIVE_API="https://ozhinkas-cheat-sheet.ozhinkas-cheat-sheet-server.workers.dev/api/farms/";
// "missing": the server doesn't know this code (not shared yet, or a typo): stop asking every 15 seconds
// until the page is shown again or Refresh is pressed. "fromLink": opened from a ?farm= link.
const live={snap:null,updatedAt:null,error:null,missing:false,fromLink:false,loading:false};

// "Wood ×99 (2nd)" → "wood", "The Missing Bundle" → "themissing", "Large Egg (Brown)" → "largeegg"
const liveNorm=s=>String(s).toLowerCase().replace(/\s*×.*$/,"").replace(/\(.*?\)/g,"").replace(/\bbundle\b/g,"").replace(/[^a-z0-9]/g,"");
const liveCode=s=>{const m=String(s||"").toUpperCase().match(/[A-Z2-9]{12}/);return m?m[0]:null;};
// Friendship with a villager for the shown farmer: undefined = no farm connected, null = not met yet
const liveFriend=name=>{if(!st.farmCode||!live.snap)return undefined;const f=liveFarmer(live.snap);return (f&&f.friendships.find(x=>x.npc===name))||null;};
// the farmer's picture sent by the mod (farmers[i].avatar, a small PNG data URL); null = show the cat instead.
// Only plain base64 PNG/GIF/WebP data URLs are accepted, so nothing else can sneak into the page's styles.
const liveAvatar=f=>{const a=f&&f.avatar;return typeof a==="string"&&a.length<400000&&/^data:image\/(png|gif|webp);base64,[A-Za-z0-9+\/=]+$/.test(a)?a:null;};
// a farmer's face as HTML: their avatar, or the cat/dog placeholder
const farmerFace=(f,cls="")=>{const a=liveAvatar(f);return a?`<span class="pchar pchar-av ${cls}" style="background-image:url(&quot;${a}&quot;)"></span>`:`<span class="pchar pchar-${st.char==="dog"?"dog":"cat"} ${cls}"></span>`;};
// farmers with a name (an unclaimed cabin's farmhand comes with an empty name and is left out)
const liveFarmers=s=>{const l=s.farmers.filter(f=>String(f.name||"").trim());return l.length?l:s.farmers;};
const liveFarmer=s=>{const l=liveFarmers(s);return l.find(f=>f.id===st.farmerId)||l.find(f=>f.isHost)||l[0];};

function applyLive(s){
  st.season=s.date.season;st.day=s.date.day;st.year=s.date.year;
  const f=liveFarmer(s);
  // match by the game's item id ("(O)705" -> 705), so it works in any game language; older snapshots without ids match by English name
  const got=f?.fishCaught||[];
  const ids=new Set(got.map(x=>String(x.id||"").replace(/^\(O\)/,"")).filter(Boolean)), names=new Set(got.map(x=>liveNorm(x.name)));
  st.fish={};FISH.forEach(x=>{if(ids.has(String(x.id))||names.has(liveNorm(x.n)))st.fish[x.n]=1;});
  st.bundles={};
  const game=new Map(s.communityCenter.bundles.map(b=>[liveNorm(b.name),b]));
  // rooms the game says are finished count as fully done (the game never marks the Vault's gold bundles "complete")
  const rm=s.communityCenter.rooms||{}, ccAll=!!s.communityCenter.complete;
  const roomDone={"Pantry":rm.pantry,"Crafts Room":rm.craftsRoom,"Fish Tank":rm.fishTank,"Boiler Room":rm.boilerRoom,"Vault":rm.vault,"Bulletin Board":rm.bulletin};
  BUNDLES.forEach(b=>{
    const g=game.get(liveNorm(b.n));if(!g)return;
    // the mod reports paid Vault gold as "gold"; match it to the bundle's amount ("2,500g")
    const left=(g.placed||[]).map(x=>liveNorm(x)==="gold"&&/^[\d,]+g$/.test(b.items[0])?liveNorm(b.items[0]):liveNorm(x));
    b.items.forEach(i=>{const ix=left.indexOf(liveNorm(i));if(ix>=0){st.bundles[b.n+"|"+i]=1;left.splice(ix,1);}});
    // completed bundles count as fully done
    const need=b.need||b.items.length;let have=b.items.filter(i=>st.bundles[b.n+"|"+i]).length;
    if(g.complete||roomDone[b.room]||(ccAll&&b.room in roomDone))for(const i of b.items){if(have>=need)break;if(!st.bundles[b.n+"|"+i]){st.bundles[b.n+"|"+i]=1;have++;}}
  });
  st.spouse=f?.spouse||null;
  st.busOK=!!s.communityCenter.rooms.vault;
}

async function liveLoad(){
  if(!st.farmCode||live.loading)return;
  live.loading=true;
  try{
    const r=await fetch(LIVE_API+st.farmCode,{cache:"no-store"});const j=await r.json();
    if(!r.ok){if(r.status===404||r.status===400||/not found|bad farm code/i.test(j.error||""))live.missing=true;throw new Error(j.error||("error "+r.status));}
    const fresh=!live.snap||j.updatedAt!==live.updatedAt;
    live.snap=j.snapshot;live.updatedAt=j.updatedAt;live.error=null;live.missing=false;
    if(fresh){applyLive(live.snap);save();syncHeader();render();}
  }catch(e){live.error=e.message;}
  live.loading=false;liveBadge();
  if($("modal").classList.contains("open")&&$("farmBox"))farmMenu();
  else if(live.missing&&live.fromLink&&!live.snap)farmMenu(); // opened from a link that doesn't work: say why
  live.fromLink=false;
}

function liveConnect(code){
  if(!st.manual)st.manual={season:st.season,day:st.day,year:st.year,fish:st.fish,bundles:st.bundles,spouse:st.spouse??null,busOK:st.busOK??null};
  st.farmCode=code;delete st.farmerId;live.snap=null;live.error=null;live.missing=false;save();liveLoad();
}
function liveDisconnect(){
  if(st.manual)Object.assign(st,st.manual);
  delete st.manual;delete st.farmCode;delete st.farmerId;
  live.snap=null;live.error=null;live.missing=false;save();syncHeader();render();liveBadge();
}

// The character button: while connected it switches between the farm's farmers
function liveBadge(){
  const b=$("charBox");if(!b)return;
  if(!st.farmCode||!live.snap){b.title="Save & share progress, connect your farm";b.setAttribute("aria-label","Save and share progress");b.classList.remove("live");applyChar();return;}
  applyChar(); // header icon follows the shown farmer
  const f=liveFarmer(live.snap);b.classList.add("live");
  b.title=`${f.name} · ${live.snap.farmName} Farm (from the game, updated ${new Date(live.updatedAt).toLocaleString()})`+". Click to switch farmer, farm info and saving";b.setAttribute("aria-label","Farmer and farm connection");
}
// no farm connected: the chest (save & share). Farm connected: the farmer's face; clicking it drops down a menu
// with the farm's other farmers (the one shown in the box is left out) and the farm connection / saving.
$("charBox").onclick=e=>{e.stopPropagation();if(st.farmCode&&live.snap)charPop();else saveMenu();};
function charPop(open){
  let p=$("charPop");const was=!!p;
  if(open===false||was){if(p)p.remove();$("charBox").setAttribute("aria-expanded","false");if(was||open===false)return;}
  const s=live.snap,cur=liveFarmer(s),others=liveFarmers(s).filter(f=>f!==cur);
  p=document.createElement("div");p.id="charPop";p.className="char-pop";p.setAttribute("role","menu");
  p.innerHTML=(others.length?others.map(f=>`<button type="button" role="menuitem" class="cp-item" data-farmer="${esc(f.id)}">${farmerFace(f)}<span class="cp-name">${esc(f.name)}${f.isHost?' <i class="cp-host">host</i>':""}</span></button>`).join("")
    :`<p class="cp-none">Only ${esc(cur.name)} on this farm.</p>`)
    +`<button type="button" role="menuitem" class="cp-item cp-farm" data-farminfo>${ic("Chest")}<span class="cp-name">Farm &amp; saving</span></button>`;
  const r=$("charBox").getBoundingClientRect();
  p.style.top=(r.bottom+6)+"px";p.style.left=Math.max(8,r.left)+"px";
  document.body.appendChild(p);$("charBox").setAttribute("aria-expanded","true");
}
document.addEventListener("click",e=>{
  const fb=e.target.closest("#charPop [data-farmer]");
  if(fb){st.farmerId=fb.dataset.farmer;charPop(false);applyLive(live.snap);save();syncHeader();render();liveBadge();return;}
  if(e.target.closest("#charPop [data-farminfo]")){charPop(false);farmMenu();return;}
  if(!e.target.closest("#charPop"))charPop(false);
});
addEventListener("scroll",()=>charPop(false),{passive:true});
addEventListener("resize",()=>charPop(false));

function farmMenu(){
  let h=`<h1>${ic("Farmer")} Connect your farm</h1><div id="farmBox">`;
  if(!st.farmCode){
    h+=`<p class="small">With the <b>Ozhinka's Cheat Sheet</b> mod installed, your farm can send its progress here every night when you sleep. Connect it and the date, fish, bundles and spouse fill in by themselves.</p>
    <ol class="small" style="margin:6px 0 10px;padding-left:20px">
      <li>In the game, open <b>Options</b> and scroll to <b>Ozhinka's Cheat Sheet</b>.</li>
      <li>The host presses <b>Share Farm to Dashboard</b> (sharing is off until then).</li>
      <li>Press <b>Copy dashboard link</b> and open it, or paste it below.</li>
    </ol>
    <div class="toolbar"><input id="farmCodeIn" placeholder="Paste the dashboard link (or farm code)" style="flex:1;min-width:0;padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--card);color:inherit;font:inherit"><button class="iconbtn" id="farmGo">Connect</button></div>
    <p class="small muted">Your manual checkmarks are kept safe and come back if you disconnect.</p>`;
  }else{
    const s=live.snap;
    if(live.missing)h+=`<p class="small" style="color:var(--love)">This farm isn't shared yet, or the link is wrong. In the game, the host presses <b>Share Farm to Dashboard</b> (Options → Ozhinka's Cheat Sheet), then <b>Copy dashboard link</b>. Then press Refresh now.</p>`;
    else if(live.error)h+=`<p class="small" style="color:var(--love)">Couldn't reach the farm server right now (${esc(live.error)}). It tries again by itself.</p>`;
    if(s){
      h+=`<p><b>${esc(s.farmName)} Farm</b> · ${cap(s.date.season)} ${s.date.day}, Year ${s.date.year}<br><span class="small muted">Last upload: ${new Date(live.updatedAt).toLocaleString()}</span></p>`;
      if(liveFarmers(s).length>1)h+=`<p class="small farm-who">${farmerFace(liveFarmer(s))}Showing: <select id="farmWho">${liveFarmers(s).map(f=>`<option value="${esc(f.id)}" ${f===liveFarmer(s)?"selected":""}>${esc(f.name)}${f.isHost?" (host)":""}</option>`).join("")}</select></p>`;
      else h+=`<p class="small farm-who">${farmerFace(liveFarmer(s))}Farmer: <b>${esc(liveFarmer(s)?.name||"?")}</b></p>`;
    }else if(!live.error)h+=`<p class="small muted">Loading…</p>`;
    h+=`<p class="small muted">Farm code: ${esc(st.farmCode)}.${live.missing?"":" While connected, the date, fish, bundles and spouse come from the game and update after each in-game night."}</p>
    <div class="toolbar"><button class="iconbtn" id="farmRefresh">Refresh now</button><button class="iconbtn" id="farmSave">${ic("Chest")} Save &amp; share</button><button class="iconbtn" id="farmOff" style="color:var(--love)">Disconnect</button></div>`;
  }
  openModal(h+"</div>");
  const go=$("farmGo");
  if(go)go.onclick=()=>{const c=liveCode($("farmCodeIn").value);if(!c){alert("That doesn't look like a dashboard link or farm code. In the game: Options → Ozhinka's Cheat Sheet → Copy dashboard link.");return;}liveConnect(c);farmMenu();};
  if($("farmRefresh"))$("farmRefresh").onclick=()=>liveLoad();
  if($("farmSave"))$("farmSave").onclick=()=>saveMenu();
  if($("farmOff"))$("farmOff").onclick=()=>{if(confirm("Disconnect this farm? Your earlier manual checkmarks come back."))liveDisconnect();closeModal();};
  if($("farmWho"))$("farmWho").onchange=e=>{st.farmerId=e.target.value;applyLive(live.snap);save();syncHeader();render();liveBadge();farmMenu();};
}

// Start: a link like index.html?farm=CODE connects straight away (handy on a phone)
(()=>{const p=liveCode(new URLSearchParams(location.search).get("farm"));live.fromLink=!!p;if(p&&p!==st.farmCode)liveConnect(p);else liveLoad();})();
document.addEventListener("visibilitychange",()=>{if(!document.hidden)liveLoad();});
// Every 15 seconds while the page is on screen, ask the server only "when was the last upload?".
// If the mod has sent a new night since, load the full farm data and redraw.
async function liveStamp(){
  if(document.hidden||!st.farmCode||live.loading||live.missing)return; // unknown code: no endless retries
  if(!live.snap)return liveLoad(); // first load failed (e.g. offline): try again
  try{
    const r=await fetch(LIVE_API+st.farmCode+"/stamp",{cache:"no-store"});if(!r.ok)return;
    const j=await r.json();if(j.updatedAt&&j.updatedAt!==live.updatedAt)liveLoad();
  }catch(e){}
}
setInterval(liveStamp,15000);
