/* ================= STATE ================= */
const KEY="stardew-dash-v1";
let st={season:"spring",day:1,year:1,fish:{},bundles:{},theme:null};
try{const raw=localStorage.getItem(KEY);if(raw)st=Object.assign(st,JSON.parse(raw));}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}};
let view="calendar", query="";
const ui={vFilter:"all",cSeason:null,cSort:"gpd",cDir:-1,quality:1,tiller:false,riceWater:false,riceMill:false,special:false,plantDay:1,fSeason:null,fLoc:"all",fWeather:"all",fHide:false,fSort:"n",fDir:1,calSeason:null,bRoom:"all",vSort:"hearts",vPage:null};

/* ================= HELPERS ================= */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=id=>document.getElementById(id);
const g=n=>n==null?"—":n.toLocaleString()+"g";
const pill=(t,c="")=>`<span class="pill ${c}">${esc(t)}</span>`;
// Season pill with the in-game season icon; extra text (e.g. days) is escaped
const spill=(s,extra="")=>`<span class="pill ${s}">${SICON[s]}${cap(s)}${extra?" "+esc(extra):""}</span>`;
const seasonPills=a=>a.length===4?pill("All seasons"):a.map(s=>spill(s)).join("");
const itemLink=name=>`<span class="item" data-search="${esc(name)}">${esc(name)}</span>`;
const baseName=s=>s.replace(/\s*[×(].*$/,"").trim();

/* ---- Images: local images/ folder first, then the Stardew Valley Wiki, then a placeholder ---- */
const IMG_ALIAS={"Large Egg (Brown)":"Large Brown Egg","Large Egg (White)":"Large Egg",
  "Warp Totem: Farm":"Warp Totem Farm","Warp Totem: Mountains":"Warp Totem Mountains","Warp Totem: Beach":"Warp Totem Beach","Warp Totem: Desert":"Warp Totem Desert","Warp Totem: Island":"Warp Totem Island","Targeted Bait":"Bait","Strange Doll (green)":"Strange Doll (green)","Strange Doll (yellow)":"Strange Doll (yellow)",
  "Frog Egg":"Green Frog Egg","Strange Doll":"Strange Doll (green)","Slime Egg":"Green Slime Egg",
  "Farmhouse":"House (tier 1)","Chicken":"White Chicken","Cow":"White Cow"};
const WIKI="https://stardewvalleywiki.com/Special:FilePath/";
function imgFile(name){
  if(/^[\d,]+g$/.test(name))return null;            // vault gold amounts
  if(/^(All|Most) /.test(name))return null;         // gift categories like "All Eggs"
  const n=IMG_ALIAS[name]||baseName(name);
  return n.replace(/ /g,"_")+".png";
}
const VNAMES=new Set(VILLAGERS.map(v=>v.n));
// Villagers use the small pixel head icon everywhere; portrait=true gives the big portrait (pop-up only)
function img(name,size="",initial=false,portrait=false){
  let f=imgFile(name); if(!f)return "";
  if(VNAMES.has(name)&&!portrait)f=name+"_Icon.png";
  return `<img class="ico ${size}" src="images/${encodeURIComponent(f)}" data-f="${esc(f)}" data-ini="${initial?esc(name.charAt(0)):""}" alt="" loading="lazy" onerror="imgFail(this)">`;
}
function imgFail(el){
  const n=+(el.dataset.tried||0);
  if(n===0){el.dataset.tried=1;el.src=WIKI+encodeURIComponent(el.dataset.f);return;}
  if(n===1){el.dataset.tried=2;setTimeout(()=>{el.src=WIKI+encodeURIComponent(el.dataset.f)+"?retry=1";},1200+Math.random()*1500);return;}
  if(el.dataset.ini){const s=document.createElement("span");s.className="ini "+[...el.classList].filter(c=>c!=="ico").join(" ");s.textContent=el.dataset.ini;el.replaceWith(s);}
  else el.remove();
}
// In-game season icons
SEASONS.forEach(s=>SICON[s]=img(cap(s),"si"));
// Small inline in-game icon (the site uses these instead of emoji)
const ic=(name,title="")=>img(name,"ii").replace('alt=""',`alt="" ${title?`title="${esc(title)}"`:""}`);
/* one icon per festival, picked to match what happens there */
const FEST_ICON={"Egg Festival":"Easter Egg",   // images/Easter_Egg.png: a painted egg drawn for this site (the wiki has none)
"Desert Festival":"Calico Egg","Flower Dance":"Tulip","Luau":"Cauldron","Trout Derby":"Golden Tag",
  "Dance of the Moonlight Jellies":"Sea Jelly","Stardew Valley Fair":"Token","Spirit's Eve":"Golden Pumpkin","Festival of Ice":"Ice Pip",
  "SquidFest":"Squid","Night Market":"Midnight Squid","Feast of the Winter Star":"Tree of the Winter Star"};
const IC={bday:()=>ic("Gift Icon","Birthday"),fest:n=>FEST_ICON[n]?ic(FEST_ICON[n],n):ic("StatusFestival","Festival"),rain:()=>ic("StatusRain","Rain"),sun:()=>ic("StatusSun","Sun"),
  note:()=>ic("Quest","Note"),time:()=>ic("Time Icon","Time"),star:()=>ic("Gold Quality Icon","Legendary"),done:()=>ic("Junimo Icon","Complete"),
  place:()=>ic("Wood Sign","Where"),tip:()=>ic("Lost Book","Tip"),info:()=>ic("Magnifying Glass","More info")};
/* Romance badge for marriage candidates: grey Bouquet shadow = can be married, Bouquet = dating/engaged, Mermaid's Pendant = married.
   Status comes from the connected farm (live.js); without one, only "married" (set by hand) is known. */
const relStatus=name=>{const lf=typeof liveFriend==="function"?liveFriend(name):undefined,s=lf&&lf.status;
  if(st.spouse===name||s==="Married")return "married";if(s==="Engaged")return "engaged";if(s==="Dating")return "dating";return "single";};
const REL={single:["Can be married","Bouquet"],dating:["Dating you","Bouquet"],engaged:["Engaged to you","Bouquet"],married:["Married to you","Mermaid's Pendant"]};
const MARRY=name=>{const k=relStatus(name),[t,icon]=REL[k];
  return `<span class="rel-badge ${k}" title="${t}" style="display:inline-flex;vertical-align:middle">${k==="single"?`<span class="rel-shadow">${img(icon,"md")}${img(icon,"md")}</span>`:img(icon,"md")}</span>`;};
/* Friendship hearts: the game's numbers when a farm is connected, otherwise the ones set by hand.
   Max: 14 married, 10 dating/engaged or not a marriage candidate, 8 for a single marriage candidate (needs a Bouquet to go higher). */
const heartMax=name=>{const k=relStatus(name),v=VILLAGERS.find(x=>x.n===name);return k==="married"?14:k!=="single"||!(v&&v.m)?10:8;};
const heartCount=name=>{const lf=typeof liveFriend==="function"?liveFriend(name):undefined,max=heartMax(name);
  return lf!==undefined?(lf?Math.min(max,Math.floor(lf.points/250)):0):Math.min(max,(st.hearts&&st.hearts[name])||0);};
// friendship points for sorting: the game's exact points when a farm is connected, else hand-set hearts × 250
const heartPoints=name=>{const lf=typeof liveFriend==="function"?liveFriend(name):undefined;return lf!==undefined?(lf?lf.points:-1):heartCount(name)*250;};
// a full row of hearts (filled up to the current level) for wide Town lists
// always 10 slots (14 when married); hearts above the current limit (9-10 before a Bouquet) are shown locked
/* pixel heart like the game's Social tab: hollow outline = empty, red = earned, solid brown = locked (needs a Bouquet) */
// the game's HeartIconLarge, pixel for pixel: O = outline, r = red fill, h = light highlight
const HEART_SVG=(()=>{const P=[".OO.OO.","OrhOrhO","OrrrrrO",".OrrrO.","..OrO..","...O..."],g={O:"",r:"",h:""};
  P.forEach((row,y)=>[...row].forEach((c,x)=>{if(g[c]!=null)g[c]+=`<rect x="${x}" y="${y}" width="1" height="1"/>`;}));
  return `<g class="o">${g.O}</g><g class="f">${g.r}</g><g class="h">${g.h}</g>`;})();
const heartPix=st=>`<svg class="hpx ${st}" viewBox="0 0 7 6" shape-rendering="crispEdges" aria-hidden="true">${HEART_SVG}</svg>`;
const HEARTROW=name=>{const n=heartCount(name),m=heartMax(name),all=m>10?14:10;return `<span class="heart-row${all>10?" m14":""}" title="${n} of ${m} hearts${m<all?` (hearts ${m+1}-${all} unlock with a Bouquet)`:""}">${Array.from({length:all},(_,i)=>heartPix(i<n?"on":i>=m?"locked":"empty")).join("")}</span>`;};
const HEARTTAG=name=>{const n=heartCount(name),m=heartMax(name);return `<span class="heart-tag${n?"":" zero"}" title="${n} of ${m} hearts">${n}/${m}${ic("HeartIconLarge")}</span>`;};
const ipill=(name,c="")=>/^(All|Most) /.test(name)
  ? `<span class="pill ${c} cat catlink" data-cat="${esc(name)}" title="${esc(name)}">${esc(catLabel(name))}</span>`
  : `<span class="pill ${c} item" data-search="${esc(baseName(name))}">${img(name,"sm")}${esc(name)}</span>`;
// Gift tile: big pixel icon with a small name underneath (full name also on hover)
/* ---- Gift categories ("All Gems" etc.): clicking one opens a pop-up with every item in it ---- */
const TREE_FRUIT=["Apple","Apricot","Banana","Cherry","Mango","Orange","Peach","Pomegranate"];
const CATS={
  "Gems":["Amethyst","Aquamarine","Diamond","Emerald","Jade","Ruby","Topaz","Prismatic Shard"],
  "Foraged Minerals":["Quartz","Earth Crystal","Frozen Tear","Fire Quartz"],
  "Fruit Tree Fruit":TREE_FRUIT,
  "Fruit":["Ancient Fruit","Blackberry","Blueberry","Cactus Fruit","Coconut","Cranberries","Crystal Fruit","Grape","Hot Pepper","Melon","Pineapple","Powdermelon","Qi Fruit","Rhubarb","Salmonberry","Spice Berry","Starfruit","Strawberry","Wild Plum",...TREE_FRUIT],
  "Vegetables":["Amaranth","Artichoke","Beet","Bok Choy","Broccoli","Carrot","Cauliflower","Corn","Eggplant","Fiddlehead Fern","Garlic","Green Bean","Hops","Kale","Parsnip","Potato","Pumpkin","Radish","Red Cabbage","Summer Squash","Taro Root","Tea Leaves","Tomato","Unmilled Rice","Wheat","Yam"],
  "Flowers":["Blue Jazz","Crocus","Fairy Rose","Poppy","Summer Spangle","Sunflower","Sweet Pea","Tulip"],
  "Eggs":["Egg","Large Egg","Brown Egg","Large Brown Egg","Duck Egg","Void Egg","Golden Egg","Ostrich Egg","Dinosaur Egg"],
  "Milk":["Milk","Large Milk","Goat Milk","Large Goat Milk"],
  "Mushrooms":["Common Mushroom","Chanterelle","Morel","Red Mushroom","Purple Mushroom","Magma Cap"],
  "Artisan Goods":["Honey","Jelly","Pickles","Wine","Juice","Beer","Pale Ale","Mead","Green Tea","Cheese","Goat Cheese","Mayonnaise","Duck Mayonnaise","Void Mayonnaise","Dinosaur Mayonnaise","Cloth","Truffle Oil","Oil","Caviar","Aged Roe","Dried Fruit","Dried Mushrooms","Raisins","Smoked Fish"],
  "Bombs":["Cherry Bomb","Bomb","Mega Bomb"],
  "Geodes":["Geode","Frozen Geode","Magma Geode","Omni Geode"],
  "Sprinklers":["Sprinkler","Quality Sprinkler","Iridium Sprinkler"],
  "Cooking":["Fried Egg","Omelet","Salad","Cheese Cauliflower","Baked Fish","Parsnip Soup","Vegetable Medley","Complete Breakfast","Fried Calamari","Strange Bun","Lucky Lunch","Fried Mushroom","Pizza","Bean Hotpot","Glazed Yams","Carp Surprise","Hashbrowns","Pancakes","Salmon Dinner","Fish Taco","Crispy Bass","Pepper Poppers","Bread","Tom Kha Soup","Trout Soup","Chocolate Cake","Pink Cake","Rhubarb Pie","Cookie","Spaghetti","Fried Eel","Spicy Eel","Sashimi","Maki Roll","Tortilla","Red Plate","Eggplant Parmesan","Rice Pudding","Ice Cream","Blueberry Tart","Autumn's Bounty","Pumpkin Soup","Super Meal","Cranberry Sauce","Stuffing","Farmer's Lunch","Survival Burger","Dish O' The Sea","Miner's Treat","Roots Platter","Triple Shot Espresso","Seafoam Pudding","Algae Soup","Pale Broth","Plum Pudding","Artichoke Dip","Stir Fry","Roasted Hazelnuts","Pumpkin Pie","Radish Salad","Fruit Salad","Blackberry Cobbler","Cranberry Candy","Bruschetta","Coleslaw","Fiddlehead Risotto","Poppyseed Muffin","Chowder","Fish Stew","Escargot","Lobster Bisque","Maple Bar","Crab Cakes","Shrimp Cocktail","Ginger Ale","Banana Pudding","Mango Sticky Rice","Poi","Tropical Curry","Squid Ink Ravioli","Moss Soup"],
  "Artifacts":["Dwarf Scroll I","Dwarf Scroll II","Dwarf Scroll III","Dwarf Scroll IV","Chipped Amphora","Arrowhead","Ancient Doll","Elvish Jewelry","Chewing Stick","Ornamental Fan","Dinosaur Egg","Rare Disc","Ancient Sword","Rusty Spoon","Rusty Spur","Rusty Cog","Chicken Statue","Ancient Seed","Prehistoric Tool","Dried Starfish","Anchor","Glass Shards","Bone Flute","Prehistoric Handaxe","Dwarvish Helm","Dwarf Gadget","Ancient Drum","Golden Mask","Golden Relic","Strange Doll (green)","Strange Doll (yellow)","Prehistoric Scapula","Prehistoric Tibia","Prehistoric Skull","Skeletal Hand","Prehistoric Rib","Prehistoric Vertebra","Skeletal Tail","Nautilus Fossil","Amphibian Fossil","Palm Fossil","Trilobite"],
  "Fossils":["Fossilized Skull","Fossilized Spine","Fossilized Tail","Fossilized Leg","Fossilized Ribs","Snake Skull","Snake Vertebrae","Mummified Bat","Mummified Frog"],
  "Geode Minerals":["Alamite","Bixite","Baryte","Aerinite","Calcite","Dolomite","Esperite","Fluorapatite","Geminite","Helvite","Jamborite","Jagoite","Kyanite","Lunarite","Malachite","Neptunite","Lemon Stone","Nekoite","Orpiment","Petrified Slime","Thunder Egg","Pyrite","Ocean Stone","Ghost Crystal","Tigerseye","Jasper","Opal","Fire Opal","Celestine","Marble","Sandstone","Granite","Basalt","Limestone","Soapstone","Hematite","Mudstone","Obsidian","Slate","Fairy Stone","Star Shards"],
  "Seeds & Saplings":["Parsnip Seeds","Bean Starter","Cauliflower Seeds","Garlic Seeds","Jazz Seeds","Tulip Bulb","Kale Seeds","Potato Seeds","Rhubarb Seeds","Strawberry Seeds","Carrot Seeds","Rice Shoot","Coffee Bean","Blueberry Seeds","Corn Seeds","Hops Starter","Pepper Seeds","Melon Seeds","Poppy Seeds","Radish Seeds","Red Cabbage Seeds","Spangle Seeds","Starfruit Seeds","Sunflower Seeds","Tomato Seeds","Wheat Seeds","Summer Squash Seeds","Amaranth Seeds","Artichoke Seeds","Beet Seeds","Bok Choy Seeds","Broccoli Seeds","Cranberry Seeds","Eggplant Seeds","Fairy Seeds","Grape Starter","Pumpkin Seeds","Yam Seeds","Powdermelon Seeds","Ancient Seeds","Cactus Seeds","Pineapple Seeds","Taro Tuber","Rare Seed","Qi Bean","Mixed Seeds","Mixed Flower Seeds","Spring Seeds","Summer Seeds","Fall Seeds","Winter Seeds","Apple Sapling","Apricot Sapling","Banana Sapling","Cherry Sapling","Mango Sapling","Orange Sapling","Peach Sapling","Pomegranate Sapling","Tea Sapling","Acorn","Maple Seed","Pine Cone","Mahogany Seed","Mystic Tree Seed"],
  "Trinkets":["Basilisk Paw","Fairy Box","Frog Egg","Golden Spur","Ice Rod","Magic Hair Gel","Magic Quiver","Parrot Egg"],
  "Fences, Floors & Paths":["Wood Fence","Stone Fence","Iron Fence","Hardwood Fence","Gate","Wood Floor","Rustic Plank Floor","Straw Floor","Weathered Floor","Crystal Floor","Stone Floor","Stone Walkway Floor","Brick Floor","Wood Path","Gravel Path","Cobblestone Path","Stepping Stone Path","Crystal Path"],  "Bait":["Bait","Magnet","Wild Bait","Magic Bait","Deluxe Bait","Challenge Bait","Targeted Bait"],
  "Tackle":["Spinner","Dressed Spinner","Trap Bobber","Cork Bobber","Lead Bobber","Treasure Hunter","Barbed Hook","Curiosity Lure","Quality Bobber","Sonar Bobber"],
  "Trash":["Trash","Driftwood","Broken Glasses","Broken CD","Soggy Newspaper","Joja Cola","Rotten Plant"],
  "Monster Loot":["Bat Wing","Bug Meat","Slime","Solar Essence","Void Essence"],
  "Warp Totems & Rain Totem":["Warp Totem: Farm","Warp Totem: Mountains","Warp Totem: Beach","Warp Totem: Desert","Warp Totem: Island","Rain Totem"],
  "Metal Bars & Ores":["Copper Bar","Iron Bar","Gold Bar","Iridium Bar","Copper Ore","Iron Ore","Gold Ore","Iridium Ore","Coal","Bone Fragment","Refined Quartz"],
  "Building Materials":["Wood","Hardwood","Stone","Clay","Fiber","Moss","Battery Pack"],
  "Fertilizer":["Basic Fertilizer","Quality Fertilizer","Deluxe Fertilizer","Speed-Gro","Deluxe Speed-Gro","Hyper Speed-Gro","Basic Retaining Soil","Quality Retaining Soil","Deluxe Retaining Soil","Tree Fertilizer"],
};
const catKey=name=>name.replace(/^(All|Most) /,"").replace(/\s*\(.*$/,"").trim();
const catItems=key=>key==="Fish"?FISH.map(f=>f.n):CATS[key];
// the tile label without the bracket notes ("All Flowers (except Poppy)" -> "All Flowers"); the notes show in the pop-up
const catLabel=name=>name.replace(/\s*\(.*$/,"").trim();
const catNote=name=>{const m=name.match(/\((except.*)\)\s*$/);return m?m[1]:"";};
// split a category into the items it covers and the ones its "(except …)" note leaves out
const _catSplit={};
function catSplit(name){if(_catSplit[name])return _catSplit[name];const all=catItems(catKey(name))||[];const m=name.match(/\(except ([^)]*)\)/);
  const ex=new Set();if(m)m[1].split(/,|&| and |which are hated/).map(s=>s.trim()).filter(Boolean).forEach(x=>{(CATS[x]||[x]).forEach(i=>ex.add(i));});
  return _catSplit[name]={inc:all.filter(i=>!ex.has(i)),exc:all.filter(i=>ex.has(i))};}
/* ---- Exceptions to the universal tastes: villagers whose own list says something different about an item ---- */
const REACT=[["loves","love"],["likes","like"],["dislikes","dislike"],["hates","hate"]];
const VERB={love:"loves",like:"likes",dislike:"dislikes",hate:"hates"};
const listHas=(list,item)=>list.some(e=>/^(All|Most) /.test(e)?catSplit(e).inc.includes(item):baseName(e)===item);
function personalTaste(v,item){for(const [f,k] of REACT)if(v[f]&&listHas(v[f],item))return k;return null;}
const exceptionsFor=(item,uniK)=>VILLAGERS.map(v=>({v,k:personalTaste(v,item)})).filter(x=>x.k&&x.k!==uniK);
// under a tile: the "!" emote and how many villagers feel differently (hover for names, click the item for the full list)
function excHeads(item,uniK){const ex=exceptionsFor(baseName(item),uniK);if(!ex.length)return "";
  const tip=ex.map(x=>`${x.v.n} ${VERB[x.k]} it`).join(", ");
  return `<span class="gx" title="Exceptions: ${esc(tip)}">${ic("Quest")}<b>${ex.length}</b></span>`;}
// which universal list (love/like/dislike/hate) an item falls under, if any
const UNI_K=[["L","love"],["K","like"],["D","dislike"],["H","hate"]];
const uniTaste=item=>{for(const [f,k] of UNI_K)if(UNIVERSAL[f]&&listHas(UNIVERSAL[f],item))return k;return null;};
function catModal(name,uniK){const {inc,exc}=catSplit(name),note=catNote(name),key=catKey(name);
  const head=`<h1>${esc(catLabel(name))}</h1>${note?`<p class="small" style="margin:0 0 6px">${IC.note()} ${esc(note.charAt(0).toUpperCase()+note.slice(1))}</p>`:""}`;
  if(!inc.length&&!exc.length)return openModal(`${head}<p class="sub">This covers every item in the ${esc(key)} group.</p><p>${wiki(key,"See the full list on the wiki ↗")}</p>`,"sv-card");
  openModal(`${head}<p class="sub">${inc.length} items${exc.length?`, ${exc.length} not included`:""}. Click one to see who loves or hates it.${uniK?` A number under an item is how many villagers feel differently about it.`:""}</p>
  ${gtiles(inc,uniK)}${exc.length?`<h3 style="margin:14px 0 4px">Not included</h3><div class="cat-exc">${gtiles(exc)}</div>`:""}`,"sv-card");}
// uniK (optional): the universal reaction for this list; then each tile also shows the villagers who are exceptions
const gtile=(name,plain,uniK)=>/^(All|Most) /.test(name)
  ? `<span class="gtile cat catlink" data-cat="${esc(name)}"${uniK?` data-catk="${uniK}"`:""} title="${esc(name)}"><small>${esc(catLabel(name))}</small></span>`
  : plain ? `<span class="gtile" title="${esc(name)}">${img(name,"gt")}<small>${esc(name)}</small></span>`
  : `<span class="gtile item" data-search="${esc(baseName(name))}" title="${esc(name)}">${img(name,"gt")}<small>${esc(name)}</small>${uniK?excHeads(name,uniK):""}</span>`;
// single items first; "All …" categories start on their own line at the end of each list
const gtiles=(list,uniK)=>{const isCat=n=>/^(All|Most) /.test(n),items=list.filter(n=>!isCat(n)),cats=list.filter(isCat);
  return `<div class="gtiles">${items.map(n=>gtile(n,false,uniK)).join("")}${items.length&&cats.length?`<span class="gbreak"></span>`:""}${cats.map(n=>gtile(n,false,uniK)).join("")}</div>`;};// In-game emote bubbles for gift reactions (fall back to an emoji if the image can't load)
const EMO={love:"Emote Heart",like:"Emote Happy",dislike:"Emote Sad",hate:"Emote Angry"};
const emo=(k,size="emo")=>`<span class="emo-wrap">${img(EMO[k],size)}</span>`;
// Link to the item's full article on the Stardew Valley Wiki
const wikiURL=name=>"https://stardewvalleywiki.com/"+encodeURIComponent(baseName(name).replace(/ /g,"_"));
const wiki=(name,label="wiki ↗")=>`<a class="wiki" href="${wikiURL(name)}" target="_blank" rel="noopener" title="Open the full ${esc(baseName(name))} article on the Stardew Valley Wiki">${label}</a>`;
function dayDiff(s1,d1,s2,d2){return (SEASONS.indexOf(s2)*28+d2)-(SEASONS.indexOf(s1)*28+d1);}

// Build lookup: item name -> references
const INDEX=new Map();
function ref(name,r){const k=baseName(name).toLowerCase();if(!INDEX.has(k))INDEX.set(k,{name:baseName(name),refs:[]});INDEX.get(k).refs.push(r);}
const notCat=i=>!/^(All|Most) /.test(i);
VILLAGERS.forEach(v=>{
  v.loves.filter(notCat).forEach(i=>ref(i,{type:"love",v:v.n}));
  (v.likes||[]).filter(notCat).forEach(i=>ref(i,{type:"like",v:v.n}));
  (v.dislikes||[]).filter(notCat).forEach(i=>ref(i,{type:"dislike",v:v.n}));
  (v.hates||[]).filter(notCat).forEach(i=>ref(i,{type:"hate",v:v.n}));
});
// every single item on the universal lists gets a card (it shows all four reactions)
["L","K","D","H"].forEach(f=>(UNIVERSAL[f]||[]).filter(notCat).forEach(i=>ref(i,{type:"uni"})));
CROPS.forEach(c=>ref(c.n,{type:"crop",c}));
FISH.forEach(f=>ref(f.n,{type:"fish",f}));
BUNDLES.forEach(b=>b.items.forEach(i=>ref(i,{type:"bundle",b})));
ANIMALS.forEach(a=>{ref(a.n,{type:"animal",a});a.prod.forEach(p=>{ref(p[0],{type:"product",a,p});if(p[2])ref(p[2],{type:"made",from:p[0],a});});});
MACHINES.forEach(m=>{ref(m.n,{type:"machine",m});m.goods.forEach(gd=>ref(gd[0],{type:"good",m,gd}));});

/* ================= RENDER ================= */
// [key, label, in-game icon]
const TABS=[["calendar","Calendar","Calendar"],["villagers","Town","Solid Gold Lewis"],["crops","Crops","Starfruit"],["animals","Animals","White Chicken"],["fish","Fish","Legend"],["bundles","Bundles","Bundle Green"],["festivals","Festivals","Jack-O-Lantern"]];
function renderNav(){$("nav").innerHTML=TABS.map(([k,l,i])=>`<button class="${view===k&&!query?"on":""}" data-tab="${k}">${i?img(i,"tab"):img(cap(st.season),"tab wide")}${l}</button>`).join("");}
/* ---- Pages and history ----
   the address bar keeps where you are (#villagers, #villagers/Abigail, #search/pumpkin), and every page you open
   is a browser history step, so Back (Alt+Left, the mouse back button, or the "← Back" buttons) returns to the previous page */
let navDepth=0;   // how many steps back we can go and still stay on this site
function nav(h,replace){if(!replace&&location.hash==="#"+h)return;
  try{history[replace?"replaceState":"pushState"]({d:replace?navDepth+0:navDepth+1},"","#"+h);if(!replace)navDepth++;}catch(e){}}
const pageHash=()=>view+(view==="villagers"&&ui.vPage?"/"+encodeURIComponent(ui.vPage):"");
function goBack(fallback){if(navDepth>0)history.back();else go(fallback||view);}
function go(v){view=v;query="";$("q").value="";ui.vPage=null;ui.vFind="";nav(v);render();window.scrollTo(0,0);}
function openSearch(q){closeModal();query=q;$("q").value=q;nav("search/"+encodeURIComponent(q));render();window.scrollTo(0,0);}
const backBtn=fallback=>`<button class="iconbtn small vp-back" type="button" data-back="${esc(fallback)}" title="Back to the previous page (Alt+←)">← Back</button>`;
function readHash(){let [t,...rest]=location.hash.slice(1).split("/"),p=rest.join("/");
  if(t==="home")t="calendar";   // the Home page was removed; old #home links open the Calendar
  if(t==="search"){query=decodeURIComponent(p||"");$("q").value=query;return true;}
  if(!TABS.some(x=>x[0]===t))return false;
  query="";$("q").value="";ui.vFind="";
  const prevPage=ui.vPage;
  view=t;ui.vPage=t==="villagers"&&p?decodeURIComponent(p):null;if(ui.vPage)st.vTab="villagers";
  if(ui.vPage&&ui.vPage!==prevPage)st.vpTab="gifts";   // a newly opened profile starts on Gifts
  return true;}

function render(){
  renderNav();
  const m=$("main");
  if(query){m.innerHTML=renderSearch();labelTables(m);coinify(m);renderRails();renderHeaderDeco();return;}
  m.innerHTML=({calendar:renderCalendar,villagers:renderVillagers,crops:renderCrops,animals:renderAnimals,fish:renderFish,bundles:renderBundles,festivals:renderFestivals})[view]();
  labelTables(m);coinify(m);applyVFind();vFit();
  renderRails();renderHeaderDeco();
}
// Town tab: a table when there's room for each villager's gifts on one line, otherwise villager boxes (like before)
const VFIT=760,vRO=new ResizeObserver(()=>vFit());
function vFit(){foldFit();const b=document.querySelector(".vblocks[data-vfit]");if(!b)return;vRO.observe(b);
  const boxes=b.clientWidth<VFIT;if(b.classList.contains("vcards")===boxes)return;b.classList.toggle("vlist",!boxes);b.classList.toggle("vcards",boxes);}
// crops / fish: the Expand all / Collapse all buttons only matter while the boxes are shown (table at 720px+)
function foldFit(){const w=document.querySelector("main .tablewrap:has(table.crops),main .tablewrap:has(table.fishes)");if(!w)return;vRO.observe(w);
  document.querySelectorAll(".card-fold").forEach(f=>f.classList.toggle("wide-table",true));}
// Town tab: hide villager cards that don't match the "Find a villager" box (by name or home)
function applyVFind(){if(query)return;const q=(ui.vFind||"").trim().toLowerCase(),cards=document.querySelectorAll(".vblock[data-find]");if(!cards.length)return;
  let n=0;cards.forEach(c=>{const ok=!q||c.dataset.find.includes(q);c.hidden=!ok;if(ok)n++;});
  const none=document.querySelector(".vfind-none");if(none)none.hidden=n>0;}
document.addEventListener("input",e=>{if(e.target.id==="vFind"){ui.vFind=e.target.value;applyVFind();const rb=document.querySelector("[data-vreset]");if(rb)rb.disabled=ui.vSort==="hearts"&&(ui.vRom||"all")==="all"&&!ui.vFind;}});
// Money: never "123g" on screen, always the number followed by the in-game gold coin
const MONEY=/(\d[\d,]*)g\b/g;
function coinify(root){
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;
    if(!p||p.closest("option,select,textarea,script,style,.coin"))return NodeFilter.FILTER_REJECT;MONEY.lastIndex=0;return MONEY.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;}});
  const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(n=>{const f=document.createDocumentFragment();let last=0;const s=n.nodeValue;MONEY.lastIndex=0;let m;
    while((m=MONEY.exec(s))){f.append(s.slice(last,m.index));const c=document.createElement("span");c.className="coin";c.textContent=m[1];
      const i=document.createElement("img");i.className="ico coin-ico";i.alt="gold";i.src=WIKI+"Gold.png";i.onerror=()=>{const d=document.createElement("i");d.className="coin-dot";d.title="gold";i.replaceWith(d);};c.append(i);f.append(c);last=m.index+m[0].length;}
    f.append(s.slice(last));n.replaceWith(f);});
}
// Give each table cell its column name, so wide tables can stack as cards on phones (no sideways scrolling)
function labelTables(root){root.querySelectorAll(".tablewrap table").forEach(t=>{const hr=t.querySelector("tr");if(!hr||!hr.querySelector("th"))return;
  const heads=[...hr.children].map(th=>th.textContent.replace(/[▲▼]/g,"").trim());
  t.querySelectorAll("tr").forEach(tr=>{if(tr===hr)return;[...tr.children].forEach((td,i)=>{if(heads[i])td.dataset.l=heads[i];});});});}

