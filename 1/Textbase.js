//const log2 = document.querySelector('#log2')

//const log3 = document.querySelectorAll('.log3')
//const log4 = document.getElementsByClassName('log4')
//document.querySelector('p')
// story pitch: you are a boy named Silas searching for his parents, who were lost in the wilderness after going camping for their honeymoon(seriously, who does that?) along the way, you encounter a fey. she sends you into a spiraling maze, where you are to find your way out while learning more about her along the way. when the time comes to kill her, you may choose to spare her, but nobody leaves this place unscathed...
// what to implement.
// want faerie queen to be spareable or killable with a different outcome for either result
// remove faerie queen from loot table
// make lvl -> health buff lower

const log = document.getElementById("log");
const moveBtn = document.getElementById("moveBtn");
const attackBtn = document.getElementById("attackBtn");
const inventoryBtn = document.getElementById("inventoryBtn");
const healBtn = document.getElementById("healBtn");
const lootBtn = document.getElementById("lootBtn");
const restartBtn = document.getElementById("restartBtn");
const playerStats = document.getElementById("playerStats");
const enemyStats = document.getElementById("enemyStats");
const inventoryPanel = document.getElementById("inventoryPanel");
const inventoryItems = document.getElementById("inventoryItems");
const equippedItemsPanel = document.getElementById("equippedItems");
const closeInventoryBtn = document.getElementById("closeInventoryBtn");
const introForm = document.introForm

// Button - click event - HAS to click
// submit - forms - user can click button or hit enter

const actionButtons = [moveBtn, attackBtn, healBtn, inventoryBtn, lootBtn];

function setActionButtonsEnabled(enabled) {
  actionButtons.forEach((button) => {
    button.disabled = !enabled;
  });
}

function isItemEquipped(item) {
  return Object.values(player.equipped).flat().includes(item);
}

function getEquippedItemNames() {
  const equipped = Object.values(player.equipped).flat();
  return equipped.length ? equipped.map(item => item.name) : [];
}

function handleInventoryItemClick(itemName) {
  const item = player.getItem(itemName);
  if (!item) return;

  if (item.effectProperty === 'hp') {
    createMessage("Potions can't be equipped. Use them in battle from your item list.");
    return;
  }

  const alreadyEquipped = isItemEquipped(item);
  if (alreadyEquipped) {
    player.unequip(item);
    createMessage(`${item.name} unequipped.`);
  } else {
    if (item.effectProperty === 'attackPwr') {
      const prevWeapons = player.equipped.attackPwr ? [...player.equipped.attackPwr] : [];
      if (prevWeapons.length > 0) {
        prevWeapons.forEach(w => player.unequip(w));
        createMessage(`Unequipped ${prevWeapons.map(w => w.name).join(', ')}.`);
      }
    }
    player.equip(item);
    createMessage(`${item.name} equipped! +${item.effectValue} ${item.effectProperty}`);
  }

  updateplayerStats();
  renderInventoryUI();
}

function handleTrashItem(itemName) {
  const item = player.getItem(itemName);
  if (!item) return;

  if (isItemEquipped(item)) {
    player.unequip(item);
    createMessage(`${item.name} was unequipped before trashing.`);
  }

  player.removeItem(itemName, 1);
  createMessage(`${item.name} was trashed.`);
  updateplayerStats();
  renderInventoryUI();
}

function renderInventoryUI() {
  inventoryItems.innerHTML = '';
  const inventoryKeys = Object.keys(player.inventory);

  if (inventoryKeys.length === 0) {
    inventoryItems.innerHTML = '<div class="inventory-empty">Your inventory is empty.</div>';
  } else {
    inventoryKeys.forEach((itemName) => {
      const data = player.inventory[itemName];
      const item = data.item;
      const isEquipped = isItemEquipped(item);
      const card = document.createElement('div');
      card.className = `inventory-card${isEquipped ? ' equipped' : ''}`;
      card.dataset.itemName = itemName;
      card.innerHTML = `
        <div class="item-name">${item.name}${data.quantity > 1 ? ` x${data.quantity}` : ''}</div>
        <div class="item-meta">${item.description}</div>
        <div class="item-meta">Type: ${item.effectProperty}${item.effectProperty !== 'hp' ? ` +${item.effectValue}` : ''}</div>
        <div class="item-status">${item.effectProperty === 'hp' ? 'Potions cannot be equipped' : isEquipped ? 'Click to unequip' : 'Click to equip'}</div>
        <button type="button" class="trash-button" data-trash-item="${itemName}">Trash</button>
      `;
      card.addEventListener('click', () => handleInventoryItemClick(itemName));
      const trashButton = card.querySelector('.trash-button');
      trashButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (confirm(`Trash ${item.name}? This will permanently remove one from your inventory.`)) {
          handleTrashItem(itemName);
        } else {
          createMessage(`${item.name} was not trashed.`);
        }
      });
      inventoryItems.append(card);
    });
  }

  const equippedNames = getEquippedItemNames();
  equippedItemsPanel.innerHTML = `<strong>Equipped:</strong> ${equippedNames.length ? equippedNames.join(', ') : 'None'}`;
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

