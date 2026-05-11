// backend/scripts/checkRole.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../ehealth.db');
const db = new sqlite3.Database(dbPath);

const username = process.argv[2] || 'masteradmin';

console.log(`\n🔍 Checking role for user: ${username}\n`);
console.log('=========================================\n');

db.get(
    `SELECT 
        id, 
        username, 
        email, 
        role, 
        verification_status, 
        is_immutable,
        fingerprint_id,
        created_at
     FROM users 
     WHERE username = ?`,
    [username],
    (err, user) => {
        if (err) {
            console.error('❌ Database error:', err.message);
            db.close();
            process.exit(1);
        }
        
        if (!user) {
            console.log(`❌ User '${username}' not found!\n`);
            db.close();
            process.exit(1);
        }
        
        console.log('✅ User found!\n');
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email || 'Not set'}`);
        console.log(`   Role: ${user.role.toUpperCase()}`);
        console.log(`   Verification Status: ${user.verification_status}`);
        console.log(`   Immutable: ${user.is_immutable === 1 ? 'Yes' : 'No'}`);
        console.log(`   Fingerprint ID: ${user.fingerprint_id || 'Not enrolled'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('\n=========================================\n');
        
        // Check if it's master admin
        if (user.role === 'master_admin') {
            console.log('🎯 This user has MASTER ADMIN privileges!');
            if (user.is_immutable === 1) {
                console.log('🔒 This account is IMMUTABLE (cannot be modified or deleted)');
            }
        } else {
            console.log(`📌 This user has ${user.role.toUpperCase()} privileges`);
        }
        
        console.log('\n');
        db.close();
    }
);