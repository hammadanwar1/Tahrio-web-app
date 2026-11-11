// Tiny JSON-file database. Loads data/db.json (created from data/seed.json on
// first run) and writes it back atomically after every mutation.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const SEED_FILE = path.join(__dirname, '..', 'data', 'seed.json');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function freshFromSeed() {
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  seed.users = seed.users.map(({ password, ...u }) => ({ ...u, passwordHash: bcrypt.hashSync(password, 10) }));
  return seed;
}

let db;

function load() {
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    applyStorePolicy(db);
    save();
  } else {
    db = freshFromSeed();
    save();
  }
  return db;
}

/**
 * Store-wide settings that live in seed.json, re-applied to an existing database on every start
 * so a deploy changes them everywhere: delivery fees, and no free delivery on any product.
 */
function applyStorePolicy(data) {
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  data.deliveryMethods = seed.deliveryMethods;
  for (const p of data.products || []) p.freeDelivery = false;
}

function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function reset() {
  db = freshFromSeed();
  save();
  return db;
}

module.exports = {
  DATA_DIR,
  get: () => db || load(),
  save,
  reset,
};
