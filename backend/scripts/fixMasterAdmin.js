// backend/scripts/fixMasterAdmin.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

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

async function fixMasterAdmin() {
    console.log('\n🔧 Fixing Master Admin Role...\n');
    
    // First, check if is_immutable column exists
    db.get("PRAGMA table_info(users)", (err, result) => {
        // Add column if needed
        db.run("ALTER TABLE users ADD COLUMN is_immutable INTEGER DEFAULT 0", (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column name')) {
                console.log('Note: Column may already exist');
            }
            
            // Check if user exists
            db.get(
                'SELECT id, username, role FROM users WHERE username = ?',
                [MASTER_ADMIN.username],
                async (err, user) => {
                    if (err) {
                        console.error('Database error:', err);
                        db.close();
                        return;
                    }
                    
                    if (user) {
                        console.log(`✅ User found: ${user.username}`);
                        console.log(`   Current role: ${user.role}`);
                        console.log(`   Target role: ${MASTER_ADMIN.role}`);
                        
                        // Update the role
                        db.run(
                            'UPDATE users SET role = ?, verification_status = ?, is_immutable = ? WHERE username = ?',
                            [MASTER_ADMIN.role, MASTER_ADMIN.verification_status, MASTER_ADMIN.is_immutable, MASTER_ADMIN.username],
                            (updateErr) => {
                                if (updateErr) {
                                    console.error('Failed to update:', updateErr);
                                } else {
                                    console.log('\n✅ Master Admin role updated successfully!');
                                    console.log(`   New role: ${MASTER_ADMIN.role}`);
                                    console.log(`   Immutable: Yes`);
                                    
                                    // Verify the update
                                    db.get(
                                        'SELECT id, username, role, is_immutable FROM users WHERE username = ?',
                                        [MASTER_ADMIN.username],
                                        (verifyErr, verifiedUser) => {
                                            if (!verifyErr && verifiedUser) {
                                                console.log('\n📋 Verification:');
                                                console.log(`   Username: ${verifiedUser.username}`);
                                                console.log(`   Role: ${verifiedUser.role}`);
                                                console.log(`   Immutable: ${verifiedUser.is_immutable === 1 ? 'Yes' : 'No'}`);
                                            }
                                            db.close();
                                        }
                                    );
                                }
                            }
                        );
                    } else {
                        // Create new master admin
                        console.log('Creating new master admin...');
                        const hash = await bcrypt.hash(MASTER_ADMIN.password, 10);
                        
                        db.run(
                            `INSERT INTO users (username, password_hash, email, role, verification_status, is_immutable, health_record_id, status)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
                            function(insertErr) {
                                if (insertErr) {
                                    console.error('Failed to create:', insertErr);
                                } else {
                                    console.log('\n✅ Master Admin created successfully!');
                                    console.log(`   Username: ${MASTER_ADMIN.username}`);
                                    console.log(`   Password: ${MASTER_ADMIN.password}`);
                                    console.log(`   Role: ${MASTER_ADMIN.role}`);
                                }
                                db.close();
                            }
                        );
                    }
                }
            );
        });
    });
}

fixMasterAdmin();