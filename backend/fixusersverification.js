// backend/fixVerificationStatus.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ehealth.db');

// Update all users to have proper verification status
db.run("UPDATE users SET verification_status = 'approved' WHERE verification_status IS NULL OR verification_status = ''", (err) => {
    if (err) {
        console.error('Error updating verification status:', err);
    } else {
        console.log('✅ Updated null/empty verification_status to approved');
    }
});

// Check current users
db.all("SELECT id, username, role, verification_status FROM users", [], (err, users) => {
    if (err) {
        console.error('Error fetching users:', err);
    } else {
        console.log('\n📋 Current Users:');
        console.table(users);
    }
    db.close();
});