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
const introForm = document.introForm

// Button - click event - HAS to click
// submit - forms - user can click button or hit enter

const actionButtons = [moveBtn, attackBtn, healBtn, inventoryBtn, lootBtn, equipBtn, unequipBtn];

function setActionButtonsEnabled(enabled) {
  actionButtons.forEach((button) => {
    button.disabled = !enabled;
  });
}

introForm.addEventListener("submit", function(event){
  event.preventDefault();

  const enteredName = introForm.Username.value.trim();
  if (!enteredName) {
    createMessage("Please enter your name before starting.");
    return;
  }

  player.name = enteredName;
  introForm.style.display = "none"; // Hide the form after submission
  introForm.reset();
  setActionButtonsEnabled(true);
  updateplayerStats();
  startGame();
})

// Hide loot, equip, unequip, and restart buttons initially
lootBtn.style.display = "none";
equipBtn.style.display = "none";
unequipBtn.style.display = "none";
restartBtn.style.display = "none";
setActionButtonsEnabled(false);

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
  constructor(name, hp, attackPwr, speed, inventory, level = 1, isPlayer = false) {
    this.name = name;
    this.level = level;
    this.isPlayer = isPlayer;
    this._baseHp = hp; // store base values for scaling
    this._baseAttackInput = attackPwr;
    // Only the player scales with level; enemies keep their base stats
    if (this.isPlayer) {
      this.maxHp = this._baseHp * this.level;
      this.baseAttackPwr = this._baseAttackInput * this.level;
    } else {
      this.maxHp = this._baseHp;
      this.baseAttackPwr = this._baseAttackInput;
    }
    this.hp = this.maxHp;
    this.baseSpeed = speed;
    this.xp = 0;
    this.xpToNext = this.calculateXpToNext();
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

  calculateXpToNext() {
    // slower XP curve: require more XP per level
    return 250 * this.level;
  }

  recalcStatsForLevel() {
    if (!this.isPlayer) return;
    this.maxHp = this._baseHp * this.level;
    // keep hp proportional to new max
    const hpRatio = this.hp / Math.max(1, this.maxHp);
    // gentler attack growth: add a small flat increase per level
    this.baseAttackPwr = this._baseAttackInput + Math.floor((this.level - 1) * 1);
    this.xpToNext = this.calculateXpToNext();
    this.hp = Math.round(this.maxHp * hpRatio);
    if (this.hp > this.maxHp) this.hp = this.maxHp;
  }

  gainXp(amount) {
    if (!this.isPlayer) return false;
    if (this.level >= 10) return false; // already at cap
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpToNext && this.level < 10) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.recalcStatsForLevel();
      leveled = true;
    }
    if (this.level >= 10) {
      this.xp = 0;
      this.xpToNext = 0;
    }
    return leveled;
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

const player = new Character("Adventurer", 100, 15, 15, [sword, potion, potion], 1, true);

// Assign levels to enemies so stronger foes appear later
const kobold = new Character("Kobold", 10, 5, 10, [dagger, potion], 1);
kobold.minLevel = 1; kobold.maxLevel = 2; kobold.evolveAfter = false;
const goblin = new Character("Goblin", 20, 10, 10, [club, potion], 2);
goblin.minLevel = 2; goblin.maxLevel = 4; goblin.evolveAfter = true;
const orc = new Character("Orc", 30, 15, 20, [axe, potion], 3);
orc.minLevel = 3; orc.maxLevel = 6; orc.evolveAfter = true;
const dragon = new Character("Dragon", 100, 20, 50, [dragonClaw, potion, potion, potion], 6);
dragon.minLevel = 6; dragon.maxLevel = 10; dragon.evolveAfter = false;

const enemies = [kobold, goblin, orc, dragon];
let enemy = null;
let defeatedEnemy = null;

let inEncounter = false;

