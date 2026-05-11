// backend/check-db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, './ehealth.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking database...\n');

// Check users table structure
db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('📋 Users table columns:');
    columns.forEach(col => {
        console.log(`   - ${col.name} (${col.type})`);
    });
    
    console.log('\n👥 Users in database:');
    db.all('SELECT id, username, role, verification_status, status FROM users', (err, users) => {
        if (err) {
            console.error('Error:', err);
        } else if (users.length === 0) {
            console.log('   No users found');
        } else {
            users.forEach(user => {
                console.log(`   - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Status: ${user.verification_status}`);
            });
        }
        
        db.close();
    });
});