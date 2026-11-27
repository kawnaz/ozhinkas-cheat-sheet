/* Stardew Dash - farm animals, machines and artisan goods (Stardew Valley 1.6).
   Facts gathered from the Stardew Valley Wiki "Animals" and "Artisan Goods" pages.
   Prices are base (normal quality) sell prices. */

// every: days between products. prod: [item, price, best machine use, machine product price]
const ANIMALS=[
 {n:"Chicken",home:"Coop",cost:800,every:1,prod:[["Egg",50,"Mayonnaise",190],["Large Egg",95,"Mayonnaise (gold quality)",285],["Brown Egg",50,"Mayonnaise",190],["Large Brown Egg",95,"Mayonnaise (gold quality)",285]],
  note:"Comes white or brown at random. After Shane's 8-heart event, Marnie can sell you blue chickens."},
 {n:"Duck",home:"Big Coop",cost:1200,every:2,prod:[["Duck Egg",95,"Duck Mayonnaise",375],["Duck Feather",250]],
  note:"Lays an egg or drops a feather every other day. Feathers are more likely when the duck is happy."},
 {n:"Rabbit",home:"Deluxe Coop",cost:8000,every:4,prod:[["Wool",340,"Cloth",470],["Rabbit's Foot",565]],
  note:"Rabbit's Foot is a universal love, so rabbits are great for friendship gifts."},
 {n:"Void Chicken",home:"Big Coop",cost:null,every:1,prod:[["Void Egg",65,"Void Mayonnaise",275]],
  note:"Hatch a Void Egg (sold by Krobus in the Sewers) in an Incubator."},
 {n:"Golden Chicken",home:"Big Coop",cost:null,every:1,prod:[["Golden Egg",500]],
  note:"Hatch a Golden Egg. Unlocked after a perfect Grandpa's evaluation, then sold by Marnie."},
 {n:"Dinosaur",home:"Big Coop",cost:null,every:7,prod:[["Dinosaur Egg",350,"Dinosaur Mayonnaise",800]],
  note:"Hatch a Dinosaur Egg (found as an artifact) in an Incubator."},
 {n:"Cow",home:"Barn",cost:1500,every:1,prod:[["Milk",125,"Cheese",230],["Large Milk",190,"Cheese (gold quality)",345]],
  note:"Needs a Milk Pail (Marnie's Ranch) to collect milk."},
 {n:"Goat",home:"Big Barn",cost:4000,every:2,prod:[["Goat Milk",225,"Goat Cheese",400],["Large Goat Milk",345,"Goat Cheese (gold quality)",600]],
  note:"Usually gives milk every other day. Needs a Milk Pail."},
 {n:"Sheep",home:"Deluxe Barn",cost:8000,every:3,prod:[["Wool",340,"Cloth",470]],
  note:"Needs Shears. Regrows wool faster at high friendship, and every day with the Shepherd profession."},
 {n:"Pig",home:"Deluxe Barn",cost:16000,every:1,prod:[["Truffle",625,"Truffle Oil",1065]],
  note:"Digs up Truffles when let outside. No truffles in winter or on rainy days."},
 {n:"Ostrich",home:"Barn",cost:null,every:7,prod:[["Ostrich Egg",600]],
  note:"Hatch an Ostrich Egg (from Ginger Island) in an Ostrich Incubator."},
];