function updateplayerStats() {
  const playerHealth = document.getElementById("playerStats");
  const totalItems = Object.keys(player.inventory).length;
  const potionCount = player.getItemQuantity("Potion");
  const equippedItems = Object.values(player.equipped).flat().map(item => item.name).join(", ") || "None";
  const xpText = player.level < 10 ? `${player.xp}/${player.xpToNext}` : "MAX";
  const xpPercent = player.level < 10 && player.xpToNext > 0 ? Math.min(100, Math.round((player.xp / player.xpToNext) * 100)) : 100;
  playerHealth.innerHTML = `
    <div><strong>Level:</strong> ${player.level}</div>
    <div class="xp-container">
      <div class="xp-bar">
        <div id="xpFill" class="xp-fill" style="width: ${xpPercent}%;"></div>
      </div>
      <div class="xp-label">XP: ${xpText} (${xpPercent}%)</div>
    </div>
    <div><strong>Name:</strong> ${player.name}</div>
    <div><strong>HP:</strong> ${player.hp}/${player.maxHp}</div>
    <div><strong>Attack:</strong> ${player.getAttackPwr()}</div>
    <div><strong>Speed:</strong> ${player.getSpeed()}</div>
    <div><strong>Equipped:</strong> ${equippedItems}</div>
    <div><strong>Items:</strong> ${totalItems}</div>
    <div><strong>Potions:</strong> ${potionCount}</div>
  `;
}

function updateEnemyStats() {
  const enemyStats = document.getElementById("enemyStats");
  if (enemy) {
    enemyStats.innerHTML = `
      <div><strong>Name:</strong> ${enemy.name}</div>
      <div><strong>HP:</strong> ${enemy.hp}</div>
      <div><strong>Attack:</strong> ${enemy.getAttackPwr()}</div>
      <div><strong>Speed:</strong> ${enemy.getSpeed()}</div>
    `;
  } else {
    enemyStats.innerHTML = "No enemy detected.";
  }
}

function updateLootButtonVisibility() {
  if (defeatedEnemy) {
    lootBtn.style.display = "inline-block";
  } else {
    lootBtn.style.display = "none";
  }
}

function updateActionButtonStates() {
  // Move available when not in encounter and no defeated enemy waiting
  moveBtn.disabled = isGameOver || inEncounter || Boolean(defeatedEnemy);
  // Attack only when in encounter
  attackBtn.disabled = isGameOver || !inEncounter;
  // Heal when player has potions and not at full HP
  healBtn.disabled = isGameOver || player.getItemQuantity('Potion') === 0 || player.hp === player.maxHp;
  // Inventory always allowed unless game over
  inventoryBtn.disabled = !!isGameOver;
  // Equip/unequip handled separately when inventory shown
  equipBtn.disabled = isGameOver;
  unequipBtn.disabled = isGameOver;
  // Loot only when defeated enemy exists
  lootBtn.disabled = isGameOver || !defeatedEnemy;
}

function setEquipmentButtonsVisible(visible) {
  equipBtn.style.display = visible ? "inline-block" : "none";
  unequipBtn.style.display = visible ? "inline-block" : "none";
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
    // Pick an enemy appropriate for the player's level. Allow up to +1 level difference.
    // Prefer enemies whose min/max ranges include player level
    let possible = enemies.filter(e => (player.level >= (e.minLevel || 1)) && (player.level <= (e.maxLevel || 10)));
    // If none found, allow evolved versions for enemies with evolveAfter set
    if (possible.length === 0) {
      const evolvable = enemies.filter(e => e.evolveAfter && player.level > (e.maxLevel || 1));
      if (evolvable.length > 0) {
        // pick a random evolvable enemy and create a slightly stronger copy
        const template = evolvable[Math.floor(Math.random() * evolvable.length)];
        const over = player.level - (template.maxLevel || 1);
        const scale = 1 + Math.min(0.5, 0.08 * over); // modest scaling
        enemy = new Character(template.name, Math.round(template._baseHp * scale), Math.round(template._baseAttackInput * scale), template.baseSpeed, Object.keys(template.inventory).map(k => template.inventory[k].item));
        enemy.minLevel = template.minLevel; enemy.maxLevel = template.maxLevel; enemy.evolveAfter = template.evolveAfter;
      } else {
        // fallback to any enemy
        possible = enemies;
        enemy = possible[Math.floor(Math.random() * possible.length)];
      }
    } else {
      enemy = possible[Math.floor(Math.random() * possible.length)];
    }
    handleEncounter(enemy);
    updateEnemyStats();
  } else {
    createMessage("You continue through the forest.");
  }
  defeatedEnemy = null;
  updateLootButtonVisibility();
  updateActionButtonStates();
}

//append puts at the end
//prepend puts at the start