function eventsOn(season,day){
  const out=[];
  VILLAGERS.filter(v=>v.s===season&&v.d===day&&unlocked(v)).forEach(v=>out.push({k:"b",label:v.n,v:v.n}));
  FESTIVALS.filter(f=>f.s===season&&f.days.includes(day)&&unlocked(f)).forEach(f=>out.push({k:"f",label:f.n,f:f.n}));
  return out;
}

function bundleProgress(){
  let done=0,total=0;
  BUNDLES.forEach(b=>{const need=b.need||b.items.length;total+=need;done+=Math.min(need,b.items.filter(i=>st.bundles[b.n+"|"+i]).length);});
  return {done,total,bundlesDone:BUNDLES.filter(b=>b.items.filter(i=>st.bundles[b.n+"|"+i]).length>=(b.need||b.items.length)).length};
}

// one birthday/festival line (used by the side strips and calendar)
function evHTML(e){return e.k==="b"?`<span class="ev b" data-villager="${esc(e.v)}">${img(e.v,"sm")}${esc(e.label)}'s birthday ${IC.bday()}</span>`:`<span class="ev f" data-fest="${esc(e.f)}">${IC.fest(e.f)}${esc(e.label)}</span>`;}
function renderCalendar(){
  const s=ui.calSeason||st.season, si=SEASONS.indexOf(s);
  let cells="";
  for(let d=1;d<=28;d++){
    const b=VILLAGERS.find(v=>v.s===s&&v.d===d&&unlocked(v));
    const f=FESTIVALS.find(x=>x.s===s&&x.days.includes(d)&&unlocked(x));
    const tip=[b?`${b.n}'s Birthday`:"",f?f.n:""].filter(Boolean).join(" · ");
    cells+=`<div class="sv-day ${s===st.season&&d===st.day?"now":""} ${b?"has-b":""}" ${tip?`data-tip="${esc(tip)}"`:""}>
      ${isFuture(s,d)?`<div class="n future" title="${cap(s)} ${d} is after your game's date">${d}</div>`:`<div class="n" data-pick="${s}|${d}" title="Set today to ${cap(s)} ${d}">${d}</div>`}
      ${f?`<div class="flag" data-fest="${esc(f.n)}"><i>${IC.fest(f.n)}</i><span>${esc(f.n)}</span></div>`:""}
      ${b?`<div class="por" data-villager="${esc(b.n)}">${img(b.n,"",true)}</div>`:""}
    </div>`;
  }
  return `<h1>Calendar</h1><p class="sub">Like the calendar on the town billboard. Hover a day for details, click a day's number to make it today, click a portrait for gift ideas, and click a festival for festival info.</p>
  <div class="sv-board">
    <div class="sv-banner">
      ${SEASONS.map(x=>`<button class="sv-sbtn ${x===s?"on":""}" data-cal="${x}">${SICON[x]}${cap(x)}</button>`).join("")}
    </div>
    <div class="sv-grid">${cells}</div>
  </div>`;
}

