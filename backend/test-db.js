// backend/test-db.js
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS test (id INT, name TEXT)");
    
    db.run("INSERT INTO test (id, name) VALUES (1, 'Test User')");
    
    db.get("SELECT * FROM test", (err, row) => {
        if (err) {
            console.error('❌ Database error:', err);
        } else {
            console.log('✅ Database working! Test record:', row);
        }
    });
});

setTimeout(() => db.close(), 1000);