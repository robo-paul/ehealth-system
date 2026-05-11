// backend/fix-missing-columns.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, './ehealth.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing missing database columns...');

db.serialize(() => {
    // Check existing columns
    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
            console.error('Error checking table:', err);
            return;
        }
        
        const columnNames = columns.map(col => col.name);
        console.log('Existing columns:', columnNames.join(', '));
        
        // Add role column if missing
        if (!columnNames.includes('role')) {
            console.log('📝 Adding role column...');
            db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'patient'", (err) => {
                if (err) {
                    console.error('Failed to add role column:', err);
                } else {
                    console.log('✅ role column added successfully');
                }
            });
        } else {
            console.log('✅ role column already exists');
        }
        
        // Add verification_status if missing
        if (!columnNames.includes('verification_status')) {
            console.log('📝 Adding verification_status column...');
            db.run("ALTER TABLE users ADD COLUMN verification_status TEXT DEFAULT 'pending'", (err) => {
                if (err) {
                    console.error('Failed to add verification_status:', err);
                } else {
                    console.log('✅ verification_status column added');
                }
            });
        }
        
        // Add status if missing
        if (!columnNames.includes('status')) {
            console.log('📝 Adding status column...');
            db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'", (err) => {
                if (err) {
                    console.error('Failed to add status:', err);
                } else {
                    console.log('✅ status column added');
                }
            });
        }
        
        // Add verified_by if missing
        if (!columnNames.includes('verified_by')) {
            console.log('📝 Adding verified_by column...');
            db.run("ALTER TABLE users ADD COLUMN verified_by INTEGER", (err) => {
                if (err) {
                    console.error('Failed to add verified_by:', err);
                } else {
                    console.log('✅ verified_by column added');
                }
            });
        }
        
        // Add verified_at if missing
        if (!columnNames.includes('verified_at')) {
            console.log('📝 Adding verified_at column...');
            db.run("ALTER TABLE users ADD COLUMN verified_at DATETIME", (err) => {
                if (err) {
                    console.error('Failed to add verified_at:', err);
                } else {
                    console.log('✅ verified_at column added');
                }
            });
        }
        
        // Update existing users
        setTimeout(() => {
            db.run("UPDATE users SET role = 'patient' WHERE role IS NULL", (err) => {
                if (err) console.error('Error updating roles:', err);
                else console.log('✅ Updated existing users with default role');
            });
            
            db.run("UPDATE users SET verification_status = 'approved' WHERE verification_status IS NULL AND role = 'patient'", (err) => {
                if (err) console.error('Error updating verification status:', err);
                else console.log('✅ Updated verification statuses');
            });
            
            db.run("UPDATE users SET status = 'active' WHERE status IS NULL", (err) => {
                if (err) console.error('Error updating status:', err);
                else console.log('✅ Updated user statuses');
            });
        }, 500);
    });
});

setTimeout(() => {
    db.close();
    console.log('✅ Database fix complete!');
}, 3000);