// Villager sort options: [label, compare function]. "next" is the default (not in the dropdown; the Reset button returns to it)
const bdayNum=v=>SEASONS.indexOf(v.s)*28+v.d;
const VSORTS={
  next:["Next birthday",(a,b,soon)=>soon(a)-soon(b)],
  cal:["Birthday (Spring 1 → Winter 28)",(a,b)=>bdayNum(a)-bdayNum(b)],
  name:["Name (A–Z)",(a,b)=>a.n.localeCompare(b.n)],
  namez:["Name (Z–A)",(a,b)=>b.n.localeCompare(a.n)],
  hearts:["Most friendship points",(a,b)=>heartPoints(b.n)-heartPoints(a.n)],
  heartsz:["Fewest friendship points",(a,b)=>heartPoints(a.n)-heartPoints(b.n)],
};
// column headers on the Town list: [label, first click, second click, true if the first click is biggest-first]
const VCOLS=[["Villager","name","namez"],["Birthday","next","cal"],["Loved gifts"],["Hearts","hearts","heartsz",true]];
// days until a villager's next birthday (0 = today)
const soon=v=>{let dd=dayDiff(st.season,st.day,v.s,v.d);if(dd<0)dd+=112;return dd;};
// a villager's first 4 loves in one row (items before categories), then a small "+N" if there are more
// fit3: the Town list shows 3 gifts on narrower screens, so it also carries a "+N" for that case (CSS picks one)
function srLoves(loves,fit3){
  const isCat=n=>/^(All|Most) /.test(n),list=[...loves.filter(n=>!isCat(n)),...loves.filter(isCat)],more=list.length-4;
  const moreTag=(k,c)=>`<span class="sr-more${c}" title="${k} more: ${esc(list.slice(list.length-k).join(", "))}">+${k}</span>`;
  return `<div class="gtiles sr-loves">${list.slice(0,4).map((n,i)=>i===3&&fit3?gtile(n,true).replace("class=\"gtile","class=\"gtile g4"):gtile(n,true)).join("")}${more>0?moreTag(more," m4"):""}${fit3&&list.length>3?moreTag(list.length-3," m3"):""}</div>`;
}
// villager card on the Town tab: [portrait] [name + birthday] on top, favourite gifts underneath
function vblock(v,nameHTML){
  const dd=soon(v);
  return `<div class="card sv-card vblock" data-villager="${esc(v.n)}" data-find="${esc((v.n+" "+v.home).toLowerCase())}" title="Open ${esc(v.n)}'s page">
      <div class="vb-head">
        ${img(v.n,"hd",true)}
        <div class="vb-id"><div class="vname"><span class="vn-txt">${nameHTML||esc(v.n)}</span><span class="vn-badge">${v.m?MARRY(v.n):""}</span></div></div>
      </div>
      <div class="vb-bday${dd===0?" today":""}" title="Birthday: ${cap(v.s)} ${v.d}${dd===0?" (today!)":" (in "+dd+" days)"}">${SICON[v.s]} <span class="vb-sn">${cap(v.s)} </span>${v.d}${dd>0&&dd<=7?` <b class="soon">in ${dd}d</b>`:dd===0?` <b class="soon">Today!</b>`:""}</div>
      ${srLoves(v.loves,true)}
      <div class="vb-hearts">${HEARTROW(v.n)}${HEARTTAG(v.n)}</div>
    </div>`;
}
// one square button that cycles All -> Romance -> Non-romance (heart = everyone, Bouquet = can marry, grey Bouquet = can't)
const VROM={all:["All villagers",()=>ic("HeartIconLarge")],rom:["Only romance (marriage candidates)",()=>img("Bouquet","ii")],non:["Only non-romance",()=>`<span class="vrom-off">${img("Bouquet","ii")}</span>`]};
const VROMBTN=()=>{const k=ui.vRom||"all",o=["all","rom","non"],nx=o[(o.indexOf(k)+1)%3];
  return `<button type="button" class="iconbtn vrom ${k}" data-vrom title="Showing: ${VROM[k][0]}. Click for: ${VROM[nx][0]}" aria-label="Showing ${VROM[k][0]}, click to change">${VROM[k][1]()}</button>`;};
function renderVillagers(){
  const list=[...VILLAGERS];
  if(!VSORTS[ui.vSort])ui.vSort="hearts";
  if(ui.vPage&&VILLAGERS.some(v=>v.n===ui.vPage))return renderVillagerPage(ui.vPage);
  const vtabs=`<div class="seg vtabs" role="tablist"><button type="button" role="tab" class="${st.vTab==="universal"?"":"on"}" data-vtab="villagers">${ic("HeartIconLarge")} Villagers</button><button type="button" role="tab" class="${st.vTab==="universal"?"on":""}" data-vtab="universal">${ic("Gift Icon")} Universal gifts</button></div>`;
  if(st.vTab==="universal")return renderUniversal(vtabs);
  return `<h1>Town</h1>${vtabs}<p class="sub">Birthdays and favourite gifts for every villager.</p>
  <div class="toolbar">
    <input type="search" id="vFind" class="vfind" placeholder="Find a villager…" value="${esc(ui.vFind||"")}" autocomplete="off" aria-label="Find a villager">
    ${VROMBTN()}
    <button type="button" class="iconbtn vreset" data-vreset title="Reset: most friendship points first, all villagers, empty search" ${ui.vSort==="hearts"&&(ui.vRom||"all")==="all"&&!ui.vFind?"disabled":""}>↺ Reset</button>
</div>
  <div class="vblocks vlist" data-vfit><div class="vlist-head" role="row">${VCOLS.map(([l,a,b,desc])=>{const on=ui.vSort===a||ui.vSort===b;
    return a?`<button type="button" class="vh ${on?"on":""}" data-vsort="${on&&ui.vSort===a?b:a}" title="Sort: ${esc(VSORTS[on&&ui.vSort===a?b:a][0])}">${l}${on?`<i>${(ui.vSort===a)!==!!desc?"▲":"▼"}</i>`:""}</button>`:`<span class="vh">${l}</span>`;}).join("")}</div>${list.filter(v=>ui.vRom==="rom"?v.m:ui.vRom==="non"?!v.m:true).sort((a,b)=>VSORTS[ui.vSort][1](a,b,soon)||a.n.localeCompare(b.n)).map(v=>vblock(v)).join("")}</div>
  <p class="muted vfind-none" hidden>No villager by that name.</p>
  <p class="small muted">Click a villager to open their page: all their gifts, where they usually are, and their heart events.</p>`;
}

/* ---- One villager's page: short bio, then Gifts / Schedule / Heart events tabs ---- */
const VPTABS=[["gifts","Gifts","Gift Icon"],["schedule","Schedule","Time Icon"],["hearts","Heart events","HeartIconLarge"]];
const wikiAt=(name,anchor,label)=>`<a class="wiki" href="${wikiURL(name)}#${anchor}" target="_blank" rel="noopener">${label}</a>`;
function openVillager(name){closeModal();view="villagers";query="";$("q").value="";st.vTab="villagers";ui.vPage=name;st.vpTab="gifts";save();
  nav("villagers/"+encodeURIComponent(name));render();scrollTo(0,0);}
/* ---- Villager schedules (data in js/schedules.js, in the wiki's priority order: the first entry that fits wins) ---- */
const WDAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const SCODE={spring:"s",summer:"u",fall:"f",winter:"w"};
const weekday=d=>(d-1)%7;   // day 1 of every season is a Monday
// turn a wiki label like "Wednesday and Friday (Community Center Restored)" into conditions
function parseAlt(a){
  const c={};
  if(/Green Rain|Desert Festival \(As Vendor\)/i.test(a)){c.special=true;return c;}
  const sm=a.match(/\b(Spring|Summer|Fall|Winter)\b/);if(sm)c.season=sm[1].toLowerCase();
  const dm=a.match(/^(?:(?:Spring|Summer|Fall|Winter) )?(\d+(?:(?:, | and )\d+)*)\b/);if(dm)c.dates=dm[1].split(/, | and /).map(Number);
  const th=[...a.matchAll(/the (\d+)(?:st|nd|rd|th)/g)].map(m=>+m[1]);if(th.length)c.dates=th;
  const W=WDAYS.join("|"),rg=a.match(new RegExp(`(${W}) - (${W})`));
  if(rg){const i=WDAYS.indexOf(rg[1]),j=WDAYS.indexOf(rg[2]);c.days=WDAYS.map((_,k)=>k).filter(k=>k>=i&&k<=j);}
  else{const ds=WDAYS.map((w,k)=>a.includes(w)?k:-1).filter(k=>k>=0);if(ds.length)c.days=ds;}
  if(/\bRain\b/.test(a))c.rain=true;
  const op=a.match(/Option (\d)/);if(op)c.opt=+op[1];
  if(/Community Center Not Restored/i.test(a))c.cc=false;else if(/Community Center Restored/i.test(a))c.cc=true;
  if(/No Bus Service/i.test(a))c.bus=false;else if(/Bus Service Restored/i.test(a))c.bus=true;
  if(/Beach Bridge Repaired/i.test(a))c.bridge=true;
  if(/Railroad Accessible/i.test(a))c.rail=true;
  let m=a.match(/No player has 6 hearts with ([^)]+)/);if(m)c.hNone=m[1].split(/ or | and |, /);
  m=a.match(/at least 6 hearts with ([^)]+)/);if(m)c.hAny=m[1].split(/ or | and |, /);
  m=a.match(/(\w+)'s (\d+) heart event seen/);if(m)c.ev=m[1]+"|"+m[2];
  return c;
}
const schedCache={};
function schedEntries(name){
  if(schedCache[name])return schedCache[name];
  if(typeof SCHED==="undefined")return [];
  return schedCache[name]=(SCHED[name]||[]).map(([code,lab,ri])=>{const labels=Array.isArray(lab)?lab:[lab],alts=labels.map(parseAlt);
    return {code,labels,alts,rows:SCHED_ROWS[ri]||[],dated:alts.some(c=>c.dates||c.special)};});
}
const entryInSeason=(e,s)=>e.code==="*"||e.code==="M"?e.alts.some(c=>!c.season||c.season===s):e.code.includes(SCODE[s]);
function altOK(c,S){
  if(c.special)return false;
  if(c.season&&c.season!==S.season)return false;
  if(c.dates&&(S.day==null||!c.dates.includes(S.day)))return false;
  if(c.days&&!c.days.includes(S.wd))return false;
  if(c.rain&&!S.rain)return false;
  if(c.cc!=null&&c.cc!==S.cc)return false;
  if(c.bus!=null&&c.bus!==S.bus)return false;
  if(c.bridge&&!S.bridge)return false;
  if(c.rail&&!S.rail)return false;
  if(c.hNone&&c.hNone.some(n=>S.h[n]))return false;
  if(c.hAny&&!c.hAny.some(n=>S.h[n]))return false;
  if(c.ev&&!S.ev[c.ev])return false;
  return true;
}
/* Schedule tab: just today's and tomorrow's schedule, worked out automatically:
   rain from the game's weather (today) and TV forecast (tomorrow), Community Center / bus from the bundles,
   hearts and marriage from your farm. Without a connected farm the weather is unknown, so dry days are shown. */