// Machines: how to get them, what they cost to craft, and what they make
const MACHINES=[
 {n:"Mayonnaise Machine",get:"Farming level 2",mats:"Wood ×15, Stone ×15, Earth Crystal, Copper Bar",goods:[
  ["Mayonnaise","Egg / Large Egg","3 hours","190g (more for higher quality eggs)"],
  ["Duck Mayonnaise","Duck Egg","3 hours","375g"],
  ["Void Mayonnaise","Void Egg","3 hours","275g"],
  ["Dinosaur Mayonnaise","Dinosaur Egg","3 hours","800g"]]},
 {n:"Bee House",get:"Farming level 3",mats:"Wood ×40, Coal ×8, Iron Bar, Maple Syrup",goods:[
  ["Honey","Nothing (place outside)","4 nights","100g wild. Flower honey from a flower within 5 tiles: Tulip 160g, Blue Jazz 200g, Sunflower 260g, Summer Spangle 280g, Poppy 380g, Fairy Rose 680g"]],
  note:"Doesn't work in winter."},
 {n:"Preserves Jar",get:"Farming level 4",mats:"Wood ×50, Stone ×40, Coal ×8",goods:[
  ["Jelly","Any fruit","2-3 days","2 × fruit price + 50"],
  ["Pickles","Any vegetable, mushroom or forage","2-3 days","2 × item price + 50"],
  ["Caviar","Sturgeon Roe","4 days","500g"],
  ["Aged Roe","Any other Roe","2-3 days","2 × roe price"]]},
 {n:"Cheese Press",get:"Farming level 6",mats:"Wood ×45, Stone ×45, Hardwood ×10, Copper Bar",goods:[
  ["Cheese","Milk / Large Milk","~3 hours","230g (345g from Large Milk)"],
  ["Goat Cheese","Goat Milk / Large Goat Milk","~3 hours","400g (600g from Large Goat Milk)"]]},
 {n:"Loom",get:"Farming level 7",mats:"Wood ×60, Fiber ×30, Pine Tar",goods:[
  ["Cloth","Wool","4 hours","470g"]]},
 {n:"Keg",get:"Farming level 8",mats:"Wood ×30, Copper Bar, Iron Bar, Oak Resin",goods:[
  ["Wine","Any fruit","~6¼ days","3 × fruit price"],
  ["Juice","Any vegetable","4 days","2.25 × vegetable price"],
  ["Beer","Wheat","~1 day","200g"],
  ["Pale Ale","Hops","~1½ days","300g"],
  ["Mead","Honey","10 hours","300g"],
  ["Coffee","Coffee Bean ×5","2 hours","150g"],
  ["Green Tea","Tea Leaves","3 hours","100g"],
  ["Vinegar","Rice","10 hours","100g"]],
  note:"Best money-maker for expensive fruit: Starfruit, Ancient Fruit and Pineapple wine are worth a lot."},
 {n:"Oil Maker",get:"Farming level 8",mats:"Slime ×50, Hardwood ×20, Gold Bar",goods:[
  ["Truffle Oil","Truffle","6 hours","1,065g"],
  ["Oil","Corn / Sunflower / Sunflower Seeds","1 hour to 2 days","100g"]]},
 {n:"Cask",get:"Farmhouse cellar upgrade",mats:"Wood ×20, Hardwood",goods:[
  ["Wine","Wine","up to 56 days","Iridium quality = 2 × value"],
  ["Cheese","Cheese","up to 14 days","460g at iridium"],
  ["Goat Cheese","Goat Cheese","up to 14 days","800g at iridium"],
  ["Pale Ale","Pale Ale","up to 34 days","600g at iridium"],
  ["Beer","Beer","up to 28 days","400g at iridium"],
  ["Mead","Mead","up to 28 days","600g at iridium"]],
  note:"Only works in your cellar. Each quality step (silver, gold, iridium) raises the price, and iridium doubles it."},
 {n:"Dehydrator",get:"Pierre's, 10,000g",mats:"Wood ×30, Clay ×2, Fire Quartz",goods:[
  ["Dried Fruit","5 of any fruit (not Grapes)","Overnight","7.5 × fruit price + 25"],
  ["Dried Mushrooms","5 of any mushroom (not Red)","Overnight","7.5 × mushroom price + 25"],
  ["Raisins","5 Grapes","Overnight","600g"]]},
 {n:"Fish Smoker",get:"Fish Shop, 10,000g",mats:"Hardwood ×10, Sea Jelly, River Jelly, Cave Jelly",goods:[
  ["Smoked Fish","Any fish + Coal","50 minutes","2 × fish price (keeps the fish's quality)"]]},
];
