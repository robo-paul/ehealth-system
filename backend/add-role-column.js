// backend/add-role-column.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ehealth.db');

console.log('🔧 Adding role column to users table...');

db.serialize(() => {
    // Check if role column exists
    db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) {
            console.error('Error checking table:', err);
            return;
        }
        
        const hasRole = rows.some(row => row.name === 'role');
        
        if (!hasRole) {
            console.log('Role column not found. Adding it now...');
            
            // Add role column with default value 'patient'
            db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'patient'", (err) => {
                if (err) {
                    console.error('Failed to add role column:', err);
                } else {
                    console.log('✅ Role column added successfully!');
                    
                    // Update existing users to have 'patient' role
                    db.run("UPDATE users SET role = 'patient' WHERE role IS NULL", (err) => {
                        if (err) {
                            console.error('Failed to update existing users:', err);
                        } else {
                            console.log('✅ Existing users updated with patient role');
                        }
                    });
                }
            });
        } else {
            console.log('✅ Role column already exists');
        }
    });
});

// Close database after 1 second
setTimeout(() => {
    db.close();
    console.log('Database connection closed');
}, 1000);