const RAINY=id=>/^(Rain|Storm|GreenRain)$/.test(id||"");
function schedDay(v,season,day,year,rain){
  return {season,today:true,day,wd:weekday(day),rain,cc:ccDone(),bus:busOpen(),bridge:true,
    rail:!(year===1&&(season==="spring"||(season==="summer"&&day<3))),
    h:new Proxy({},{get:(_,n)=>typeof n==="string"&&heartCount(n)>=6}),ev:{},married:relStatus(v.n)==="married"};
}
const schedTable=rows=>`<table class="vp-sched">${rows.map(([t,w])=>`<tr><td class="num">${esc(t)}</td><td>${esc(w)}</td></tr>`).join("")}</table>`;
// what changed this day's routine from a normal one (rain, Community Center, bus...), from the matching wiki condition
function schedMods(hits,S,season,wid){
  const m=[],add=(k,html)=>{if(!m.some(x=>x[0]===k))m.push([k,html]);};
  if(S.married)add("married",`${img("Mermaid's Pendant","ii")} Married to you`);
  hits.forEach(e=>{const c=e.alts.find(x=>altOK(x,S));if(!c)return;
    if(c.rain)add("rain",`${img(wxIcon(wid||"Rain",season),"wx-i")} ${esc(wxName(wid||"Rain"))}`);
    if(c.dates)add("date",`${IC.time()} Special date`);
    if(c.cc!=null)add("cc",`${IC.done()} Community Center ${c.cc?"restored":"not restored yet"}`);
    if(c.bus!=null)add("bus",`${ic("Bus")} Bus ${c.bus?"repaired":"not repaired yet"}`);
    if(c.bridge)add("bridge","Beach bridge repaired");
    if(c.rail)add("rail","Railroad open");
    (c.hAny||[]).length&&add("hany",`${ic("HeartIconLarge")} 6+ hearts with ${esc(c.hAny.join(" or "))}`);
    (c.hNone||[]).length&&add("hnone",`${ic("HeartIconLarge")} Under 6 hearts with ${esc(c.hNone.join(" or "))}`);});
  return m.map(x=>`<span class="sch-mod">${x[1]}</span>`).join("");
}
function schedCard(v,all,season,day,year,wid){
  const S=schedDay(v,season,day,year,RAINY(wid));
  const pool=all.filter(e=>entryInSeason(e,season)&&(e.code==="M")===S.married);
  const hits=[];const first=pool.find(e=>e.alts.some(c=>altOK(c,S)));
  if(first){hits.push(first);if(first.alts.some(c=>c.opt))pool.forEach(e=>{if(e!==first&&e.alts.some(c=>c.opt&&altOK(c,S)))hits.push(e);});}
  const fest=FESTIVALS.find(x=>x.s===season&&x.days.includes(day)&&unlocked(x));
  const mods=schedMods(hits,S,season,wid)+(fest?`<span class="sch-mod">${IC.fest(fest.n)} ${esc(fest.n)}: festivals change everyone's day</span>`:"");
  const result=hits.length>1
    ?`<p class="small muted sch-rand">${hits.length} possible routines: the game picks one at random each morning.</p><div class="sch-opts">${hits.map((e,i)=>`<div class="sch-optbox"><div class="sch-opthead"><b>Option ${i+1}</b></div>${schedTable(e.rows)}</div>`).join("")}</div>`
    :hits.length?`<div class="sch-one">${schedTable(hits[0].rows)}</div>`
    :`<p>${S.married?"Spends the day on the farm, following the usual spouse routine.":"No listed schedule fits this day."}</p>`;
  return `<div class="card sv-card vp-card">${mods?`<div class="sch-mods">${mods}</div>`:""}${result}</div>`;
}
function schedTab(v,info){
  const all=schedEntries(v.n);
  if(!all.length)return `<div class="card sv-card vp-card"><p class="muted">No schedule found.</p><p class="small">${wikiAt(v.n,"Schedule","Schedule on the wiki ↗")}</p></div>`;
  const w=typeof liveWeather==="function"?liveWeather():null;
  let td=st.day+1,ts=st.season,ty=st.year||1;
  if(td>28){td=1;const i=SEASONS.indexOf(ts)+1;ts=SEASONS[i%4];if(i>3)ty++;}
  const tmr=ui.schDay==="tomorrow";
  return `<div class="seg sch-when" role="tablist">${[["today","Today"],["tomorrow","Tomorrow"]].map(([k,l])=>`<button type="button" role="tab" class="${(k==="tomorrow")===tmr?"on":""}" data-schday="${k}">${l}</button>`).join("")}</div>
  ${tmr?schedCard(v,all,ts,td,ty,w&&w.tomorrow):schedCard(v,all,st.season,st.day,st.year||1,w&&w.today)}
  ${w?"":`<p class="small muted">Connect your farm to include rain: without it, dry-day schedules are shown.</p>`}
  ${info.note?`<p class="small">${IC.note()} ${esc(info.note)}</p>`:""}
  <p class="small muted">${wikiAt(v.n,"Schedule","Full schedule on the wiki ↗")}</p>`;
}
/* Relationship hearts on a villager's page: from the game when a farm is connected (live.js), otherwise set by clicking */
function relHTML(name){
  const lf=typeof liveFriend==="function"?liveFriend(name):undefined; // undefined = no farm connected, null = not met yet
  const isLive=lf!==undefined, max=heartMax(name), n=heartCount(name);
  const hs=Array.from({length:max},(_,i)=>`<button type="button" class="rel-h ${i<n?"on":""}" ${isLive?"disabled":`data-heart="${esc(name)}|${i+1}"`} aria-label="${i+1} hearts">${ic("HeartIconLarge")}</button>`).join("");
  // 250 friendship points per heart
  const toNext=lf&&n<max?`${(n+1)*250-lf.points} pts to the next heart`:lf?"max hearts":"";
  const note=isLive?(lf?`${lf.points} pts · ${toNext} · gifts this week ${lf.giftsThisWeek}/2${lf.giftsToday?" · gifted today ✓":""}`:"Not met yet"):"Click a heart to set";
  return `<div class="vp-rel" title="${isLive?"From your farm":"Your hearts with "+esc(name)}"><div class="rel-hs" role="group" aria-label="${n} of ${max} hearts">${hs}</div><span class="small muted">${note}</span></div>`;
}
function renderVillagerPage(name){
  const v=VILLAGERS.find(x=>x.n===name), info=VINFO[name]||{};
  const tab=VPTABS.some(t=>t[0]===st.vpTab)?st.vpTab:"gifts";
  const L=v.loves.filter(i=>!/^(All|Most) /.test(i));
  const sec=(k,title,pts,list)=>list&&list.length?`<div class="uni-row ${k}"><div class="uni-l">${emo(k)}<b>${title}</b><span class="muted small">${pts}</span></div>${gtiles(list)}</div>`:"";
  let body="";
  if(tab==="gifts")body=`<div class="sv-list uni-list">${sec("love","Loves","+80 friendship",v.loves)}${sec("like","Likes","+45",v.likes)}${sec("dislike","Dislikes","−20",v.dislikes)}${sec("hate","Hates","−40",v.hates)}</div>
    ${v.note?`<p class="small">${IC.note()} ${esc(v.note)}</p>`:""}
    <p class="small muted">Anything not listed follows the <a href="#villagers" data-vtab="universal">universal gifts</a>. Birthday gifts are worth 8× friendship. You can give 2 gifts a week, plus one on their birthday.</p>`;
  else if(tab==="schedule")body=schedTab(v,info);
  else body=`<div class="card sv-card vp-card"><h2>Heart events</h2>
    ${info.h&&info.h.length?`<div class="vp-hearts">${[...info.h].sort((a,b)=>a[0]-b[0]).map(([n,t])=>`<div class="vp-heart"><span class="vp-lvl" title="${n} hearts">${ic("HeartIconLarge")}<b>${n}</b></span><span>${esc(t)}</span></div>`).join("")}</div>`:'<p class="muted">No heart events.</p>'}
    <p class="small muted">Hearts are friendship levels. Events only play once, and each needs the hearts shown first.</p>
    <p class="small">${wikiAt(name,"Heart_Events","Heart events on the wiki ↗")}</p></div>`;
  // left: tabs with the open tab underneath; right: portrait + bio, pinned while you scroll
  return `${backBtn("villagers")}
  <div class="vp-wrap">
    <div class="vp-main">
      <div class="vp-top">
        <div class="seg vtabs vp-tabs" role="tablist">${VPTABS.map(([k,l,i])=>`<button type="button" role="tab" class="${tab===k?"on":""}" data-vptab="${k}">${ic(i)} ${l}</button>`).join("")}</div>
        ${relHTML(name)}
      </div>
      ${body}
    </div>
    <aside class="vp-side card sv-card">
      <div class="vp-por">${img(v.n,"xl",true,true)}</div>
      <h2><a class="vp-name" href="${wikiURL(v.n)}" target="_blank" rel="noopener" title="Open ${esc(v.n)} on the Stardew Valley Wiki">${esc(v.n)} ↗</a></h2>
      <div class="vp-facts">
        <div><span class="muted">Birthday</span><b>${SICON[v.s]} ${cap(v.s)} ${v.d}</b></div>
        <div><span class="muted">Lives at</span><b>${esc(v.home)}</b></div>
        ${v.m?`<div><span class="muted">Romance</span><b>${MARRY(v.n)} ${REL[relStatus(v.n)][0]}</b></div>`:""}
      </div>
    </aside>
  </div>`;
}

// Universal gift tastes: what (almost) every villager loves, likes, dislikes and hates
function renderUniversal(vtabs){
  // one always-open row per reaction: label on the left, every item on the right
  const sec=(k,title,pts,list)=>`<div class="uni-row ${k}"><div class="uni-l">${emo(k)}<b>Everyone ${title}</b><span class="muted small">${pts} friendship</span></div>${gtiles(list,k)}</div>`;
  return `<h1>Town</h1>${vtabs}<p class="sub">Gifts that work the same for every villager. A villager's own list always wins. A ${ic("Quest")} with a number under an item means that many villagers feel differently about it. Hover for names, or click the item to see who loves, likes, dislikes and hates it.</p>
  <div class="sv-list uni-list">
    ${sec("love","loves","+80",UNIVERSAL.L)}
    ${sec("like","likes","+45",UNIVERSAL.K)}
    ${sec("dislike","dislikes","−20",UNIVERSAL.D)}
    ${sec("hate","hates","−40",UNIVERSAL.H)}
  </div>
  <p class="small muted">${IC.note()} Exceptions to the universal loves: Haley hates Prismatic Shard, and Penny hates Rabbit's Foot. Birthday gifts are worth 8× friendship.</p>`;
}
// villagers now open their own page instead of a pop-up
function villagerModal(name){if(VILLAGERS.some(x=>x.n===name))openVillager(name);}

// Collapsible section ("dropdown"). Every visit to the site starts with all of them folded;
// while the site stays open, switching tabs keeps them the way the person left them.
const secOpen=k=>!!(ui.secOpen&&ui.secOpen[k]);
const secBtns=()=>`<button class="iconbtn small" type="button" data-secopen>▾ Expand all</button><button class="iconbtn small" type="button" data-secall>▴ Collapse all</button>`;
const collapseAllBtn=()=>`<div class="toolbar">${secBtns()}</div>`;
const section=(k,title,inner,cls="")=>`<details class="sec ${cls}" data-sec="${esc(k)}" ${secOpen(k)?"open":""}><summary>${title}<i class="sec-chev">▾</i></summary><div class="sec-body">${inner}</div></details>`;
// Machine sub-groups: what kind of thing they process
const MGROUPS=[["Animal products","Egg",["Mayonnaise Machine","Cheese Press","Loom"]],["Crops & fruit","Grape",["Keg","Preserves Jar","Dehydrator","Oil Maker"]],
  ["Aging","Wine",["Cask"]],["Flowers & fish","Honey",["Bee House","Fish Smoker"]]];
function renderAnimals(){
  const every=d=>d===1?"Every day":d===2?"Every other day":`Every ${d} days`;
  // Animal sub-groups by building family; a Big/Deluxe building is the same building, upgraded by Robin
  const AGROUPS=[["Coop","Coop","Coop animals"],["Barn","Barn","Barn animals"]];
  const tier=h=>/Deluxe/.test(h)?2:/Big/.test(h)?1:0;
  const needs=a=>{const t=tier(a.home),b=/Coop/.test(a.home)?"Coop":"Barn";return t===0?`<span class="pill ok">Any ${b}</span>`:`<span class="pill upg" title="Build a ${b}, then have Robin upgrade it">${esc(a.home)} Upgrade</span>`;};
  const animalCard=a=>`<div class="card">
    <div style="display:flex;gap:10px;align-items:center">${img(a.n,"md")}<div style="flex:1"><h2 style="margin:0">${esc(a.n)}</h2>
      <div class="small muted">${a.cost?g(a.cost):"Can't be bought"}</div></div>${wiki(a.n)}</div>
    <div style="margin-top:6px">${needs(a)}</div>
    <div class="small" style="margin:8px 0 4px">${IC.time()} ${every(a.every)}</div>
    <table class="mini">${a.prod.map(p=>`<tr><td>${img(p[0],"sm")}<span class="item" data-search="${esc(p[0])}">${esc(p[0])}</span>
      ${p[2]?`<div class="muted small" style="white-space:normal;margin-left:20px">→ ${esc(p[2])} <b>${g(p[3])}</b></div>`:""}</td><td class="num">${g(p[1])}</td></tr>`).join("")}</table>
    <p class="small muted" style="margin:8px 0 0">${esc(a.note)}</p>
  </div>`;
  const machineCard=m=>`<div class="card">
    <div style="display:flex;gap:10px;align-items:center">${img(m.n,"md")}<div style="flex:1"><h2 style="margin:0">${esc(m.n)}</h2>
      <div class="small muted">Get it: ${esc(m.get)}</div></div>${wiki(m.n)}</div>
    <div class="small" style="margin:6px 0">${ic("Wood","Materials")} ${esc(m.mats)}</div>
    <div class="goods">${m.goods.map(gd=>`<div class="good">
      <div class="good-top">${img(gd[0],"sm")}<b class="item" data-search="${esc(gd[0])}">${esc(gd[0])}</b><span class="good-price">${esc(gd[3])}</span></div>
      <div class="good-sub">from ${esc(gd[1])} · ${IC.time()} ${esc(gd[2])}</div>
    </div>`).join("")}</div>
    ${m.note?`<p class="small muted" style="margin:8px 0 0">${IC.tip()} ${esc(m.note)}</p>`:""}
  </div>`;
  const subhead=(icon,title,count,note="")=>`${ic(icon)} ${title} <span class="small muted">(${count})</span>${note?`<span class="sub-note">${note}</span>`:""}`;
  const animals=AGROUPS.map(([b,icon,title])=>{const list=ANIMALS.filter(a=>a.home.includes(b)).sort((x,y)=>tier(x.home)-tier(y.home));
    return section("a-"+b,subhead(icon,title,list.length,`Big ${b} and Deluxe ${b} are the same ${b}, upgraded at Robin's`),`<div class="grid g3">${list.map(animalCard).join("")}</div>`,"sub");}).join("");
  const grouped=new Set(MGROUPS.flatMap(x=>x[2]));
  const mg=[...MGROUPS,["Other","Keg",MACHINES.filter(m=>!grouped.has(m.n)).map(m=>m.n)]].filter(x=>x[2].length);
  const machines=`<p class="sub" style="margin-top:4px">Artisan goods sell for 40% more with the Artisan profession (Farming level 10).</p>`+
    mg.map(([title,icon,names])=>{const list=names.map(n=>MACHINES.find(m=>m.n===n)).filter(Boolean);
      return section("m-"+title,subhead(icon,title,list.length),`<div class="grid g2">${list.map(machineCard).join("")}</div>`,"sub");}).join("");
  return `<h1>Animals & Artisan Goods</h1><p class="sub">Farm animals, what they produce, and which machine turns their products into more money. Buy animals at Marnie's Ranch; Robin builds and upgrades the coops and barns. Click a heading to open or fold it.</p>
  ${collapseAllBtn()}
  ${section("animals",`${ic("White Chicken")} Farm animals <span class="small muted">(${ANIMALS.length})</span>`,animals)}
  ${section("machines",`${ic("Keg")} Machines <span class="small muted">(${MACHINES.length})</span>`,machines)}`;
}

