//const log2 = document.querySelector('#log2')

//const log3 = document.querySelectorAll('.log3')
//const log4 = document.getElementsByClassName('log4')
//document.querySelector('p')

const log = document.getElementById("log");
const moveBtn = document.getElementById("moveBtn");
const attackBtn = document.getElementById("attackBtn");
const inventoryBtn = document.getElementById("inventoryBtn");
const healBtn = document.getElementById("healBtn");
const lootBtn = document.getElementById("lootBtn");
const equipBtn = document.getElementById("equipBtn");
const unequipBtn = document.getElementById("unequipBtn");
const restartBtn = document.getElementById("restartBtn");
const playerStats = document.getElementById("playerStats");
const enemyStats = document.getElementById("enemyStats");

// Hide loot, equip, unequip, and restart buttons initially
lootBtn.style.display = "none";
equipBtn.style.display = "none";
unequipBtn.style.display = "none";
restartBtn.style.display = "none";

let isGameOver = false;

function createMessage(text) {
  const message = document.createElement("p");
  message.textContent = text;
  log.append(message);
  log.scrollTop = log.scrollHeight;
}

// class/constructor
class Item {
  constructor(name, description, effectProperty, effectValue) {
    this.name = name;
    this.description = description;
    this.effectProperty = effectProperty;
    this.effectValue = effectValue;
  }
}
class Character {
  constructor(name, hp, attackPwr, speed, inventory) {
    this.name = name;
    this.hp = hp;
    this.maxHp = hp;
    this.baseAttackPwr = attackPwr;
    this.baseSpeed = speed;
    this.inventory = {}; // { itemName: { item: Item, quantity: number }, ... }
    this.equipped = {}; // { attackPwr: [item], speed: [item], etc }
    
    // Convert input array to stacked format
    if (Array.isArray(inventory)) {
      for (let item of inventory) {
        this.addItem(item, 1);
      }
    }
  }
  
  addItem(item, quantity = 1) {
    if (!this.inventory[item.name]) {
      this.inventory[item.name] = { item, quantity: 0 };
    }
    this.inventory[item.name].quantity += quantity;
  }
  
  removeItem(itemName, quantity = 1) {
    if (!this.inventory[itemName]) return false;
    this.inventory[itemName].quantity -= quantity;
    if (this.inventory[itemName].quantity <= 0) {
      delete this.inventory[itemName];
    }
    return true;
  }
  
  getItemQuantity(itemName) {
    return this.inventory[itemName] ? this.inventory[itemName].quantity : 0;
  }
  
  getItem(itemName) {
    return this.inventory[itemName] ? this.inventory[itemName].item : null;
  }
  
  getAttackPwr() {
    let total = this.baseAttackPwr;
    if (this.equipped.attackPwr) {
      this.equipped.attackPwr.forEach(item => total += item.effectValue);
    }
    return total;
  }
  
  getSpeed() {
    let total = this.baseSpeed;
    if (this.equipped.speed) {
      this.equipped.speed.forEach(item => total += item.effectValue);
    }
    return total;
  }
  
  equip(item) {
    if (!this.equipped[item.effectProperty]) {
      this.equipped[item.effectProperty] = [];
    }
    this.equipped[item.effectProperty].push(item);
  }
  
  unequip(item) {
    if (this.equipped[item.effectProperty]) {
      const index = this.equipped[item.effectProperty].indexOf(item);
      if (index > -1) {
        this.equipped[item.effectProperty].splice(index, 1);
      }
    }
  }
  attack(combatant) {
    const critHit = Math.random();
    let damage = this.getAttackPwr();
    const atkChance = Math.random();
    if (atkChance < 0.2) {
      createMessage(`${this.name} missed the attack!`);
      return;
    }
    if (critHit > 0.94) {
      damage = Math.round(damage * 1.5);
      createMessage("Critical Hit!");
    }
    combatant.hp = combatant.hp - damage;
    createMessage(
      `${this.name} attacked ${combatant.name} for ${damage} damage!`,
    );
  }
}

