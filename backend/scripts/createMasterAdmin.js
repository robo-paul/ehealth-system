// backend/scripts/createMasterAdmin.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '../ehealth.db');
const db = new sqlite3.Database(dbPath);

const MASTER_ADMIN = {
    username: 'masteradmin',
    password: 'MasterAdmin@2024',
    email: 'admin@ehealth.com',
    role: 'master_admin',
    verification_status: 'approved',
    is_immutable: 1
};

async function addImmutableColumn() {
    return new Promise((resolve, reject) => {
        // Check if column exists
        db.all("PRAGMA table_info(users)", (err, columns) => {
            if (err) {
                reject(err);
                return;
            }
            
            const hasImmutableColumn = columns.some(col => col.name === 'is_immutable');
            
            if (!hasImmutableColumn) {
                console.log('Adding is_immutable column...');
                db.run("ALTER TABLE users ADD COLUMN is_immutable INTEGER DEFAULT 0", (alterErr) => {
                    if (alterErr) {
                        reject(alterErr);
                    } else {
                        console.log('✅ Added is_immutable column');
                        resolve();
                    }
                });
            } else {
                console.log('✅ is_immutable column already exists');
                resolve();
            }
        });
    });
}

async function createMasterAdmin() {
    return new Promise((resolve, reject) => {
        // First, add the column if needed, then check for existing admin
        addImmutableColumn()
            .then(() => {
                // Now check if master admin exists (without selecting is_immutable yet)
                db.get(
                    'SELECT id, username FROM users WHERE username = ?',
                    [MASTER_ADMIN.username],
                    async (err, existingUser) => {
                        if (err) {
                            console.error('Database error:', err);
                            reject(err);
                            return;
                        }
                        
                        if (existingUser) {
                            console.log(`⚠️ Master admin '${MASTER_ADMIN.username}' already exists.`);
                            
                            // Make sure it's immutable
                            db.run(
                                'UPDATE users SET is_immutable = 1 WHERE username = ?',
                                [MASTER_ADMIN.username],
                                (updateErr) => {
                                    if (updateErr) {
                                        console.error('Failed to update immutable flag:', updateErr);
                                        reject(updateErr);
                                    } else {
                                        console.log('✅ Updated master admin to immutable');
                                        resolve();
                                    }
                                }
                            );
                            return;
                        }
                        
                        // Hash password
                        const hash = await bcrypt.hash(MASTER_ADMIN.password, 10);
                        
                        // Create immutable master admin
                        db.run(
                            `INSERT INTO users (
                                username, 
                                password_hash, 
                                email, 
                                role, 
                                verification_status, 
                                is_immutable,
                                health_record_id,
                                status,
                                created_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                            [
                                MASTER_ADMIN.username,
                                hash,
                                MASTER_ADMIN.email,
                                MASTER_ADMIN.role,
                                MASTER_ADMIN.verification_status,
                                MASTER_ADMIN.is_immutable,
                                `HR-ADMIN-${Date.now()}`,
                                'active'
                            ],
                            function(err) {
                                if (err) {
                                    console.error('Failed to create master admin:', err);
                                    reject(err);
                                } else {
                                    console.log('\n✅ Immutable Master Admin created successfully!');
                                    console.log('=========================================');
                                    console.log(`   Username: ${MASTER_ADMIN.username}`);
                                    console.log(`   Password: ${MASTER_ADMIN.password}`);
                                    console.log(`   ID: ${this.lastID}`);
                                    console.log(`   Immutable: Yes`);
                                    console.log('=========================================\n');
                                    resolve();
                                }
                            }
                        );
                    }
                );
            })
            .catch(reject);
    });
}

// Run the script
createMasterAdmin()
    .then(() => {
        console.log('✓ Master admin setup complete');
        db.close();
    })
    .catch((error) => {
        console.error('✗ Error:', error);
        db.close();
        process.exit(1);
    });