// Sell price for the chosen quality and Tiller profession (quality first, then +10% Tiller, rounded down like the game)
// rice toggles on the Crops tab: "Near water" uses waterDays (6 instead of 8); "Milled" sells it as Rice (flat price: no quality or Tiller bonus)
const cropDays=c=>c.waterDays&&ui.riceWater?c.waterDays:c.days;
// when milled, the row shows the milled product (Rice) instead of the crop
const cropName=c=>c.mill&&ui.riceMill?"Rice":c.n;
// rice: clicking its icon switches Unmilled Rice <-> Rice (milled, flat price); clicking its grow time switches 8d <-> 6d (near water)
const cropIcon=c=>!c.mill?img(c.n):`<button type="button" class="crop-tgl" data-ricemill aria-pressed="${!!ui.riceMill}" title="${ui.riceMill?`Milled into Rice at the Mill, sold for ${c.mill}g (no quality or Tiller bonus). Click for Unmilled Rice`:"Unmilled Rice. Click to count it as milled into Rice"}">${img(cropName(c))}</button>`;
const cropGrow=c=>!c.waterDays?`${c.days}d`:`<button type="button" class="crop-tgl grow-tgl ${ui.riceWater?"on":""}" data-ricewater aria-pressed="${!!ui.riceWater}" title="${ui.riceWater?`Planted near water (within about 3 tiles): ${c.waterDays} days. Click for away from water (${c.days} days)`:`Away from water: ${c.days} days. Click for planted near water (${c.waterDays} days)`}">${cropDays(c)}d</button>`;
const sellPrice=c=>c.mill&&ui.riceMill?c.mill:Math.floor(Math.floor(c.sell*ui.quality)*(ui.tiller?1.1:1));
const QUALITIES=[[1,"Normal",null],[1.25,"Silver","Silver Quality Icon"],[1.5,"Gold","Gold Quality Icon"],[2,"Iridium","Iridium Quality Icon"]];
function cropCalc(c,season,startDay){
  // days available from planting until end of the crop's last consecutive season
  const si=c.s.indexOf(season);
  if(si<0)return {h:0,profit:0,single:0,gpd:0};
  const remainingSeasons=c.s.length-si;
  const W=remainingSeasons*28-startDay; // last harvest must be on or before day 28 of last season
  const val=sellPrice(c)*(c.y||1);
  const seed=c.seed||0;
  let h,profit;
  const days=cropDays(c);
  if(c.re){h=days<=W?1+Math.floor((W-days)/c.re):0;profit=h*val-(h?seed:0);}
  else{h=Math.floor(W/days);profit=h*(val-seed);}
  return {h,profit,single:val-seed,gpd:W>0?profit/(W+1):0};
}

/* why you can't buy this crop's seeds yet in your current year (empty = you can) */
function cropLock(c,day){
  if(c.yr&&st.year<c.yr)return `Year ${c.yr}+`;
  if(c.from&&st.year===1&&day<c.from)return `From Spring ${c.from}`;
  if(c.shop==="oasis"&&!busOpen())return "Complete: Vault";
  if(c.lock&&!unlocked(c))return lockReason(c);
  if(c.shop==="cart")return "Traveling Cart only";
  return "";
}
// crop and fish cards fold open/closed: click the card (not its links or tick box); Expand all / Collapse all
const cardShut=k=>k in (ui.cardOpen||{})?!ui.cardOpen[k]:!!ui.cardsShut;
const cardFoldBtns=(cls="")=>`<div class="toolbar card-fold ${cls}"><button type="button" class="iconbtn small" data-cardall="open">▾ Expand all</button><button type="button" class="iconbtn small" data-cardall="close">▸ Collapse all</button></div>`;
function renderCrops(){
  const s=ui.cSeason||st.season;
  const rows=CROPS.filter(c=>c.s.includes(s)&&(ui.special||c.found||(c.seed!=null&&!cropLock(c,ui.plantDay)))).map(c=>({c,lock:cropLock(c,ui.plantDay),...cropCalc(c,s,ui.plantDay)}));
  const key={n:r=>r.c.n,seed:r=>r.c.seed||0,days:r=>cropDays(r.c),re:r=>r.c.re||0,sell:r=>sellPrice(r.c),single:r=>r.single,h:r=>r.h,profit:r=>r.profit,gpd:r=>r.gpd}[ui.cSort];
  // crops that earn nothing (0 gold/day: no harvest before the season ends) always go to the bottom, greyed out
  const dead=r=>r.gpd<=0;
  rows.sort((a,b)=>(dead(a)-dead(b))||(()=>{const x=key(a),y=key(b);return (typeof x==="string"?x.localeCompare(y):x-y)*ui.cDir;})());
  const th=(k,l,num)=>`<th class="${num?"num":""}${ui.cSort===k?" on":""}" data-csort="${k}">${l}${ui.cSort===k?(ui.cDir>0?" ▲":" ▼"):""}</th>`;
  const cropHead=`<tr>${th("n","Crop")}<th>Seasons</th>${th("days","Grow",1)}${th("re","Regrow",1)}${th("sell","Sells",1)}${th("single","Profit (1)",1)}${th("h","Harvests",1)}${th("profit","Total profit",1)}${th("gpd","Gold/day",1)}<th>Notes</th></tr>`;
  const cropRow=r=>`<tr data-card="c:${esc(r.c.n)}" class="${r.lock?"locked":""} ${dead(r)?"dead":""}${cardShut("c:"+r.c.n)?" shut":""}" ${dead(r)?`title="No harvest before the season ends if planted on ${cap(s)} ${ui.plantDay}"`:""}><td><div class="crop-cell"><i class="card-chev" aria-hidden="true">▾</i>${cropIcon(r.c)}<div><b class="item" data-search="${esc(cropName(r.c))}">${esc(cropName(r.c))}</b> ${wiki(cropName(r.c),"↗")}${r.lock?`<span class="crop-lock" title="You can't buy these seeds yet in Year ${st.year}">${r.lock}</span>`:""}
        <div class="crop-seed" title="Seed price">${r.c.seed==null?(r.c.found?'<span class="muted" title="Seeds can\x27t be bought: you find them (artifact spots, mystery boxes…)">found seeds</span>':'<span class="muted">seed n/a</span>'):g(r.c.seed)}</div></div></div></td><td>${seasonPills(r.c.s)}</td>
      <td class="num">${cropGrow(r.c)}</td>
      <td class="num">${r.c.re?r.c.re+"d":"—"}</td><td class="num">${g(sellPrice(r.c))}${r.c.y?` <span class="muted">×${r.c.y}</span>`:""}</td>
      <td class="num" title="Profit from one harvest: what it sells for, minus the seed" style="color:${r.single<0?"var(--love)":"inherit"}">${g(Math.round(r.single))}</td>
      <td class="num" title="Harvests possible before the season ends">${r.h}</td><td class="num" style="color:${r.profit<0?"var(--love)":"inherit"}">${g(Math.round(r.profit))}</td>
      <td class="num"><b>${r.gpd.toFixed(1)}</b></td><td class="small muted" style="white-space:normal;min-width:200px">${esc(r.c.note||"")}</td></tr>`;
  return `<h1>Crops</h1><p class="sub">Profit calculator: one tile, planted on the day you pick, replanted after each harvest (or left to regrow) until the season ends.</p>
  <div class="toolbar">
    <div class="seg">${SEASONS.map(x=>`<button class="${x===s?"on":""}" data-cs="${x}">${SICON[x]} ${cap(x)}</button>`).join("")}</div>
    <span class="small">Plant on</span><div class="datewrap">
      <button type="button" class="iconbtn datebtn plantbtn" id="plantBtn" aria-haspopup="true" aria-expanded="false" title="Pick the day you plant">${SICON[s]}<span>${cap(s)} ${ui.plantDay}</span><i>▾</i></button>
      <div class="date-pop plant-pop" id="plantPop" role="dialog" aria-label="Pick the planting day">
        <div class="mini-cal"><div class="mc-grid">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(w=>`<span class="mc-dow">${w}</span>`).join("")}${Array.from({length:28},(_,i)=>i+1).map(d=>`<button type="button" class="mc-day ${d===ui.plantDay?"on":""} ${s===st.season&&d===st.day?"today":""}" data-plant="${d}" title="Plant on ${cap(s)} ${d}${s===st.season&&d===st.day?" (today)":""}"><b>${d}</b></button>`).join("")}</div>
        <p class="mc-hint">Pick the day you plant</p></div>
      </div></div>
    <span class="small">Quality</span><div class="seg qseg" role="group" aria-label="Crop quality">${QUALITIES.map(([q,l,icon])=>`<button type="button" class="${ui.quality===q?"on":""}" data-quality="${q}" aria-pressed="${ui.quality===q}" title="${l}${q>1?` (×${q})`:""}">${icon?ic(icon):""}${l}</button>`).join("")}</div>
    <button type="button" class="iconbtn small tglbtn ${ui.tiller?"on":""}" data-tiller aria-pressed="${ui.tiller}" title="Tiller profession: crops sell for 10% more">${ic("Tiller")} Tiller +10%</button>    <label class="small"><input type="checkbox" id="special" ${ui.special?"checked":""}> Show crops you can't buy seeds for (yet)</label>
  </div>
  ${cardFoldBtns()}
  ${s==="winter"?'<p class="muted">Outdoors in winter only Powdermelon grows (plus Winter Seeds, which give forage). Everything else needs the Greenhouse.</p>':""}
  ${rows.some(r=>r.c.found)?`<h2 class="found-h">${ic("Artifact Spot")} Crops from found seeds</h2><p class="small muted">You can't buy these seeds in shops: they come from artifact spots, mystery boxes, fishing treasure and the like. Profit counts the seeds as free.</p>
  <div class="tablewrap"><table class="crops found">
    ${cropHead}
    ${rows.filter(r=>r.c.found).map(cropRow).join("")}
  </table></div>`:""}
  ${rows.some(r=>!r.c.found)?`${rows.some(r=>r.c.found)?`<h2 class="found-h">${ic("Parsnip Seeds")} Crops from shop seeds</h2>`:""}<div class="tablewrap"><table class="crops">
    ${cropHead}
    ${rows.filter(r=>!r.c.found).map(cropRow).join("")}
  </table></div>`:""}
  <p class="small muted">The price under each crop's name is the seed price. “Seed n/a” means you can't buy it normally, so profit counts the seed as free. Profit (1) = one harvest's sale minus the seed. Yields above ×1 are averages.</p>`;
}

function renderFish(){
  const s=ui.fSeason||st.season;
  const locs=["all","Ocean","River","Mountain Lake","Forest Pond","Secret Woods","Mines","Desert","Sewers","Legendary"];
  let list=FISH.filter(f=>(s==="all"||f.s.includes(s)));
  if(ui.fLoc==="Legendary")list=list.filter(f=>f.leg);else if(ui.fLoc!=="all")list=list.filter(f=>f.loc.includes(ui.fLoc));
  if(ui.fWeather!=="all")list=list.filter(f=>f.w===ui.fWeather||f.w==="any");
  if(ui.fHide)list=list.filter(f=>!st.fish[f.n]);
  const key={n:f=>f.n,loc:f=>f.loc,p:f=>f.p}[ui.fSort];
  list.sort((a,b)=>{const x=key(a),y=key(b);return (typeof x==="string"?x.localeCompare(y):x-y)*ui.fDir;});
  const th=(k,l,num)=>`<th class="${num?"num":""}${ui.fSort===k?" on":""}" data-fsort="${k}">${l}${ui.fSort===k?(ui.fDir>0?" ▲":" ▼"):""}</th>`;
  const caught=FISH.filter(f=>st.fish[f.n]).length;
  return `<h1>Fish</h1><p class="sub">${caught} of ${FISH.length} caught. Caught fish fade out (they come from your connected farm).</p>
  <div class="toolbar">
    <div class="seg">${["all",...SEASONS].map(x=>`<button class="${x===s?"on":""}" data-fs="${x}">${x==="all"?"All":SICON[x]+" "+cap(x)}</button>`).join("")}</div>
    <select id="fLoc">${locs.map(l=>`<option value="${l}" ${ui.fLoc===l?"selected":""}>${l==="all"?"All locations":l}</option>`).join("")}</select>
    <select id="fWeather"><option value="all">Any weather</option><option value="sun" ${ui.fWeather==="sun"?"selected":""}>Sunny day</option><option value="rain" ${ui.fWeather==="rain"?"selected":""}>Rainy day</option></select>
    <label class="small"><input type="checkbox" id="fHide" ${ui.fHide?"checked":""}> Hide caught</label>
  </div>
  ${cardFoldBtns("fish-fold")}
  <div class="tablewrap"><table class="fishes">
    <tr><th>✓</th>${th("n","Fish")}${th("loc","Where")}<th>Seasons</th><th>Time</th><th>Weather</th>${th("p","Price",1)}<th>Bundles</th></tr>
    ${list.map(f=>{const bs=BUNDLES.filter(b=>b.items.includes(f.n));return `<tr data-card="f:${esc(f.n)}" class="${st.fish[f.n]?"done":""}${cardShut("f:"+f.n)?" shut":""}">
      <td><input type="checkbox" data-fish="${esc(f.n)}" ${st.fish[f.n]?"checked":""} style="accent-color:var(--accent);width:17px;height:17px"></td>
      <td><i class="card-chev" aria-hidden="true">▾</i>${img(f.n)}<b class="item" data-search="${esc(f.n)}">${esc(f.n)}</b> ${f.leg?IC.star():""} ${wiki(f.n,"↗")}</td><td style="white-space:normal;min-width:160px">${esc(f.loc)}</td>
      <td>${seasonPills(f.s)}</td><td>${esc(f.t)}</td><td>${f.w==="any"?'<span class="wtxt">Any</span>':f.w==="rain"?IC.rain()+'<span class="wtxt"> Rain</span>':IC.sun()+'<span class="wtxt"> Sun</span>'}</td>
      <td class="num">${g(f.p)}</td><td>${bs.map(b=>pill(b.n,"ok")).join("")}</td></tr>`;}).join("")||'<tr><td colspan="8" class="muted">No fish match these filters.</td></tr>'}
  </table></div>
  ${list.some(f=>f.note)?`<p class="small muted">${IC.star()} Legendary fish: you can catch each one only once (unless you get the 1.6 Qi quest versions).</p>`:""}`;
}

/* finishing the Vault repairs the bus to the Desert (Oasis seeds) */
const VAULT=BUNDLES.filter(b=>b.room==="Vault");
// what finishing each whole room gives you
const ROOM_REWARD={"Crafts Room":"Bridge to the Quarry repaired","Pantry":"Greenhouse","Fish Tank":"Glittering Boulder removed",
  "Boiler Room":"Minecarts repaired","Bulletin Board":"Friendship boost with villagers","Vault":"Bus to the Desert repaired","Abandoned JojaMart":"Movie Theater"};
const busFixed=()=>VAULT.every(b=>b.items.every(i=>st.bundles[b.n+"|"+i]));
const bundleDone=b=>b.items.filter(i=>st.bundles[b.n+"|"+i]).length>=(b.need||b.items.length);
// Willy's boat to Ginger Island can only be fixed after the Community Center is finished
const ccDone=()=>BUNDLES.filter(b=>b.room!=="Abandoned JojaMart").every(bundleDone);
// once the Vault is finished the bus counts as repaired for good (saved), even if Vault ticks are cleared later;
// the "Bus repaired" box on villager schedules sets the same thing by hand
const busOpen=()=>{if(st.busOK==null&&busFixed()){st.busOK=true;save();}return st.busOK===true;};
const LOCKS={bus:["Complete: Vault",busOpen],island:["Complete: Community Center",ccDone]};
/* things the player hasn't unlocked yet are left out of the calendar and the tips (x.yr: from that year; x.lock: a LOCKS key) */
const lockReason=x=>x.yr&&st.year<x.yr?`From Year ${x.yr}`:x.lock&&LOCKS[x.lock]&&!LOCKS[x.lock][1]()?LOCKS[x.lock][0]:"";
const unlocked=x=>!lockReason(x);
function renderBundles(){
  const rooms=[...new Set(BUNDLES.map(b=>b.room))];
  const bp=bundleProgress();
  const isDone=b=>b.items.filter(i=>st.bundles[b.n+"|"+i]).length>=(b.need||b.items.length);
  return `<h1>Community Center Bundles</h1><p class="sub">${bp.bundlesDone} of ${BUNDLES.length} bundles complete. This is the standard bundle set (not Remixed). Click a room to see its bundles.</p>
  ${collapseAllBtn()}
  <div class="rooms">${rooms.map(r=>{
    const list=BUNDLES.filter(b=>b.room===r), n=list.filter(isDone).length, all=n===list.length;
    return section("b:"+r,`<input type="checkbox" class="room-tick" data-roomtick="${esc(r)}" ${all?"checked":""} title="${all?"Untick to clear":"Tick to mark"} every bundle in the ${esc(r)}${r==="Vault"?" (this also counts the bus as repaired)":""}" aria-label="${esc(r)} complete"><b class="room-name">${esc(r)}</b><span class="room-rew">${ROOM_REWARD[r]?`Reward: <b>${esc(ROOM_REWARD[r])}</b>`:""}</span><span class="room-prog"><span class="bar room-bar"><i style="width:${n/list.length*100}%"></i></span><span class="room-count ${all?"all":""}">${n} / ${list.length} ${list.length===1?"bundle":"bundles"}</span></span>`,
      `<div class="grid g3">${list.map(b=>bundleCard(b)).join("")}</div>`,"room"+(all?" room-done":"")+(/joja/i.test(r)?" room-joja":""));}).join("")}</div>`;
}
function bundleCard(b){
    const need=b.need||b.items.length, have=b.items.filter(i=>st.bundles[b.n+"|"+i]).length, done=have>=need;
    return `<div class="card ${done?"complete":""}">
      <h2 style="margin:0 0 4px">${done?IC.done()+" ":""}${esc(b.n)}</h2>
      <div class="small muted">${b.need?`Any ${need} of ${b.items.length} · `:""}${Math.min(have,need)}/${need} · Reward: <b>${esc(b.r)}</b></div>
      <div class="bar" style="margin:8px 0"><i style="width:${Math.min(100,have/need*100)}%"></i></div>
      <div class="checklist">${b.items.map(i=>{const k=b.n+"|"+i,c=!!st.bundles[k];return `<label class="${c?"done":""}"><input type="checkbox" data-bundle="${esc(k)}" ${c?"checked":""}>${img(i)}<span>${esc(i)}</span>${INDEX.get(baseName(i).toLowerCase())?.refs.length>1?` <span class="item small muted" data-search="${esc(baseName(i))}">${IC.info()}</span>`:""}</label>`;}).join("")}</div>
    </div>`;
}