const sword = new Item("Sword", "A sharp blade", "attackPwr", 5);
const dagger = new Item("Dagger", "A small blade", "attackPwr", 3);
const axe = new Item("Axe", "A heavy blade", "attackPwr", 7);
const club = new Item("Club", "A blunt weapon", "attackPwr", 4);
const dragonClaw = new Item("Dragon Claw", "A sharp claw", "speed", 15);
const potion = new Item("Potion", "Heals 15 HP", "hp", 15);
//const boots = new Item('Boots', 'Increases speed', 'speed', 5)

const player = new Character("John", 100, 15, 15, [sword, potion]);

const kobold = new Character("Kobold", 10, 5, 10, [dagger]);
const goblin = new Character("Goblin", 20, 10, 10, [club]);
const orc = new Character("Orc", 30, 15, 20, [axe]);
const dragon = new Character("Dragon", 100, 20, 50, [dragonClaw]);

const enemies = [kobold, goblin, orc, dragon];
let enemy = null;
let defeatedEnemy = null;

let inEncounter = false;

function updateplayerStats() {
  const playerHealth = document.getElementById("playerStats");
  const totalItems = Object.keys(player.inventory).length;
  const potionCount = player.getItemQuantity("Potion");
  const equippedItems = Object.values(player.equipped).flat().map(item => item.name).join(", ") || "None";
  playerHealth.textContent = `HP: ${player.hp}/${player.maxHp} | Attack Power: ${player.getAttackPwr()} | Speed: ${player.getSpeed()} | Equipped: ${equippedItems} | Items: ${totalItems} | Potions: ${potionCount}`;
}

function updateEnemyStats() {
  const enemyStats = document.getElementById("enemyStats");
  if (enemy) {
    enemyStats.textContent = `HP: ${enemy.hp} | Attack Power: ${enemy.getAttackPwr()} | Speed: ${enemy.getSpeed()}`;
  }
}

function updateLootButtonVisibility() {
  if (defeatedEnemy) {
    lootBtn.style.display = "inline-block";
  } else {
    lootBtn.style.display = "none";
  }
}

function handleMove() {
  if (inEncounter) {
    createMessage(`${enemy.name} blocks your path!`);
    return;
  } else if (defeatedEnemy) {
    createMessage(
      `Maybe the ${defeatedEnemy.name} might have something to loot. You should search it before moving on.`,
    );
    return;
  }
  
  const randomChance = Math.random(); //0=.9999

  if (randomChance > 0.5) {
    createMessage("Something stirs in the bushes!");
    const randomIndex = Math.floor(Math.random() * enemies.length);
    enemy = enemies[randomIndex];
    handleEncounter(enemy);
    updateEnemyStats();
  } else {
    createMessage("You continue through the forest.");
  }
  defeatedEnemy = null;
  updateLootButtonVisibility();
}

//append puts at the end
//prepend puts at the start

function handleEncounter(enemy) {
  // Reset enemy HP to their original value based on type
  const originalHPs = {
    "Kobold": 10,
    "Goblin": 20,
    "Orc": 30,
    "Dragon": 100
  };
  enemy.hp = originalHPs[enemy.name];
  
  createMessage(`${enemy.name} comes at you!`);
  inEncounter = true;
}