// Hide loot and restart buttons initially
lootBtn.style.display = "none";
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
    this.baseHp = hp; // store base values for scaling
    this.baseAttackInput = attackPwr;
    // Only the player scales with level; enemies keep their base stats
    if (this.isPlayer) {
      this.maxHp = this.baseHp * this.level;
      this.baseAttackPwr = this.baseAttackInput * this.level;
    } else {
      this.maxHp = this.baseHp;
      this.baseAttackPwr = this.baseAttackInput;
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
    return 10 * this.level;
  }

  recalcStatsForLevel() {
    if (!this.isPlayer) return;
    this.maxHp = this.baseHp * this.level;
    // keep hp proportional to new max
    const hpRatio = this.hp / Math.max(1, this.maxHp);
    // gentler attack growth: add a small flat increase per level
    this.baseAttackPwr = this.baseAttackInput + Math.floor((this.level - 1) * 1);
    this.xpToNext = this.calculateXpToNext();
    this.hp = Math.round(this.maxHp * hpRatio);
    if (this.hp > this.maxHp) this.hp = this.maxHp;
  }

  gainXp(amount) {
    if (!this.isPlayer) return false;
    if (this.level >= 10) return false; // already at cap
    this.xp += amount;
    let leveled = false;
    // When leveling up, restore a portion of max HP each level
    const levelupHealpercent = 0.30; // 30% of max HP regained per level
    while (this.xp >= this.xpToNext && this.level < 10) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.recalcStatsForLevel();
      const healAmount = Math.round(this.maxHp * levelupHealpercent);
      const prevHp = this.hp;
      this.hp = Math.min(this.hp + healAmount, this.maxHp);
      const actualHealed = this.hp - prevHp;
      if (actualHealed > 0) {
        createMessage(`${this.name} regained ${actualHealed} HP from leveling!`);
      }
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
const leatherBoots = new Item("Leather Boots", "Light boots that increase speed", "speed", 4);
const wingedBoots = new Item("Winged Boots", "Boots that add quickness", "speed", 8);
const steelSword = new Item("Steel Sword", "A sturdier sword", "attackPwr", 6);
const battleAxe = new Item("Battle Axe", "A heavy battle axe", "attackPwr", 9);

const lootTemplates = {
  weapons: [
    { name: "Rusty Dagger", description: "A cheap dagger.", effectProperty: "attackPwr", effectValue: 2, minLevel: 1, maxLevel: 2 },
    { name: "Iron Club", description: "A club with a little extra heft.", effectProperty: "attackPwr", effectValue: 4, minLevel: 2, maxLevel: 3 },
    { name: "Steel Sword", description: "A sturdier sword.", effectProperty: "attackPwr", effectValue: 6, minLevel: 4, maxLevel: 5 },
    { name: "Battle Axe", description: "A heavy battle axe.", effectProperty: "attackPwr", effectValue: 9, minLevel: 4, maxLevel: 10 },
  ],
  accessories: [
    { name: "Leather Boots", description: "Light boots that increase speed.", effectProperty: "speed", effectValue: 4, minLevel: 1, maxLevel: 3 },
    { name: "Winged Boots", description: "Boots that add quickness.", effectProperty: "speed", effectValue: 8, minLevel: 3, maxLevel: 6 },
    { name: "Dragon Claw", description: "A sharp claw offering a speed boost.", effectProperty: "speed", effectValue: 15, minLevel: 5, maxLevel: 10 },
  ],
};

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cloneItemTemplate(template) {
  return new Item(template.name, template.description, template.effectProperty, template.effectValue);
}

// Create an Item from a template and scale its effectValue with player level
function cloneItemTemplateScaled(template, playerLevel) {
  const baseValue = template.effectValue || 0;
  const minLevel = template.minLevel || 1;
  const levelDiff = Math.max(0, playerLevel - minLevel);
  // scale up item power modestly per level above its minLevel
  const scalePerlevel = 0.03; // 3% per level above min
  const scaleFactor = 1 + levelDiff * scalePerlevel;
  const scaledValue = Math.max(0, Math.round(baseValue * scaleFactor));
  return new Item(template.name, template.description, template.effectProperty, scaledValue);
}

// Create a new enemy Character from a template, scaling stats with player level
function createEnemyFromTemplate(template, playerLevel) {
  const baseHp = template.baseHp || template.maxHp || 10;
  const baseAtk = template.baseAttackInput || template.baseAttackPwr || 5;
  const levelDiff = Math.max(0, playerLevel - (template.level || 1));
  const isBoss = template.lootType === 'boss';
  const scalePerlevel = isBoss ? 0.03 : 0.08; // bosses scale more gently
  const scale = 1 + levelDiff * scalePerlevel;
  const hp = Math.max(1, Math.round(baseHp * scale));
  const atk = Math.max(1, Math.round(baseAtk * scale));
  const speed = template.baseSpeed || template.baseSpeed === 0 ? template.baseSpeed : (template.baseSpeed || 10);
  const invItems = template.inventory ? Object.keys(template.inventory).map(k => template.inventory[k].item) : [];
  const enemyChar = new Character(template.name, hp, atk, speed, invItems, template.level || 1);
  enemyChar.minLevel = template.minLevel;
  enemyChar.maxLevel = template.maxLevel;
  enemyChar.evolveAfter = template.evolveAfter;
  enemyChar.lootType = template.lootType;
  return enemyChar;
}

function getLootPool(level, category) {
  return lootTemplates[category].filter(item => level >= item.minLevel && level <= item.maxLevel || level >= item.maxLevel);
}

function generateLootForEnemy(enemy, playerLevel) {
  const loot = [];
  const level = Math.min(Math.max(playerLevel, 1), 10);

  // Preferred drops per enemy name
  const preferred = {
    'Dragon': [
      { name: 'Dragon Claw', description: 'A sharp claw offering a speed boost.', effectProperty: 'speed', effectValue: 15, minLevel: 5, maxLevel: 10 }
    ],
    'Orc': [
      { name: 'Axe', description: 'A heavy blade', effectProperty: 'attackPwr', effectValue: 7, minLevel: 3, maxLevel: 10 },
      { name: 'Battle Axe', description: 'A heavy battle axe', effectProperty: 'attackPwr', effectValue: 9, minLevel: 4, maxLevel: 10 }
    ],
    'Goblin': [
      { name: 'Club', description: 'A blunt weapon', effectProperty: 'attackPwr', effectValue: 4, minLevel: 1, maxLevel: 4 },
      { name: 'Dagger', description: 'A small blade', effectProperty: 'attackPwr', effectValue: 3, minLevel: 1, maxLevel: 3 }
    ],
    'Kobold': [
      { name: 'Dagger', description: 'A small blade', effectProperty: 'attackPwr', effectValue: 2, minLevel: 1, maxLevel: 2 }
    ]
  };

  const weaponPool = getLootPool(level, 'weapons');
  const accessoryPool = getLootPool(level, 'accessories');

  // Guarantee at least one preferred drop if defined
  if (preferred[enemy.name]) {
    const pref = randomChoice(preferred[enemy.name]);
    loot.push(cloneItemTemplateScaled(pref, playerLevel));
  }

  const dropCount = enemy.name === 'Kobold' ? randomBetween(1, 2) : enemy.name === 'Goblin' ? randomBetween(1, 2) : enemy.name === 'Orc' ? randomBetween(2, 3) : randomBetween(1, 2);

  for (let i = 0; i < dropCount; i++) {
    if (Math.random() < 0.7 && weaponPool.length > 0) {
      loot.push(cloneItemTemplateScaled(randomChoice(weaponPool), playerLevel));
    } else if (accessoryPool.length > 0) {
      loot.push(cloneItemTemplateScaled(randomChoice(accessoryPool), playerLevel));
    }
  }

  // Potions remain common
  if (Math.random() < 0.8) {
    loot.push(cloneItemTemplateScaled({ name: 'Potion', description: 'Heals 15 HP', effectProperty: 'hp', effectValue: 15, minLevel: 1, maxLevel: 10 }, playerLevel));
  }

  if (loot.length === 0) {
    loot.push(cloneItemTemplateScaled(randomChoice(weaponPool.length ? weaponPool : lootTemplates.weapons), playerLevel));
  }

  return loot;
}

const player = new Character("Adventurer", 100, 15, 15, [sword, potion, potion], 1, true);

// Assign levels to enemies so stronger foes appear later
const kobold = new Character("Kobold", 10, 5, 10, [dagger, potion], 1);
kobold.minLevel = 1; kobold.maxLevel = 2; kobold.evolveAfter = false;
kobold.lootType = 'weak';
const goblin = new Character("Goblin", 20, 10, 10, [club, potion], 2);
goblin.minLevel = 2; goblin.maxLevel = 4; goblin.evolveAfter = true;
goblin.lootType = 'medium';
const orc = new Character("Orc", 30, 15, 20, [axe, potion], 3);
orc.minLevel = 3; orc.maxLevel = 6; orc.evolveAfter = true;
orc.lootType = 'strong';
const dragon = new Character("Dragon", 100, 20, 50, [dragonClaw, potion, potion, potion], 6);
dragon.minLevel = 6; dragon.maxLevel = 9; dragon.evolveAfter = true;
dragon.lootType = 'boss';
const faerieQueen = new Character("Faerie Queen", 500, 50, 30, [], 10);
faerieQueen.minLevel = 10; faerieQueen.maxLevel = 10; faerieQueen.evolveAfter = false;
faerieQueen.lootType = 'boss';

const enemies = [kobold, goblin, orc, dragon, faerieQueen];
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
  // Keep move clickable so handler can show a warning when blocked by encounter
  moveBtn.disabled = isGameOver || Boolean(defeatedEnemy);
  // Allow clicking Attack at all times so handler can notify when there's nothing to attack
  attackBtn.disabled = isGameOver;
  // Heal when player has potions and not at full HP
  healBtn.disabled = isGameOver || player.getItemQuantity('Potion') === 0 || player.hp === player.maxHp;
  // Inventory always allowed unless game over
  inventoryBtn.disabled = !!isGameOver;
  // Loot only when defeated enemy exists
  lootBtn.disabled = isGameOver || !defeatedEnemy;
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
        enemy = createEnemyFromTemplate(template, player.level);
      } else {
        // fallback to any enemy
        possible = enemies;
        const template = possible[Math.floor(Math.random() * possible.length)];
        enemy = createEnemyFromTemplate(template, player.level);
      }
    } else {
      const template = possible[Math.floor(Math.random() * possible.length)];
      enemy = createEnemyFromTemplate(template, player.level);
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
  enemy.lootItems = generateLootForEnemy(enemy, player.level);
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
  const isOpen = !inventoryPanel.classList.contains('hidden');
  if (isOpen) {
    inventoryPanel.classList.add('hidden');
    createMessage('Inventory closed.');
    return;
  }

  renderInventoryUI();
  inventoryPanel.classList.remove('hidden');
  createMessage('Inventory opened. Click an item to equip or unequip it.');
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
  const lootItems = defeatedEnemy.lootItems || [];

  lootItems.forEach((item) => {
    player.addItem(item, 1);
    lootedItems.push(item.name);

    const alreadyEquipped = isItemEquipped(item);
    if (item.name !== "Potion" && !alreadyEquipped) {
      if (item.effectProperty === 'attackPwr') {
        const hasWeapon = player.equipped.attackPwr && player.equipped.attackPwr.length > 0;
        if (!hasWeapon) player.equip(item);
      } else {
        player.equip(item);
      }
    }
  });

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
function handleGameOver() {
  isGameOver = true;
  
  // Disable main game buttons
  moveBtn.disabled = true;
  attackBtn.disabled = true;
  healBtn.disabled = true;
  inventoryBtn.disabled = true;
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
  lootBtn.disabled = false;
  
  // Hide restart button and extra buttons
  restartBtn.style.display = "none";
  lootBtn.style.display = "none";
  
  // Start new game
  startGame();
  updateActionButtonStates();
}

moveBtn.addEventListener("click", handleMove);
restartBtn.addEventListener("click", handleRestart);
attackBtn.addEventListener("click", () => handleAttack(enemy));
healBtn.addEventListener("click", handleHeal);
inventoryBtn.addEventListener("click", handleInventory);
lootBtn.addEventListener("click", handleLoot);
closeInventoryBtn.addEventListener("click", () => {
  inventoryPanel.classList.add('hidden');
  createMessage('Inventory closed.');
});
