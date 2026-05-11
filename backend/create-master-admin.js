// backend/create-master-admin.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, './ehealth.db');
const db = new sqlite3.Database(dbPath);

// Check if master admin exists
db.get('SELECT id FROM users WHERE role = ?', ['master_admin'], (err, user) => {
    if (err) {
        console.error('Error checking for master admin:', err);
        db.close();
        return;
    }
    
    if (user) {
        console.log('✅ Master Admin already exists!');
        console.log('   Username: masteradmin');
        console.log('   Password: Admin@2025!');
        db.close();
        return;
    }
    
    console.log('👑 Creating Master Admin...');
    
    bcrypt.hash('Admin@2025!', 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            db.close();
            return;
        }
        
        db.run(
            `INSERT INTO users (username, email, password_hash, role, health_record_id, verification_status, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['masteradmin', 'admin@ehealth.com', hash, 'master_admin', 'ADMIN-001', 'approved', 'active'],
            function(err) {
                if (err) {
                    console.error('Error creating master admin:', err.message);
                } else {
                    console.log('✅ Master Admin created successfully!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('   Username: masteradmin');
                    console.log('   Password: Admin@2025!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                }
                db.close();
            }
        );
    });
});