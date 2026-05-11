// backend/migrations/addInvoiceColumns.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to your database
const db = new sqlite3.Database(path.join(__dirname, '../ehealth.db'));

console.log('🔧 Starting database migration...');

// Run migrations in sequence
db.serialize(() => {
    // Check if paid_amount column exists in invoices table
    db.get("PRAGMA table_info(invoices)", (err, columns) => {
        if (err) {
            console.error('Error checking invoices table:', err.message);
            return;
        }
        
        // Since PRAGMA returns multiple rows, we need to check differently
        db.all("PRAGMA table_info(invoices)", (err, rows) => {
            if (err) {
                console.error('Error checking invoices table:', err.message);
                return;
            }
            
            const hasPaidAmount = rows.some(row => row.name === 'paid_amount');
            
            if (!hasPaidAmount) {
                console.log('📝 Adding paid_amount column to invoices table...');
                db.run(`ALTER TABLE invoices ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0`, (err) => {
                    if (err) {
                        console.error('❌ Failed to add paid_amount column:', err.message);
                    } else {
                        console.log('✅ paid_amount column added successfully');
                    }
                });
            } else {
                console.log('✓ paid_amount column already exists');
            }
        });
    });
    
    // Check if doctor_id column exists in admissions table
    db.all("PRAGMA table_info(admissions)", (err, rows) => {
        if (err) {
            console.error('Error checking admissions table:', err.message);
            return;
        }
        
        const hasDoctorId = rows.some(row => row.name === 'doctor_id');
        
        if (!hasDoctorId) {
            console.log('📝 Adding doctor_id column to admissions table...');
            db.run(`ALTER TABLE admissions ADD COLUMN doctor_id INTEGER REFERENCES users(id)`, (err) => {
                if (err) {
                    console.error('❌ Failed to add doctor_id column:', err.message);
                } else {
                    console.log('✅ doctor_id column added successfully');
                }
            });
        } else {
            console.log('✓ doctor_id column already exists');
        }
    });
});

// Close the database after all operations
setTimeout(() => {
    db.close(() => {
        console.log('📋 Migration completed!');
    });
}, 2000);