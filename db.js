const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'nexis_insights.db');

let db;

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Feedback Analyses History Table
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      input_text TEXT NOT NULL,
      positive_pct INTEGER NOT NULL,
      neutral_pct INTEGER NOT NULL,
      negative_pct INTEGER NOT NULL,
      pain_points TEXT NOT NULL,
      feature_requests TEXT NOT NULL,
      executive_summary TEXT NOT NULL,
      price_intelligence TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  saveDb();
  console.log('🗄️ SQLite Database Initialized via sql.js (nexis_insights.db)');
}

function createUser(name, email, passwordHash) {
  const id = uuidv4();
  db.run(
    'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
    [id, name, email.toLowerCase(), passwordHash]
  );
  saveDb();
  return { id, name, email: email.toLowerCase() };
}

function findUserByEmail(email) {
  const res = db.exec('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  if (!res.length || !res[0].values.length) return null;
  const row = res[0].values[0];
  const columns = res[0].columns;
  const user = {};
  columns.forEach((col, idx) => user[col] = row[idx]);
  return user;
}

function findUserById(id) {
  const res = db.exec('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
  if (!res.length || !res[0].values.length) return null;
  const row = res[0].values[0];
  const columns = res[0].columns;
  const user = {};
  columns.forEach((col, idx) => user[col] = row[idx]);
  return user;
}

function saveAnalysis(userId, inputText, data) {
  const id = uuidv4();
  const painPointsJson = JSON.stringify(data.pain_points || []);
  const featureReqsJson = JSON.stringify(data.feature_requests || []);
  const priceIntelJson = JSON.stringify(data.price_intelligence || {});

  db.run(
    `INSERT INTO feedback_analyses 
     (id, user_id, input_text, positive_pct, neutral_pct, negative_pct, pain_points, feature_requests, executive_summary, price_intelligence) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId || null,
      inputText,
      data.positive_pct || 0,
      data.neutral_pct || 0,
      data.negative_pct || 0,
      painPointsJson,
      featureReqsJson,
      data.executive_summary || '',
      priceIntelJson
    ]
  );
  saveDb();
  return { id, userId, ...data };
}

function getUserHistory(userId) {
  let query = 'SELECT * FROM feedback_analyses ORDER BY created_at DESC LIMIT 50';
  let params = [];
  if (userId) {
    query = 'SELECT * FROM feedback_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';
    params = [userId];
  }

  const res = db.exec(query, params);
  if (!res.length) return [];

  const columns = res[0].columns;
  return res[0].values.map(row => {
    const item = {};
    columns.forEach((col, idx) => item[col] = row[idx]);
    try { item.pain_points = JSON.parse(item.pain_points); } catch(e) {}
    try { item.feature_requests = JSON.parse(item.feature_requests); } catch(e) {}
    try { item.price_intelligence = JSON.parse(item.price_intelligence); } catch(e) {}
    return item;
  });
}

function deleteAnalysis(id, userId) {
  if (userId) {
    db.run('DELETE FROM feedback_analyses WHERE id = ? AND user_id = ?', [id, userId]);
  } else {
    db.run('DELETE FROM feedback_analyses WHERE id = ?', [id]);
  }
  saveDb();
  return true;
}

module.exports = {
  initDb,
  createUser,
  findUserByEmail,
  findUserById,
  saveAnalysis,
  getUserHistory,
  deleteAnalysis
};