function handleAttack(enemy) {
  if (inEncounter === false) {
    createMessage("There is nothing to attack!");

    return;
  }

  let attacksFirst = null;

  if (enemy.getSpeed() > player.getSpeed()) {
    attacksFirst = enemy.name;
  } else if (enemy.getSpeed() < player.getSpeed()) {
    attacksFirst = player.name;
  } else {
    const randomChance = Math.random();
    if (randomChance > 0.5) {
      attacksFirst = enemy.name;
    } else {
      attacksFirst = player.name;
    }
  }
    
  if (attacksFirst === player.name) {
    player.attack(enemy);
    updateEnemyStats();
    if (enemy.hp <= 0) {
      inEncounter = false;
      createMessage(`${enemy.name} has been defeated!`);
      createMessage("You can now loot the defeated enemy!");
      defeatedEnemy = enemy;
      enemy = null;
      updateLootButtonVisibility();
      return;
    } else {
      enemy.attack(player);
      updateplayerStats();
      updateEnemyStats();
    }
  } else {
    enemy.attack(player);
    updateplayerStats();
    if (player.hp <= 0) {
      inEncounter = false;
      createMessage(`${player.name} has been defeated!`);
      handleGameOver();
      enemy = null;
      return;
    } else {
      player.attack(enemy);
      updateplayerStats();
      updateEnemyStats();
      if (enemy.hp <= 0) {
        inEncounter = false;
        createMessage(`${enemy.name} has been defeated!`);
        createMessage("You can now loot the defeated enemy!");
        defeatedEnemy = enemy;
        enemy = null;
        updateLootButtonVisibility();
      }
    }
  }
}

function handleInventory() {
  let msg = `You have ${Object.keys(player.inventory).length} item type(s):`;
  createMessage(msg);
  let index = 1;
  for (let itemName in player.inventory) {
    const data = player.inventory[itemName];
    const item = data.item;
    const isEquipped = Object.values(player.equipped).flat().includes(item);
    const status = isEquipped ? " [EQUIPPED]" : "";
    const qty = data.quantity > 1 ? ` x${data.quantity}` : "";
    createMessage(`${index}. ${item.name}${qty} - ${item.description}${status}`);
    index++;
  }
  // Show equip/unequip buttons when viewing inventory
  equipBtn.style.display = "inline-block";
  unequipBtn.style.display = "inline-block";
}
function handleHeal() {
  // Check if player has potions
  if (player.getItemQuantity("Potion") === 0) {
    createMessage("You have no potions left");
    return;
  }
  
  if (player.hp === player.maxHp) {
    createMessage("Already at full health");
    return;
  }

  const potion = player.getItem("Potion");
  player.hp = Number(player.hp) + potion.effectValue;

  // Clamp HP to max
  if (player.hp > player.maxHp) {
    player.hp = player.maxHp;
  }

  player.removeItem("Potion", 1);
  updateplayerStats();

  createMessage("Player has been healed");
  console.log(`Player HP after healing: ${player.hp}`);
}

function handleLoot() {
  if (!defeatedEnemy) {
    createMessage("There is nothing to loot!");
    return;
  }

  const lootedItems = [];
  
  // Transfer all items from defeated enemy to player (stacked)
  for (let itemName in defeatedEnemy.inventory) {
    const data = defeatedEnemy.inventory[itemName];
    const item = data.item;
    const quantity = data.quantity;
    
    player.addItem(item, quantity);
    lootedItems.push(`${item.name} x${quantity}`);
    
    // Auto-equip weapons (not potions)
    if (item.name !== "Potion" && !Object.values(player.equipped).flat().includes(item)) {
      player.equip(item);
    }
  }

  if (lootedItems.length === 0) {
    createMessage(`${defeatedEnemy.name} had nothing to loot.`);
  } else {
    createMessage(`You looted: ${lootedItems.join(", ")}!`);
  }
  
  updateplayerStats();
  defeatedEnemy = null;
  updateLootButtonVisibility();
}

function startGame() {
  createMessage(
    "Welcome Adventurer! You are about to embark on a journey through the forest. Beware of the creatures that lurk in the shadows!",
  );
  updateplayerStats();
}

