// backend/recreateStaffDetails.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ehealth.db');

console.log('🔄 Recreating staff_details table...');

// Drop and recreate staff_details table
db.run(`DROP TABLE IF EXISTS staff_details`, (err) => {
    if (err) {
        console.error('Error dropping table:', err);
    } else {
        console.log('✓ Dropped old staff_details table');
        
        // Recreate with correct schema
        db.run(`
            CREATE TABLE staff_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                staff_id TEXT UNIQUE,
                full_name TEXT,
                date_of_birth TEXT,
                gender TEXT,
                address TEXT,
                blood_type TEXT,
                allergies TEXT,
                department TEXT,
                specialization TEXT,
                qualification TEXT,
                license_number TEXT,
                years_of_experience INTEGER,
                contact_number TEXT,
                emergency_contact TEXT,
                employment_date DATE,
                status TEXT DEFAULT 'active',
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                console.log('✅ staff_details table recreated successfully');
            }
            db.close();
        });
    }
});