function renderFestivals(){
  return `<h1>Festivals & Events</h1><p class="sub">The shops close on festival days, and most festivals start when you arrive at the location.</p>
  <div class="grid g3 fest-grid">${FESTIVALS.map(f=>{let dd=dayDiff(st.season,st.day,f.s,f.days[0]);if(dd<-(f.days.length-1))dd+=112;return `
    <a class="card fest-card" id="fest-${esc(f.n.replace(/W/g,""))}" href="${wikiURL(f.n)}" target="_blank" rel="noopener" title="Open ${esc(f.n)} on the Stardew Valley Wiki">
      <div class="fest-top"><span class="pill ${f.s} fest-date">${img(FEST_ICON[f.n]||"StatusFestival","si")}<b>${f.days.join(", ")}</b></span>${!unlocked(f)?pill(lockReason(f)):dd<=0&&dd>-(f.days.length)?pill("Today!","love"):dd<=7?pill("in "+dd+"d","ok"):""}</div>
      <h2 class="fest-name">${esc(f.n)}</h2>
      <div class="fest-line">${IC.place()}<span>${esc(f.where)}</span></div>
      <div class="fest-line">${IC.time()}<span>${esc(f.t)}</span></div>
      <p class="fest-note">${esc(f.note)}</p></a>`;}).join("")}</div>`;
}

function renderSearch(){
  const q=query.toLowerCase().trim();
  const hl=s=>{const i=s.toLowerCase().indexOf(q);return i<0?esc(s):esc(s.slice(0,i))+`<span class="hl">${esc(s.slice(i,i+q.length))}</span>`+esc(s.slice(i+q.length));};
  const vil=VILLAGERS.filter(v=>v.n.toLowerCase().includes(q));
  const items=[...INDEX.values()].filter(x=>x.name.toLowerCase().includes(q)).sort((a,b)=>(a.name.toLowerCase().startsWith(q)?0:1)-(b.name.toLowerCase().startsWith(q)?0:1)||a.name.localeCompare(b.name));
  const fests=FESTIVALS.filter(f=>f.n.toLowerCase().includes(q)||f.where.toLowerCase().includes(q));
  const locFish=FISH.filter(f=>f.loc.toLowerCase().includes(q)&&!f.n.toLowerCase().includes(q));
  if(!vil.length&&!items.length&&!fests.length&&!locFish.length)return `${backBtn(view)}<h1>No results for “${esc(query)}”</h1><p class="sub">Try a shorter word, e.g. “pump” or “bass”.</p>`;
  let h=`<div class="res">${backBtn(view)}<h1>Results for “${esc(query)}”</h1>`;
  if(vil.length)h+=`<h3>Villagers</h3><div class="grid g3">${vil.map(v=>`<div class="card click sv-card" data-villager="${esc(v.n)}"><div class="vhead">${img(v.n,"lg",true)}<div><h2 style="margin:0">${hl(v.n)} ${v.m?MARRY(v.n):""}${HEARTTAG(v.n)}</h2><div class="small muted">${SICON[v.s]} ${cap(v.s)} ${v.d} · ${esc(v.home)}</div></div></div>${srLoves(v.loves)}</div>`).join("")}</div>`;
  if(items.length)h+=`<h3>Items</h3><div class="grid g2">${items.slice(0,40).map(x=>itemCard(x,hl)).join("")}</div>`;
  if(fests.length)h+=`<h3>Festivals</h3><div class="grid g3">${fests.map(f=>`<div class="card click" data-fest="${esc(f.n)}"><h2 style="margin:0">${hl(f.n)}</h2><div class="small muted">${SICON[f.s]} ${cap(f.s)} ${f.days.join(", ")} · ${esc(f.where)}</div></div>`).join("")}</div>`;
  if(locFish.length)h+=`<h3>Fish found at “${esc(query)}”</h3><div>${locFish.map(f=>`<span class="pill item" data-search="${esc(f.n)}">${esc(f.n)}</span>`).join("")}</div>`;
  return h+"</div>";
}
// sell price next to an item's name; quality items also list Silver / Gold / Iridium prices
function itemPrice(name,crop,fish,prods){
  let p=typeof PRICES!=="undefined"?PRICES[name]:undefined;
  if(p===undefined)p=crop?crop.sell:fish?fish.p:prods.length?prods[0].p[1]:undefined;
  if(p===undefined)return `<span style="flex:1"></span>`;
  if(typeof p==="string")return `<span class="iprice"><span class="iprice-f" title="Sell price">${esc(p)}</span></span>`;
  if(!p)return `<span class="iprice"><span class="iprice-f">Can't be sold</span></span>`;
  const qs=typeof PRICE_Q!=="undefined"&&PRICE_Q.has(name)?QUALITIES.slice(1):typeof PRICE_SILVER!=="undefined"&&PRICE_SILVER.has(name)?QUALITIES.slice(1,2):[];
  return `<span class="iprice"><span class="iprice-b" title="Sell price (normal quality)">${g(p)}</span>${qs.map(([m,l,icon])=>`<span class="iprice-q" title="${l} quality">${ic(icon)}${g(Math.floor(p*m))}</span>`).join("")}</span>`;
}
function itemCard(x,hl=esc){
  const r=x.refs, by=t=>[...new Set(r.filter(z=>z.type===t).map(z=>z.v))];
  // universal gifts: all four reactions, with "All" (everyone not named) under the universal one
  const uk=uniTaste(x.name), mine=uk?exceptionsFor(x.name,null):null;
  const who=t=>uk?mine.filter(z=>z.k===t).map(z=>z.v.n):by(t);
  const loves=who("love"), likes=who("like"), dislikes=who("dislike"), hates=who("hate"), uni=false;
  const crop=r.find(z=>z.type==="crop")?.c, fish=r.find(z=>z.type==="fish")?.f, bund=[...new Set(r.filter(z=>z.type==="bundle").map(z=>z.b))];
  const animal=r.find(z=>z.type==="animal")?.a, prods=r.filter(z=>z.type==="product"), machine=r.find(z=>z.type==="machine")?.m, goods=r.filter(z=>z.type==="good");
  const people=(label,list,cls)=>{const all=uk===cls?`<span class="pill ${cls}" title="Every villager not named on this card">All</span>`:"";
    return list.length||all||uk?`<div class="small">${label}: ${all}${list.map(n=>`<span class="pill ${cls} item" data-villager="${esc(n)}">${img(n,"sm")}${esc(n)}</span>`).join("")}${!list.length&&!all?`<span class="muted">No one</span>`:""}</div>`:"";};
  return `<div class="card"><h2 style="margin:0 0 6px;display:flex;gap:8px;align-items:center">${img(x.name,"md")}<span>${hl(x.name)}</span>${itemPrice(x.name,crop,fish,prods)}<span class="small">${wiki(x.name)}</span></h2>
    ${animal?`<div class="small">${ic("White Chicken")} <b>Animal</b>: lives in a ${esc(animal.home)} · ${animal.cost?g(animal.cost):"can't be bought"} · produces ${animal.prod.map(p=>esc(p[0])).join(", ")}</div>`:""}
    ${prods.map(z=>`<div class="small">${ic("Egg")} <b>Animal product</b> from the ${esc(z.a.n)}${z.p[2]?` · turn it into ${esc(z.p[2])} for ${g(z.p[3])}`:""}</div>`).join("")}
    ${machine?`<div class="small">${ic("Keg")} <b>Machine</b>: ${esc(machine.get)} · makes ${machine.goods.map(gd=>esc(gd[0])).join(", ")}</div>`:""}
    ${goods.map(z=>`<div class="small">${ic("Preserves Jar")} <b>Made in a ${esc(z.m.n)}</b> from ${esc(z.gd[1])} · ${esc(z.gd[2])} · ${esc(z.gd[3])}</div>`).join("")}
    ${crop?`<div class="small">${ic("Wheat")} <b>Crop</b>: ${seasonPills(crop.s)} ${crop.days} days${crop.re?`, regrows every ${crop.re}d`:""}${crop.seed!=null?` · seed ${g(crop.seed)}`:""}${crop.note?`<div class="muted">${esc(crop.note)}</div>`:""}</div>`:""}
    ${fish?`<div class="small">${ic("Bamboo Pole")} <b>Fish</b>: ${esc(fish.loc)} · ${seasonPills(fish.s)} · ${esc(fish.t)}${fish.w!=="any"?` · ${fish.w==="rain"?IC.rain()+" rain":IC.sun()+" sun"} only`:""} ${st.fish[fish.n]?pill("Caught ✓","ok"):""}</div>`:""}
    ${uni?`<div class="small">${emo("love","sm")} <b>Universal love</b>: almost everyone loves this.</div>`:""}
    ${people(emo("love","sm")+" <b>Loved by</b>",loves,"love")}
    ${people(emo("like","sm")+" <b>Liked by</b>",likes,"like")}
    ${people(emo("dislike","sm")+" <b>Disliked by</b>",dislikes,"dislike")}
    ${people(emo("hate","sm")+" <b>Hated by</b>",hates,"hate")}
    ${bund.length?`<div class="small">${ic("Bundle Green")} <b>Bundles</b>: ${bund.map(b=>`<span class="pill ok item" data-gobundle="${esc(b.room)}">${esc(b.room)} → ${esc(b.n)}</span>`).join("")}</div>`:""}
  </div>`;
}

/* ================= MODAL ================= */
function openModal(html,cls=""){$("mbody").innerHTML=html;coinify($("mbody"));$("modal").firstElementChild.className="card "+cls;$("modal").classList.add("open");}
function closeModal(){$("modal").classList.remove("open");}
$("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal();});
// remember which collapsible sections are folded
document.addEventListener("toggle",e=>{const d=e.target;if(d.dataset&&d.dataset.sec){ui.secOpen=ui.secOpen||{};ui.secOpen[d.dataset.sec]=d.open;}},true);
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.classList?.contains("plaque-link")){go(e.target.dataset.tab);return;}if(e.key==="Escape"){closeModal();toggleDatePop(false);toggleBgPop(false);}if(e.key==="/"&&document.activeElement.tagName!=="INPUT"){e.preventDefault();$("q").focus();}});

function festModal(name){const f=FESTIVALS.find(x=>x.n===name);if(!f)return;
  openModal(`<h1>${IC.fest(f.n)} ${esc(f.n)}</h1><p>${spill(f.s,f.days.join(", "))}</p><p>${IC.place()} ${esc(f.where)}<br>${IC.time()} ${esc(f.t)}</p><p>${esc(f.note)}</p><p>${wiki(f.n,"Full wiki page ↗")}</p>`);}

function saveMenu(){
  openModal(`<h1>${ic("Chest")} Save & share progress</h1>
  <p class="small">Your checkmarks and date are saved in <b>this browser</b> automatically. To move them to another computer or share them with a friend:</p>
  <div class="toolbar"><button class="iconbtn" id="exp">${ic("Secret Note")} Export progress file</button><button class="iconbtn" id="imp">${ic("Chest")} Load progress file</button></div>
  <p class="small muted">Send the exported .json file along with this dashboard. The other person clicks “Load progress file” to see your progress.</p>
  <hr style="border:0;border-top:1px solid var(--line)">
  <p class="small"><b>Playing with the mod?</b> Connect your farm and your progress fills in by itself.</p>
  <div class="toolbar"><button class="iconbtn" id="farmOpen">${ic("Farmer")} ${st.farmCode?"Farm connection":"Connect your farm"}</button></div>
  <hr style="border:0;border-top:1px solid var(--line)">
  <button class="iconbtn" id="reset" style="color:var(--love)">Reset all progress</button>`);
  $("exp").onclick=()=>{const blob=new Blob([JSON.stringify(st,null,1)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="stardew-dash-progress.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
  $("imp").onclick=()=>$("importFile").click();
  $("farmOpen").onclick=()=>farmMenu();
  $("reset").onclick=()=>{if(confirm("Clear all fish and bundle checkmarks?")){st.fish={};st.bundles={};save();closeModal();render();}};
}
$("importFile").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);st=Object.assign({season:"spring",day:1,fish:{},bundles:{}},d);save();syncHeader();closeModal();render();alert("Progress loaded!");}catch(err){alert("That file couldn't be read.");}};r.readAsText(f);e.target.value="";});

