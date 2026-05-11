// backend/config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Get the database path
const dbPath = path.resolve(__dirname, '../ehealth.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database');
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

module.exports = db;