// backend/seedRoles.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./ehealth.db');

const defaultRoles = [
    {
        name: 'master_admin',
        description: 'Master Administrator - Full system access with all permissions',
        permissions: JSON.stringify(['*'])
    },
    {
        name: 'patient',
        description: 'Patient - Can view own health records, appointments, and prescriptions',
        permissions: JSON.stringify([
            'view_own_records',
            'create_own_records',
            'update_own_records',
            'view_own_appointments',
            'create_appointments',
            'cancel_appointments',
            'view_own_prescriptions',
            'request_refills',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ])
    },
    {
        name: 'doctor',
        description: 'Doctor - Can manage patient records, create prescriptions, and manage appointments',
        permissions: JSON.stringify([
            'view_patient_records',
            'create_patient_records',
            'update_patient_records',
            'view_all_appointments',
            'manage_appointments',
            'view_patient_list',
            'create_prescriptions',
            'update_prescriptions',
            'view_all_prescriptions',
            'update_patient_vitals'
        ])
    },
    {
        name: 'nurse',
        description: 'Nurse - Can assist in appointments and update patient vitals',
        permissions: JSON.stringify([
            'view_patient_records',
            'view_all_appointments',
            'manage_appointments',
            'view_patient_list',
            'update_patient_vitals',
            'assist_in_appointments'
        ])
    },
    {
        name: 'receptionist',
        description: 'Receptionist - Can register patients and manage appointments',
        permissions: JSON.stringify([
            'register_patients',
            'schedule_appointments',
            'update_patient_demographics',
            'view_patient_list',
            'view_all_appointments',
            'manage_appointments'
        ])
    },
    {
        name: 'pharmacist',
        description: 'Pharmacist - Can dispense medications and manage prescriptions',
        permissions: JSON.stringify([
            'dispense_medication',
            'update_prescription_status',
            'manage_inventory',
            'view_patient_allergies',
            'view_prescriptions'
        ])
    },
    {
        name: 'lab_technician',
        description: 'Lab Technician - Can perform lab tests and update results',
        permissions: JSON.stringify([
            'view_lab_requests',
            'update_lab_results',
            'perform_lab_tests',
            'record_test_results',
            'view_patient_basic_info'
        ])
    },
    {
        name: 'radiologist',
        description: 'Radiologist - Can perform imaging and interpret results',
        permissions: JSON.stringify([
            'view_imaging_requests',
            'update_imaging_results',
            'perform_imaging',
            'interpret_images',
            'write_imaging_reports',
            'view_patient_basic_info'
        ])
    },
    {
        name: 'diagnostic_staff',
        description: 'Diagnostic Staff - Can perform diagnostic tests',
        permissions: JSON.stringify([
            'view_diagnostic_requests',
            'perform_diagnostic_tests',
            'record_test_results',
            'view_patient_basic_info'
        ])
    },
    {
        name: 'therapeutic_staff',
        description: 'Therapeutic Staff - Can create and manage therapy plans',
        permissions: JSON.stringify([
            'view_therapy_requests',
            'create_therapy_plans',
            'update_therapy_plans',
            'schedule_therapy_sessions',
            'record_therapy_notes',
            'view_therapy_history'
        ])
    },
    {
        name: 'physiotherapist',
        description: 'Physiotherapist - Can create and manage physiotherapy plans',
        permissions: JSON.stringify([
            'view_therapy_requests',
            'create_therapy_plans',
            'update_therapy_plans',
            'schedule_therapy_sessions',
            'record_therapy_notes',
            'view_therapy_history'
        ])
    },
    {
        name: 'nutritionist',
        description: 'Nutritionist - Can create diet plans and provide nutritional advice',
        permissions: JSON.stringify([
            'view_patient_records',
            'create_diet_plans',
            'update_diet_plans',
            'view_nutrition_history'
        ])
    },
    {
        name: 'billing_officer',
        description: 'Billing Officer - Can manage payments and invoices',
        permissions: JSON.stringify([
            'manage_payments',
            'view_invoices',
            'create_invoices',
            'process_payments',
            'view_insurance_claims',
            'submit_claims',
            'view_financial_reports'
        ])
    },
    {
        name: 'ict_admin',
        description: 'ICT Administrator - Can manage system settings and users',
        permissions: JSON.stringify([
            'manage_staff',
            'manage_users',
            'manage_roles',
            'view_audit_logs',
            'manage_system_settings',
            'backup_database',
            'restore_database',
            'view_all_data'
        ])
    },
    {
        name: 'hr_admin',
        description: 'HR Administrator - Can manage staff and department schedules',
        permissions: JSON.stringify([
            'manage_staff',
            'view_department_stats',
            'manage_department_schedules',
            'approve_leave_requests',
            'view_department_reports'
        ])
    },
    {
        name: 'department_head',
        description: 'Department Head - Can manage department operations and reports',
        permissions: JSON.stringify([
            'view_department_stats',
            'manage_department_schedules',
            'approve_leave_requests',
            'view_department_reports',
            'manage_staff'
        ])
    }
];

async function seedRoles() {
    console.log('🌱 Seeding default roles...');
    
    for (const role of defaultRoles) {
        db.run(
            `INSERT OR REPLACE INTO roles (name, description, permissions, created_at) 
             VALUES (?, ?, ?, datetime('now'))`,
            [role.name, role.description, role.permissions],
            function(err) {
                if (err) {
                    console.error(`❌ Failed to insert role ${role.name}:`, err.message);
                } else {
                    console.log(`✅ Role '${role.name}' inserted successfully`);
                }
            }
        );
    }
    
    // Wait a bit for all inserts to complete
    setTimeout(() => {
        console.log('🎉 Role seeding completed!');
        db.close();
    }, 2000);
}

// Check if roles table exists and has data
db.get("SELECT COUNT(*) as count FROM roles", (err, result) => {
    if (err) {
        console.error('Error checking roles table:', err.message);
        console.log('Creating roles table if not exists...');
        db.run(`CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            permissions TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            seedRoles();
        });
    } else if (result.count === 0) {
        console.log('No roles found. Seeding default roles...');
        seedRoles();
    } else {
        console.log(`✅ Found ${result.count} existing roles. No seeding needed.`);
        db.close();
    }
});