// Equipment button functions
function handleEquip() {
  const inventorySize = Object.keys(player.inventory).length;
  if (inventorySize === 0) {
    createMessage("You have no items to equip!");
    equipBtn.style.display = "none";
    unequipBtn.style.display = "none";
    return;
  }
  
  const indexInput = prompt(`Enter item number to equip (1-${inventorySize})`);
  if (indexInput === null) {
    equipBtn.style.display = "none";
    unequipBtn.style.display = "none";
    return;
  }
  
  const index = parseInt(indexInput);
  let itemName = null;
  let count = 1;
  
  for (let name in player.inventory) {
    if (count === index) {
      itemName = name;
      break;
    }
    count++;
  }
  
  if (!itemName) {
    createMessage("Item not found!");
    equipBtn.style.display = "none";
    unequipBtn.style.display = "none";
    return;
  }
  
  if (itemName === "Potion") {
    createMessage("You can't equip potions!");
    equipBtn.style.display = "none";
    unequipBtn.style.display = "none";
    return;
  }
  
  const item = player.getItem(itemName);
  player.equip(item);
  createMessage(`${item.name} equipped! +${item.effectValue} ${item.effectProperty}`);
  updateplayerStats();
  equipBtn.style.display = "none";
  unequipBtn.style.display = "none";
}

function handleUnequip() {
  const equippedList = Object.values(player.equipped).flat();
  if (equippedList.length === 0) {
    createMessage("You have nothing equipped!");
    equipBtn.style.display = "none";
    unequipBtn.style.display = "none";
    return;
  }
  
  const inventorySize = Object.keys(player.inventory).length;
  const indexInput = prompt(`Enter item number to unequip (1-${inventorySize})`);
  if (indexInput === null) {
    equipBtn.style.display = "none";
    unequipBtn.style.display = "none";
    return;
  }
  
  const index = parseInt(indexInput);
  let itemName = null;
  let count = 1;
  
  for (let name in player.inventory) {
    if (count === index) {
      itemName = name;
      break;
    }
    count++;
  }
  
  if (!itemName) {
    createMessage("Item not found!");
    equipBtn.style.display = "none";
    unequipBtn.style.display = "none";
    return;
  }
  
  const item = player.getItem(itemName);
  player.unequip(item);
  createMessage(`${item.name} unequipped!`);
  updateplayerStats();
  equipBtn.style.display = "none";
  unequipBtn.style.display = "none";
}

function handleGameOver() {
  isGameOver = true;
  
  // Disable main game buttons
  moveBtn.disabled = true;
  attackBtn.disabled = true;
  healBtn.disabled = true;
  inventoryBtn.disabled = true;
  equipBtn.disabled = true;
  unequipBtn.disabled = true;
  lootBtn.disabled = true;
  
  // Show restart button
  restartBtn.style.display = "inline-block";
  
  createMessage("=== GAME OVER ===");
  createMessage("You have fallen in battle. Click Restart Game to try again.");
}

function handleRestart() {
  // Clear game state
  isGameOver = false;
  inEncounter = false;
  enemy = null;
  defeatedEnemy = null;
  
  // Reset player
  player.hp = player.maxHp;
  player.inventory = {};
  player.equipped = {};
  player.addItem(sword, 1);
  player.addItem(potion, 2);
  
  // Reset enemies
  kobold.hp = 10;
  goblin.hp = 20;
  orc.hp = 30;
  dragon.hp = 100;
  
  // Clear log
  log.innerHTML = "";
  
  // Hide enemy stats
  enemyStats.textContent = "";
  
  // Re-enable main game buttons
  moveBtn.disabled = false;
  attackBtn.disabled = false;
  healBtn.disabled = false;
  inventoryBtn.disabled = false;
  equipBtn.disabled = false;
  unequipBtn.disabled = false;
  lootBtn.disabled = false;
  
  // Hide restart button and extra buttons
  restartBtn.style.display = "none";
  lootBtn.style.display = "none";
  equipBtn.style.display = "none";
  unequipBtn.style.display = "none";
  
  // Start new game
  startGame();
}

startGame(); 

moveBtn.addEventListener("click", handleMove);
restartBtn.addEventListener("click", handleRestart);
attackBtn.addEventListener("click", () => handleAttack(enemy));
healBtn.addEventListener("click", handleHeal);
inventoryBtn.addEventListener("click", handleInventory);
equipBtn.addEventListener("click", handleEquip);
unequipBtn.addEventListener("click", handleUnequip);
lootBtn.addEventListener("click", handleLoot);
