const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(process.cwd(), 'database', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('FATAL: Cannot create data directory:', DATA_DIR, err.message);
    throw err;
  }
}

function readJson(filePath) {
  try {
    ensureDataDir();
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    if (!data || !data.trim()) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
      return [];
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('ERROR reading JSON file:', filePath, err.message);
    if (err instanceof SyntaxError) {
      const backup = filePath + '.backup-' + Date.now();
      try { fs.copyFileSync(filePath, backup); } catch {}
      fs.writeFileSync(filePath, '[]', 'utf-8');
      console.error('Corrupted JSON file backed up to:', backup, '- reset to empty array');
      return [];
    }
    return [];
  }
}

function writeJson(filePath, data) {
  try {
    ensureDataDir();
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
    return true;
  } catch (err) {
    console.error('ERROR writing JSON file:', filePath, err.message);
    return false;
  }
}

function findAll(filePath) {
  return readJson(filePath);
}

function findById(filePath, id) {
  const items = readJson(filePath);
  return items.find((item) => item.id === id) || null;
}

function findByField(filePath, field, value) {
  const items = readJson(filePath);
  return items.find((item) => item[field] === value) || null;
}

function findByFieldAll(filePath, field, value) {
  const items = readJson(filePath);
  return items.filter((item) => item[field] === value);
}

function insert(filePath, item) {
  const items = readJson(filePath);
  items.push(item);
  writeJson(filePath, items);
  return item;
}

function update(filePath, id, updates) {
  const items = readJson(filePath);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  writeJson(filePath, items);
  return items[index];
}

module.exports = {
  users: {
    findAll: () => findAll(USERS_FILE),
    findById: (id) => findById(USERS_FILE, id),
    findByEmail: (email) => findByField(USERS_FILE, 'email', email),
    insert: (user) => insert(USERS_FILE, user),
    update: (id, updates) => update(USERS_FILE, id, updates),
  },
  orders: {
    findAll: () => findAll(ORDERS_FILE),
    findById: (id) => findById(ORDERS_FILE, id),
    findByCustomer: (customerId) => findByFieldAll(ORDERS_FILE, 'customer_id', customerId),
    insert: (order) => insert(ORDERS_FILE, order),
    update: (id, updates) => update(ORDERS_FILE, id, updates),
  },
  messages: {
    findByOrder: (orderId) => findByFieldAll(MESSAGES_FILE, 'order_id', orderId),
    insert: (msg) => insert(MESSAGES_FILE, msg),
  },
};