/* ================= EVENTS ================= */
document.addEventListener("click",e=>{
  if(e.target.closest("a.wiki"))return;   // let wiki links open normally
  const ca=e.target.closest("[data-cardall]");
  if(ca){ui.cardsShut=ca.dataset.cardall==="close";ui.cardOpen={};document.querySelectorAll("tr[data-card]").forEach(t=>t.classList.toggle("shut",ui.cardsShut));return;}
  const cd=e.target.closest("tr[data-card]");
  if(cd&&getComputedStyle(cd).display==="grid"&&!e.target.closest("a,input,button,label,.item,select")){const k=cd.dataset.card,shut=!cd.classList.contains("shut");
    ui.cardOpen=ui.cardOpen||{};ui.cardOpen[k]=!shut;cd.classList.toggle("shut",shut);return;}
  const ct=e.target.closest("[data-cat]");if(ct){e.stopPropagation();catModal(ct.dataset.cat,ct.dataset.catk);return;}
  const vr=e.target.closest("[data-vrom]");if(vr){const o=["all","rom","non"];ui.vRom=o[(o.indexOf(ui.vRom||"all")+1)%3];render();return;}
  if(e.target.closest("[data-vreset]")){ui.vSort="hearts";ui.vRom="all";ui.vFind="";render();return;}
  const vs=e.target.closest("[data-vsort]");if(vs){ui.vSort=vs.dataset.vsort;render();return;}
  const vtb=e.target.closest("[data-vtab]");if(vtb){e.preventDefault();st.vTab=vtb.dataset.vtab;save();if(ui.vPage){go("villagers");}else render();return;}
  const bk=e.target.closest("[data-back]");if(bk){goBack(bk.dataset.back);return;}
  const hrt=e.target.closest("[data-heart]");if(hrt){const [hn,hl]=hrt.dataset.heart.split("|");st.hearts=st.hearts||{};st.hearts[hn]=st.hearts[hn]===+hl?+hl-1:+hl;save();const y=scrollY;render();scrollTo(0,y);return;}
  const sdy=e.target.closest("[data-schday]");if(sdy){ui.schDay=sdy.dataset.schday;const y=scrollY;render();scrollTo(0,y);return;}
  const vpt=e.target.closest("[data-vptab]");if(vpt){st.vpTab=vpt.dataset.vptab;save();const y=scrollY;render();scrollTo(0,y);return;}
  // planting-day calendar (Crops tab)
  if(e.target.closest("#plantBtn")){const p=$("plantPop"),o=!p.classList.contains("open");p.classList.toggle("open",o);$("plantBtn").setAttribute("aria-expanded",o);return;}
  const pd=e.target.closest("[data-plant]");
  if(pd){ui.plantDay=+pd.dataset.plant;const y=scrollY;render();scrollTo(0,y);return;}
  if($("plantPop")&&!e.target.closest("#plantPop"))$("plantPop").classList.remove("open");
  const qb=e.target.closest("[data-quality]");
  if(qb){ui.quality=+qb.dataset.quality;const y=scrollY;render();scrollTo(0,y);return;}
  if(e.target.closest("[data-tiller]")){ui.tiller=!ui.tiller;const y=scrollY;render();scrollTo(0,y);return;}
  if(e.target.closest("[data-ricewater]")){ui.riceWater=!ui.riceWater;const y=scrollY;render();scrollTo(0,y);return;}
  if(e.target.closest("[data-ricemill]")){ui.riceMill=!ui.riceMill;const y=scrollY;render();scrollTo(0,y);return;}
  if(e.target.closest("[data-secopen]")){document.querySelectorAll("#main details.sec:not([open])").forEach(d=>d.open=true);return;}
  if(e.target.closest("[data-secall]")){ui.secOpen={};document.querySelectorAll("details.sec[open]").forEach(d=>d.open=false);return;}
  // background picker
  if(e.target.closest("#bgBtn")){toggleDatePop(false);toggleBgPop();return;}
  const bo=e.target.closest("[data-bgopt]");
  if(bo){st.bg=bo.dataset.bgopt;save();applyBg();toggleBgPop(false);return;}
  const tho=e.target.closest("[data-themeopt]");
  if(tho){st.theme=tho.dataset.themeopt;applyTheme();applyBg();save();$("bgPop").innerHTML=bgMenu();return;}
  if(!e.target.closest("#bgPop"))toggleBgPop(false);
  // date picker
  if(e.target.closest("#dateBtn")){toggleDatePop();return;}
  // next day: Winter 28 rolls over to Spring 1 of the next year
  const yb=e.target.closest("[data-yr]");
  if(yb){const m=dateMax();st.year=Math.max(1,(st.year||1)+ +yb.dataset.yr);if(m&&st.year>=m.year){st.year=m.year;if(isFuture(st.season,st.day)){st.season=m.season;st.day=m.day;}}save();syncHeader();const y=scrollY;render();scrollTo(0,y);return;}
  const pk=e.target.closest("[data-pick]");
  if(pk){const [s,d]=pk.dataset.pick.split("|");if(isFuture(s,+d))return;toggleDatePop(false);setDate(s,+d);return;}
  const pcs=e.target.closest("[data-pcs]");
  if(pcs){ui.pickSeason=pcs.dataset.pcs;if($("datePop").classList.contains("open"))$("datePop").innerHTML=miniCal();return;}
  if(!e.target.closest("#datePop"))toggleDatePop(false);
  const t=e.target.closest("[data-tab],[data-villager],[data-fest],[data-search],[data-cal],[data-vf],[data-cs],[data-csort],[data-fs],[data-fsort],[data-room],[data-gobundle]");
  if(!t)return;
  const d=t.dataset;
  if(d.tab){e.preventDefault();go(d.tab);}
  else if(d.villager){e.stopPropagation();villagerModal(d.villager);}
  else if(d.fest)festModal(d.fest);
  else if(d.search)openSearch(d.search);
  else if(d.cal){ui.calSeason=d.cal;render();}
  else if(d.vf){ui.vFilter=d.vf;render();}
  else if(d.cs){ui.cSeason=d.cs;render();}
  else if(d.csort){if(ui.cSort===d.csort)ui.cDir*=-1;else{ui.cSort=d.csort;ui.cDir=d.csort==="n"?1:-1;}render();}
  else if(d.fs){ui.fSeason=d.fs;render();}
  else if(d.fsort){if(ui.fSort===d.fsort)ui.fDir*=-1;else{ui.fSort=d.fsort;ui.fDir=d.fsort==="p"?-1:1;}render();}
  else if(d.room){ui.bRoom=d.room;render();}
  else if(d.gobundle){ui.secOpen=ui.secOpen||{};ui.secOpen["b:"+d.gobundle]=true;go("bundles");}
});
document.addEventListener("change",e=>{
  const t=e.target,d=t.dataset;
  if(d.fish){if(t.checked)st.fish[d.fish]=1;else delete st.fish[d.fish];save();render();}
  else if(d.bundle){if(t.checked)st.bundles[d.bundle]=1;else delete st.bundles[d.bundle];save();const y=scrollY;render();scrollTo(0,y);}
  else if(d.roomtick){
    // tick: fill each unfinished bundle up to what it needs (keeps items already ticked); untick: clear the whole room
    BUNDLES.filter(b=>b.room===d.roomtick).forEach(b=>{
      if(!t.checked){b.items.forEach(i=>delete st.bundles[b.n+"|"+i]);return;}
      let have=b.items.filter(i=>st.bundles[b.n+"|"+i]).length;const need=b.need||b.items.length;
      for(const i of b.items){if(have>=need)break;const k=b.n+"|"+i;if(!st.bundles[k]){st.bundles[k]=1;have++;}}
    });
    save();const y=scrollY;render();scrollTo(0,y);}
  else if(t.id==="special"){ui.special=t.checked;render();}

  else if(t.id==="fLoc"){ui.fLoc=t.value;render();}
  else if(t.id==="fWeather"){ui.fWeather=t.value;render();}
  else if(t.id==="fHide"){ui.fHide=t.checked;render();}
});
document.addEventListener("mousemove",e=>{
  const t=e.target.closest&&e.target.closest("[data-tip]"),tip=$("svtip");
  if(!t){tip.style.display="none";return;}
  tip.textContent=t.dataset.tip;tip.style.display="block";
  const z=typeof ZOOM==="number"?ZOOM:1,x=Math.min(e.clientX/z+14,innerWidth/z-tip.offsetWidth-8);tip.style.left=x+"px";tip.style.top=(e.clientY/z+18)+"px";
});
// typing: the first letter opens a search page (one history step); more typing just updates it; clearing goes back to the tab
let qt;$("q").addEventListener("input",e=>{clearTimeout(qt);qt=setTimeout(()=>{query=e.target.value.trim();
  const onSearch=location.hash.startsWith("#search/");
  if(query)nav("search/"+encodeURIComponent(query),onSearch);else if(onSearch)nav(pageHash(),true);
  render();},120);});
// character select (placeholder): clicking swaps between the cat and dog heads; remembered in this browser
const applyChar=()=>{const p=document.querySelector("#charBox .pchar");if(p)p.className="pchar pchar-"+(st.char==="dog"?"dog":"cat");};
applyChar();
const curTheme=()=>st.theme||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
/* ---- Seasonal decorations ----
   side strips (wide screens only): climbing vines with wooden info plaques;
   header: a full-width strip of grass under the tabs, with farm things and Junimos standing on it in the empty space either side of the page */
const SEASON_COL={ // stem, leaf, leaf shadow, flower/berry, flower centre, grass top, grass, dirt
  spring:["#4f7d2f","#7bc043","#3f8f4a","#ff9ecf","#fff27a","#86a964","#5d8743","#6b4424"],
  summer:["#3d6e24","#4fae2f","#2e6b23","#ffd23f","#e86a17","#739a55","#4d7838","#5e3a1c"],
  fall:  ["#6b4a22","#e0702a","#b8401f","#8f1f2f","#c2273a","#b8945a","#94693a","#553419"],
  winter:["#6b5a4a","#3f7a4a","#2c5a36","#c2273a","#e8394a","#e3ebf1","#b3c4d2","#7a8fa1"]};
const svgURL=s=>`url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const R1=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
function vineSVG(season){const [st0,lf,ld,fl,fc]=SEASON_COL[season];let r="";
  [8,7,6,7,8,9,10,9].forEach((x,i)=>r+=R1(x,i*4,2,4,st0));                                   // wavy stem, repeats every 32px
  r+=R1(10,1,3,2,lf)+R1(13,2,1,1,ld)+R1(3,9,3,2,lf)+R1(2,10,1,1,ld)+R1(12,24,3,2,lf)+R1(15,25,1,1,ld); // leaves
  r+=R1(4,16,1,1,fl)+R1(2,16,1,1,fl)+R1(3,15,1,1,fl)+R1(3,17,1,1,fl)+R1(3,16,1,1,fc)+R1(5,16,2,1,st0); // flower / berry on a twig
  return svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="32" shape-rendering="crispEdges">${r}</svg>`);}
/* grass along the bottom of the header, like the farm's grass in the game: an even green with soft light and dark
   speckles and a few darker tufts, a gently bumpy top, and a tan dirt edge underneath. 48×16 pixels at double size */
const GRASS_COL={ // rim, tuft, dark speck, grass, light speck, dirt shadow, dirt, pebble
  spring:["#2c6e30","#276328","#347e35","#3d8c3c","#4c9e45","#94744a","#b8935a","#cba873"],
  summer:["#28662c","#235c25","#307632","#398437","#479840","#8e6e44","#b08b54","#c4a06c"],
  fall:  ["#7a4a1c","#6e3f16","#8e5a22","#a86c2a","#c08236","#8a6a42","#ad8a56","#c2a070"],
  winter:["#9fb3c4","#8ea3b6","#d2dee8","#e2ebf3","#f4f8fc","#8a7458","#a88f6c","#bba486"]};