function handleEncounter(enemy) {
  // Reset enemy HP to their max (accounts for level scaling)
  enemy.hp = enemy.maxHp;
  createMessage(`${enemy.name} comes at you!`);
  inEncounter = true;
  updateActionButtonStates();
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
      const xpGain = Math.max(5, Math.floor(enemy.level * 20));
      const leveled = player.gainXp(xpGain);
      createMessage(`Gained ${xpGain} XP${leveled ? ' and leveled up!' : ''}`);
      updateplayerStats();
      createMessage("You can now loot the defeated enemy!");
      defeatedEnemy = enemy;
      enemy = null;
      updateLootButtonVisibility();
      updateActionButtonStates();
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
        const xpGain = Math.max(5, Math.floor(enemy.level * 20));
        const leveled = player.gainXp(xpGain);
        createMessage(`Gained ${xpGain} XP${leveled ? ' and leveled up!' : ''}`);
        updateplayerStats();
        createMessage("You can now loot the defeated enemy!");
        defeatedEnemy = enemy;
        enemy = null;
        updateLootButtonVisibility();
        updateActionButtonStates();
      }
    }
  }
}

function handleInventory() {
  const equipmentButtonsVisible = equipBtn.style.display === "inline-block" || unequipBtn.style.display === "inline-block";

  if (equipmentButtonsVisible) {
    setEquipmentButtonsVisible(false);
    createMessage("Inventory closed.");
    return;
  }

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
  setEquipmentButtonsVisible(true);
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
  updateActionButtonStates();

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
  updateActionButtonStates();
}

function startGame() {
  createMessage(
    `Welcome, ${player.name}! You are about to embark on a journey through the forest. Beware of the creatures that lurk in the shadows!`,
  );
  updateplayerStats();
  updateActionButtonStates();
}

// Equipment button functions
function handleEquip() {
  const inventorySize = Object.keys(player.inventory).length;
  if (inventorySize === 0) {
    createMessage("You have no items to equip!");
    setEquipmentButtonsVisible(false);
    return;
  }
  
  const indexInput = prompt(`Enter item number to equip (1-${inventorySize})`);
  if (indexInput === null) {
    setEquipmentButtonsVisible(false);
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
    setEquipmentButtonsVisible(false);
    return;
  }
  
  if (itemName === "Potion") {
    createMessage("You can't equip potions!");
    setEquipmentButtonsVisible(false);
    return;
  }
  
  const item = player.getItem(itemName);
  player.equip(item);
  createMessage(`${item.name} equipped! +${item.effectValue} ${item.effectProperty}`);
  updateplayerStats();
  setEquipmentButtonsVisible(false);
}

function handleUnequip() {
  const equippedList = Object.values(player.equipped).flat();
  if (equippedList.length === 0) {
    createMessage("You have nothing equipped!");
    setEquipmentButtonsVisible(false);
    return;
  }
  
  const inventorySize = Object.keys(player.inventory).length;
  const indexInput = prompt(`Enter item number to unequip (1-${inventorySize})`);
  if (indexInput === null) {
    setEquipmentButtonsVisible(false);
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
    setEquipmentButtonsVisible(false);
    return;
  }
  
  const item = player.getItem(itemName);
  player.unequip(item);
  createMessage(`${item.name} unequipped!`);
  updateplayerStats();
  setEquipmentButtonsVisible(false);
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
  player.level = 1;
  player.xp = 0;
  player.xpToNext = player.calculateXpToNext();
  player.recalcStatsForLevel();
  player.hp = player.maxHp;
  player.inventory = {};
  player.equipped = {};
  player.addItem(sword, 1);
  player.addItem(potion, 2);
  
  // Reset enemies
  kobold.hp = kobold.maxHp;
  goblin.hp = goblin.maxHp;
  orc.hp = orc.maxHp;
  dragon.hp = dragon.maxHp;
  
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
  setEquipmentButtonsVisible(false);
  
  // Start new game
  startGame();
  updateActionButtonStates();
}

moveBtn.addEventListener("click", handleMove);
restartBtn.addEventListener("click", handleRestart);
attackBtn.addEventListener("click", () => handleAttack(enemy));
healBtn.addEventListener("click", handleHeal);
inventoryBtn.addEventListener("click", handleInventory);
equipBtn.addEventListener("click", handleEquip);
unequipBtn.addEventListener("click", handleUnequip);
lootBtn.addEventListener("click", handleLoot);