function grassSVG(season){const [rim,tuft,dk,g,lt,dsh,dirt,peb]=GRASS_COL[season],W=48,H=16;
  const rnd=(x,y)=>{let n=(x*374761393+y*668265263)|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
  // gentle bumps on top (0 = highest) and an uneven edge where the grass meets the dirt; both repeat seamlessly
  const top=[1,1,0,0,1,2,2,1,1,0,0,0,1,1,2,2,2,1,0,0,1,1,1,2,1,1,0,0,0,1,2,2,1,1,0,1,1,2,2,1,0,0,1,1,2,2,1,1];
  const bot=[11,11,12,12,11,11,10,11,12,12,13,12,11,11,11,12,12,11,10,11,11,12,12,12,11,11,12,13,12,11,11,10,11,12,12,11,11,12,12,13,12,11,11,10,11,11,12,11];
  let r="";   // above the bumpy top stays see-through (no dirt peeking out)
  for(let x=0;x<W;x++){const t=top[x],bt=bot[x];
    r+=R1(x,t,1,1,rim);                                            // slightly darker rim along the top
    for(let y=t+1;y<bt;y++){const q=rnd(x,y);r+=R1(x,y,1,1,q<.14?dk:q<.30?lt:g);}   // soft speckles
    r+=R1(x,bt,1,1,dsh)+R1(x,bt+1,1,H-bt-1,dirt);                  // shadow where the grass meets the dirt, then dirt
  }
  [[4,14],[13,15],[22,14],[31,15],[40,14],[45,15],[9,15],[27,14]].forEach(([x,y],i)=>r+=R1(x,y,i%3?1:2,1,peb));   // pebbles
  // darker tufts with a light tip, like the clumps on the farm
  [[6,5],[19,7],[33,4],[42,8],[12,9],[27,8]].forEach(([x,y])=>r+=R1(x,y,1,2,tuft)+R1(x+2,y,1,2,tuft)+R1(x+1,y+1,1,2,tuft)+R1(x+1,y,1,1,lt));
  return svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" shape-rendering="crispEdges">${r}</svg>`);}
// background inside the side strips, per season: leaf wallpaper, sunny wallpaper, soil with fallen leaves, holly wallpaper
function stripBG(season){
  // spring, summer and winter use in-game wallpapers (stacked like the page background so the baseboards don't show)
  const W={spring:["Wallpaper 093",26],summer:["Wallpaper 115",16],winter:["Wallpaper 109",16]}[season];
  if(W)return wallBg(W[0],W[1],2);   // shown at double size (zoomed in)
  // fall: dark soil with fallen leaves (drawn here)
  let r=R1(0,0,24,24,"#5a3a22");
  [[2,3],[9,7],[15,2],[20,11],[5,15],[12,19],[18,21],[1,21],[22,4]].forEach(([x,y],i)=>r+=R1(x,y,1,1,i%2?"#4a2e1a":"#6e4a2c"));
  const leaf=(x,y,c,c2)=>r+=R1(x,y,2,1,c)+R1(x+1,y+1,2,1,c)+R1(x,y+1,1,1,c2);
  leaf(3,6,"#d0702a","#a8501c");leaf(15,13,"#b83a22","#8a2a18");leaf(8,18,"#d9a441","#b0802a");leaf(19,3,"#c95a24","#9a4019");
  return `${svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" shape-rendering="crispEdges">${r}</svg>`)} 0 0/96px 96px repeat`;}
// season the decorations show: today's season, except on the Calendar tab, where they follow the season button picked there
const decoSeason=()=>(view==="calendar"&&!query&&ui.calSeason)||st.season;
function applySeasonDeco(){const r=document.documentElement,s=decoSeason();if(r.dataset.season===s)return;r.dataset.season=s;
  r.style.setProperty("--vine",vineSVG(s));r.style.setProperty("--strip-bg",stripBG(s));r.style.setProperty("--grass",grassSVG(s));}
// tab: clicking the plaque's title opens that tab
const plaque=(title,inner,tab)=>`<div class="plaque"><h3${tab?` class="plaque-link" data-tab="${tab}" role="link" tabindex="0" title="Open ${esc(TABS.find(t=>t[0]===tab)?.[1]||tab)}"`:""}>${title}${tab?`<i class="plaque-go">›</i>`:""}</h3><div class="plaque-body">${inner}</div></div>`;
/* sidebar: rooms started but not finished, most donated items first (top 3, then a "more" link) */
function roomsInProgress(){
  const rooms=[...new Set(BUNDLES.map(b=>b.room))].map(r=>{
    const list=BUNDLES.filter(b=>b.room===r);let have=0,need=0;
    list.forEach(b=>{const n=b.need||b.items.length;need+=n;have+=Math.min(n,b.items.filter(i=>st.bundles[b.n+"|"+i]).length);});
    return {r,have,need,done:list.filter(bundleDone).length,total:list.length};
  }).filter(x=>x.have>0&&x.have<x.need).sort((a,b)=>b.have-a.have);
  if(!rooms.length)return "";
  return `<div class="rail-rooms"><div class="rail-sub">Rooms in progress</div>${rooms.slice(0,3).map(x=>`<div class="rail-room" data-gobundle="${esc(x.r)}" title="Open the ${esc(x.r)}">
    <span>${esc(x.r)}</span><small><b>${x.done}</b>/${x.total} ${x.total===1?"bundle":"bundles"}</small><span class="bar" title="${x.have} of ${x.need} items donated"><i style="width:${(x.have/x.need*100).toFixed(1)}%"></i></span></div>`).join("")}
    ${rooms.length>3?`<a href="#bundles" data-tab="bundles" class="small">+${rooms.length-3} more</a>`:""}</div>`;
}
function renderRails(){
  const L=$("railL"),R=$("railR");if(!L||!R)return;
  applySeasonDeco();
  document.documentElement.style.setProperty("--hdr",document.querySelector("header").offsetHeight+"px");
  const {season,day}=st;
  const today=eventsOn(season,day),up=[];
  for(let i=1;i<=7;i++){let d=day+i,s=SEASONS.indexOf(season);if(d>28){d-=28;s=(s+1)%4;}eventsOn(SEASONS[s],d).forEach(e=>up.push({...e,when:i===1?"tomorrow":`${cap(SEASONS[s])} ${d}`}));}
  const ev=e=>`<div class="rail-ev">${evHTML(e)}${e.when?`<span class="small muted">${e.when}</span>`:""}</div>`;
  const bp=bundleProgress();
  L.innerHTML=plaque(`${SICON[season]} ${cap(season)} ${day} · Y${st.year}`,today.length?today.map(ev).join(""):`<p class="small muted">Nothing special today.</p>`,"calendar")
    +plaque("This Week",up.length?up.slice(0,6).map(ev).join(""):`<p class="small muted">Quiet week ahead.</p>`,"calendar")
    +plaque("Community Center",`<div class="bar" title="${bp.done} of ${bp.total} items donated"><i style="width:${(bp.done/bp.total*100).toFixed(1)}%"></i></div><div class="rail-cc"><b>${bp.bundlesDone}</b> / ${BUNDLES.length} bundles</div>${roomsInProgress()}`,"bundles");
  const plant=CROPS.filter(c=>c.s.includes(season)&&c.seed!=null&&!cropLock(c,day)).map(c=>({c,...cropCalc(c,season,day)})).filter(x=>x.profit>0).sort((a,b)=>b.gpd-a.gpd).slice(0,4);
  const allFish=FISH.filter(f=>f.s.includes(season)&&!st.fish[f.n]&&unlocked(f));
  R.innerHTML=plaque("Plant today",plant.length?plant.map(x=>`<div class="rail-row" data-search="${esc(cropName(x.c))}">${img(cropName(x.c))}<span class="rail-crop">${esc(cropName(x.c))}<small title="Days to grow${x.c.re?", then days between harvests":""}">${cropDays(x.c)}d grow${x.c.waterDays&&ui.riceWater?" · near water":""}${x.c.re?` · regrows ${x.c.re}d`:""}</small></span><div class="rail-money"><b title="Profit if planted today">${g(Math.round(x.profit))}</b><small title="Gold per day">${x.gpd.toFixed(1)}g/day</small></div></div>`).join(""):`<p class="small muted">Nothing worth planting now.</p>`,"crops")
    +plaque("Biting now",allFish.length?`<div class="rail-fish">${allFish.map(f=>`<span data-search="${esc(f.n)}" title="${esc(f.n)}: ${esc(f.loc)}">${img(f.n)}</span>`).join("")}</div>`:`<p class="small muted">All caught this season!</p>`,"fish");
  coinify(R);
}
// things standing on the grass, per season (crops come from the season's crop list)
// a: the farm animal on each side of the top bar (left, right); a butterfly flutters next to each, all year
const HDECO={spring:{l:["Daffodil"],r:["Tulip","Dandelion"],a:["White Chicken","Brown Chicken"]},summer:{l:["Sunflower"],r:["Sweet Pea","Spice Berry"],a:["Turtle","Turtle"]},
  fall:{l:["Pumpkin"],r:["Common Mushroom","Hazelnut"],a:["Sheep","Sheep"]},winter:{l:["Crystal Fruit"],r:["Holly","Snow Yam"],a:["Rabbit","Rabbit"]}};
const HD_BUG="ButterflyAnimated.gif";
function renderHeaderDeco(){
  const L=$("hdecoL"),R=$("hdecoR");if(!L||!R)return;
  // the tab bar is only as wide as its tabs; the farm things fill the grass either side of it when there is room
  const r=document.documentElement,nw=document.querySelector("nav").offsetWidth,ev=(innerWidth||1)/ZOOM;
  r.style.setProperty("--navw",nw+"px");r.classList.toggle("wDeco",ev>760&&(ev-nw)/2>=120);
  const s=decoSeason(),d=HDECO[s];
  const crops=s==="winter"?["Winter Root","Snow Yam"].map(c=>img(c,"hd-crop")).join(""):CROPS.filter(c=>c.s.includes(s)).slice(0,3).map(c=>img(c.n,"hd-crop")).join("");
  const jun=i=>`<img class="junimo j${i}" src="${WIKI}Junimo.gif" alt="" onerror="this.remove()">`;
  const ani=(n,c)=>/\.gif$/.test(n)?`<img class="ico ${c} hd-gif" src="${WIKI}${n}" alt="" onerror="this.remove()">`:img(n,c);
  L.innerHTML=`${img("Wood Fence","hd-fence")}${img("Scarecrow","hd-scare")}${crops}${jun(0)}${img(d.a[0],"hd-chick")}${ani(HD_BUG,"hd-bug")}${d.l.map(n=>img(n,"hd-crop")).join("")}${img("Hay","hd-hay")}${jun(1)}${img("Wood Fence","hd-fence")}`;
  R.innerHTML=`${img("Wood Fence","hd-fence")}${jun(2)}${d.r.map(n=>img(n,"hd-crop")).join("")}${jun(3)}${img("Junimo Hut","hd-hut")}${jun(4)}${ani(HD_BUG,"hd-bug hd-flip")}${img(d.a[1],"hd-chick hd-flip")}${img("Wood Fence","hd-fence")}`;
}/* ---- Background picker: Stardew wallpapers from the wiki (Wallpaper_NNN.png) ---- */
const BGS=[["paper","Old paper",null],["w001","Honey Wood","Wallpaper 001"],["w105","Dark Wood","Wallpaper 105"],["w019","Brick","Wallpaper 019"],
  ["w066","Peach Brick","Wallpaper 066",8],["w067","Pastel Brick","Wallpaper 067",8],["w063","Green Panels","Wallpaper 063"],["w064","Golden Panels","Wallpaper 064"],
  ["w065","Blue Panels","Wallpaper 065"],["w052","Orange Pattern","Wallpaper 052"],["w054","Red Pattern","Wallpaper 054"],["w053","Lemon Stripes","Wallpaper 053"],
  ["w110","Sunset Bands","Wallpaper 110"],["w109","Holly","Wallpaper 109"],["w086","Green Diagonal","Wallpaper 086"],["w009","Green Check","Wallpaper 009"],
  ["w033","Mint Leaves","Wallpaper 033"],["w097","Fruit Pattern","Wallpaper 097"],["w092","Lilac","Wallpaper 092",18],["w098","Candy Stripes","Wallpaper 098"],
  ["w104","Rose Plaster","Wallpaper 104",20],["w017","Blue Dots","Wallpaper 017"],["w011","Pink Hearts","Wallpaper 011"],["w004","Night Sky","Wallpaper 004"]];
/* each wallpaper image is a wall section with a baseboard at the bottom (usually 16px, the 4th value when different);
   stack rows so each row hides the baseboard of the one above (lower rows are listed first, so they paint on top) */
const wallBg=(f,trim=16,z=1)=>{if(!f)return "none";const u=tileURL(f),S=96*z,step=(96-trim)*z,L=[];for(let k=Math.ceil(2200/step);k>=0;k--)L.push(`${u} 0 ${k*step}px/${S}px ${S}px repeat-x`);return L.join(",");};
const tileURL=f=>f?`url('${WIKI}${encodeURIComponent(f.replace(/ /g,"_"))}.png')`:"none";
function applyBg(){const b=BGS.find(x=>x[0]===st.bg)||BGS[0],r=document.documentElement;r.dataset.bg=b[0];r.style.setProperty("--tile",tileURL(b[2]));r.style.setProperty("--wall",wallBg(b[2],b[3],2));   /* page wallpaper at double size */r.style.setProperty("--tileicon",tileURL(b[2]&&b[2]+" Icon"));
  $("bgBtn").title="Customize (background: "+b[1]+", "+(curTheme()==="dark"?"night":"day")+")";}
function bgMenu(){const cur=st.bg||"paper",th=curTheme();return `<div class="cz-head">Day / night</div><div class="seg cz-theme" role="group" aria-label="Day or night">${[["light","Day"],["dark","Night"]].map(([k,l])=>`<button type="button" class="${th===k?"on":""}" data-themeopt="${k}" aria-pressed="${th===k}"><span class="daynight dn-${k}"></span>${l}</button>`).join("")}</div><div class="cz-head">Background</div><div class="bg-list">${BGS.map(([k,l,f])=>`<button type="button" role="menuitemradio" aria-checked="${k===cur}" class="bg-opt ${k===cur?"on":""}" data-bgopt="${k}">
  ${f?`<span class="bg-sw bg-ico" style="background-image:${tileURL(f+" Icon")}"></span>`:`<span class="bg-sw paper"></span>`}<span>${esc(l)}</span></button>`).join("")}</div>`;}
function toggleBgPop(open){const p=$("bgPop");const was=p.classList.contains("open");if(open===false&&!was)return;open=open??!was;if(open)p.innerHTML=bgMenu();p.classList.toggle("open",open);$("bgBtn").setAttribute("aria-expanded",open);}
function applyTheme(){if(st.theme)document.documentElement.dataset.theme=st.theme;}
/* Weather from the connected farm (sent by the mod each night; it stays the same all day in the game) */
const WEATHER={Sun:["StatusSun","Sunny"],Rain:["StatusRain","Rain"],Storm:["StatusStorm","Storm"],Snow:["StatusSnow","Snow"],
  Wind:[null,"Windy"],GreenRain:["StatusGreenRain","Green rain"],Festival:["StatusFestival","Festival"],Wedding:["StatusWedding","Wedding"]};
const wxIcon=(id,season)=>{const w=WEATHER[id]||WEATHER.Sun;return w[0]||(season==="fall"?"StatusWindFall":"StatusWindSpring");};
const wxName=id=>(WEATHER[id]||[0,id||"?"])[1];
// today's weather, only while the dashboard shows the same day as the uploaded farm
function liveWeather(){const s=typeof live!=="undefined"&&live.snap;if(!s||!s.weather||!st.farmCode)return null;
  const d=s.date;return d.season===st.season&&d.day===st.day&&d.year===st.year?s.weather:null;}
function syncWeather(){const b=$("wxBox"),t=$("wxNext"),w=liveWeather();if(!b)return;b.hidden=!w;if(t)t.hidden=!w;if(!w)return;
  const nxt=SEASONS[(SEASONS.indexOf(st.season)+(st.day===28?1:0))%4], nd=st.day===28?1:st.day+1;
  // a festival day shows that festival's own icon instead of the weather
  const fOn=(s,d)=>FESTIVALS.find(x=>x.s===s&&x.days.includes(d)&&unlocked(x));
  const fT=fOn(st.season,st.day), fN=fOn(nxt,nd);
  const ico=(f,id,s)=>f?(FEST_ICON[f.n]||"StatusFestival"):wxIcon(id,s), nm=(f,id)=>f?f.n:wxName(id);
  b.innerHTML=img(ico(fT,w.today,st.season),"wx-i");
  b.title=`Today: ${nm(fT,w.today)} · Tomorrow${fN?"":" (TV forecast)"}: ${nm(fN,w.tomorrow)}`;
  b.innerHTML+=`<span class="wx-next">${img(ico(fN,w.tomorrow,nxt),"wx-i")}</span>`;
  // phones show tomorrow in its own box at the end of the date row
  if(t){t.innerHTML=img(wxIcon(w.tomorrow,nxt),"wx-i");t.title=`Tomorrow (TV forecast): ${wxName(w.tomorrow)}`;}}
function syncHeader(){syncWeather();$("dateBtn").innerHTML=`${SICON[st.season]}<span>${cap(st.season)} ${st.day}</span><i>▾</i>`;$("dateBtn").title="Today in your game: "+cap(st.season)+" "+st.day+". Click to change";
  $("yearBox").innerHTML=`<span title="Year in your game">Year ${st.year}</span><div class="yr-btns"><button type="button" data-yr="1" ${dateMax()&&st.year>=dateMax().year?"disabled":""} title="Next year" aria-label="Next year">+</button><button type="button" data-yr="-1" ${st.year<=1?"disabled":""} title="Previous year" aria-label="Previous year">−</button></div>`;if($("datePop").classList.contains("open"))$("datePop").innerHTML=miniCal();applyTheme();applyBg();}

/* ---- Date picker: a small in-game style calendar (header pop-up + Home page) ---- */
/* view: true = the Home page's read-only copy (this season only, days can't be clicked) */
// With a farm connected you can look back at earlier days, but not ahead of the game's own date
const dateNum=(y,s,d)=>(y-1)*112+SEASONS.indexOf(s)*28+d;
const dateMax=()=>(typeof live!=="undefined"&&st.farmCode&&live.snap)?live.snap.date:null;
const isFuture=(s,d,y=st.year)=>{const m=dateMax();return !!m&&dateNum(y,s,d)>dateNum(m.year,m.season,m.day);};
function miniCal(view){
  const s=view?st.season:ui.pickSeason||st.season;
  let cells="";
  for(let d=1;d<=28;d++){
    const b=VILLAGERS.find(v=>v.s===s&&v.d===d&&unlocked(v)), f=FESTIVALS.find(x=>x.s===s&&x.days.includes(d)&&unlocked(x));
    const tip=[b?b.n+"'s birthday":"",f?f.n:""].filter(Boolean).join(" · ");
    const inner=`<b>${d}</b>${b?img(b.n,"mc"):""}${f?`<i class="mc-flag">${IC.fest(f.n)}</i>`:""}`, cls=`mc-day ${s===st.season&&d===st.day?"on":""} ${f?"fest":""}`, title=`${cap(s)} ${d}${tip?" · "+esc(tip):""}`;
    cells+=view?`<div class="${cls}" title="${title}">${inner}</div>`:isFuture(s,d)?`<button type="button" class="${cls} future" disabled title="${title} · after your game's date">${inner}</button>`:`<button type="button" class="${cls}" data-pick="${s}|${d}" title="${title}">${inner}</button>`;
  }
  if(view)return `<div class="mini-cal ro"><div class="mc-title">${SICON[s]} ${cap(s)}, Year ${st.year}</div>
    <div class="mc-grid">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(w=>`<span class="mc-dow">${w}</span>`).join("")}${cells}</div></div>`;
  return `<div class="mini-cal">    <div class="mc-seasons">${SEASONS.map(x=>`<button type="button" class="${x===s?"on":""}" data-pcs="${x}" title="${cap(x)}">${SICON[x]}<span>${cap(x)}</span></button>`).join("")}</div>
    <div class="mc-grid">${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(w=>`<span class="mc-dow">${w}</span>`).join("")}${cells}</div>
    <p class="mc-hint">Click a day to set today's date</p>
  </div>`;
}
function setDate(s,d){st.season=s;st.day=d;ui.pickSeason=null;ui.calSeason=null;ui.cSeason=null;ui.fSeason=null;ui.plantDay=d;save();syncHeader();render();}
function toggleDatePop(open){const p=$("datePop");const was=p.classList.contains("open");if(open===false&&!was)return;open=open??!was;ui.pickSeason=null;if(open)p.innerHTML=miniCal();p.classList.toggle("open",open);$("dateBtn").setAttribute("aria-expanded",open);}
// Back / Forward (Alt+arrows, mouse buttons, or typing an address): show that page
window.addEventListener("popstate",e=>{navDepth=(e.state&&e.state.d)||0;closeModal();toggleDatePop(false);if(readHash()){render();scrollTo(0,0);}});

/* ---- Screen-size scaling ----
   text is never shrunk (that made it hard to read); on very wide screens (over 2560 page pixels, e.g. 4K at 100%)
   the whole page is enlarged so it doesn't look tiny, up to 150%. Everything smaller uses the normal flexible layout.
   --vw/--vh are the screen size in page pixels, and the w1440/wRail (side strips, from 1280)/w1900 classes replace width media queries,
   because the browser's own vw units and media queries don't know about the scaling */
let ZOOM=1;
function fitScreen(){const w=innerWidth||1,r=document.documentElement;
  ZOOM=Math.min(1.5,Math.max(1,w/2560));
  r.style.zoom=ZOOM===1?"":String(ZOOM);
  const ev=w/ZOOM;r.style.setProperty("--vw",ev+"px");r.style.setProperty("--vh",innerHeight/ZOOM+"px");
  r.classList.toggle("w1440",ev>=1440);r.classList.toggle("wRail",ev>=1400);r.classList.toggle("w1900",ev>=1900);}
fitScreen();
let fitT;addEventListener("resize",()=>{clearTimeout(fitT);fitT=setTimeout(()=>{fitScreen();renderRails();renderHeaderDeco();},100);});

readHash();
try{history.replaceState({d:0},"",location.hash||"#"+view);}catch(e){}
ui.plantDay=st.day;
syncHeader();render();
