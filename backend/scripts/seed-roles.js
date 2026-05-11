// backend/scripts/seed-roles.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ehealth.db');

const roles = [
    {
        name: 'patient',
        description: 'Regular patient with basic access',
        permissions: [
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
        ]
    },
    {
        name: 'doctor',
        description: 'Medical doctor',
        permissions: [
            'view_patient_records',
            'create_patient_records',
            'update_patient_records',
            'view_all_appointments',
            'manage_appointments',
            'create_prescriptions',
            'update_prescriptions',
            'view_all_prescriptions',
            'view_patient_list',
            'view_department_stats',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'nurse',
        description: 'Nursing staff',
        permissions: [
            'view_patient_records',
            'update_patient_vitals',
            'view_appointments',
            'assist_in_appointments',
            'view_prescriptions',
            'view_patient_list',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'diagnostic_staff',
        description: 'Laboratory and imaging staff',
        permissions: [
            'view_lab_requests',
            'update_lab_results',
            'view_imaging_requests',
            'update_imaging_results',
            'view_patient_demographics',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'therapeutic_staff',
        description: 'Physiotherapy, occupational therapy, etc.',
        permissions: [
            'view_therapy_requests',
            'create_therapy_plans',
            'update_therapy_plans',
            'view_patient_therapy_history',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'pharmacist',
        description: 'Pharmacy staff',
        permissions: [
            'view_prescriptions',
            'dispense_medication',
            'update_prescription_status',
            'manage_inventory',
            'view_patient_allergies',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'receptionist',
        description: 'Front desk staff',
        permissions: [
            'register_patients',
            'schedule_appointments',
            'view_patient_demographics',
            'update_patient_demographics',
            'manage_payments',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'billing_officer',
        description: 'Billing and finance staff',
        permissions: [
            'view_invoices',
            'create_invoices',
            'process_payments',
            'view_insurance_claims',
            'submit_claims',
            'view_financial_reports',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'ict_admin',
        description: 'IT support and system administrator',
        permissions: [
            'manage_users',
            'manage_roles',
            'view_audit_logs',
            'manage_system_settings',
            'backup_database',
            'restore_database',
            'view_all_data',
            'manage_permissions',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'hr_admin',
        description: 'Human resources administrator',
        permissions: [
            'manage_staff',
            'view_staff_records',
            'update_staff_records',
            'manage_departments',
            'view_attendance',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'department_head',
        description: 'Department head/manager',
        permissions: [
            'view_department_stats',
            'view_department_staff',
            'manage_department_schedules',
            'approve_leave_requests',
            'view_department_reports',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'lab_technician',
        description: 'Laboratory technician',
        permissions: [
            'view_lab_requests',
            'perform_lab_tests',
            'record_test_results',
            'view_test_history',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'radiologist',
        description: 'Radiology specialist',
        permissions: [
            'view_imaging_requests',
            'perform_imaging',
            'interpret_images',
            'write_imaging_reports',
            'view_imaging_history',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'physiotherapist',
        description: 'Physical therapy specialist',
        permissions: [
            'view_therapy_requests',
            'create_therapy_plans',
            'update_therapy_plans',
            'schedule_therapy_sessions',
            'record_therapy_notes',
            'view_therapy_history',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    },
    {
        name: 'nutritionist',
        description: 'Dietary and nutrition specialist',
        permissions: [
            'view_patient_health_records',
            'create_diet_plans',
            'update_diet_plans',
            'view_nutrition_history',
            'view_own_profile',
            'update_own_profile',
            'change_own_password'
        ]
    }
];

console.log('🌱 Seeding roles...');

roles.forEach(role => {
    db.run(
        'INSERT OR IGNORE INTO roles (name, description, permissions) VALUES (?, ?, ?)',
        [role.name, role.description, JSON.stringify(role.permissions)],
        function(err) {
            if (err) {
                console.error(`Error inserting role ${role.name}:`, err);
            } else if (this.changes > 0) {
                console.log(`✅ Inserted role: ${role.name}`);
            } else {
                console.log(`⏭️  Role already exists: ${role.name}`);
            }
        }
    );
});

setTimeout(() => {
    db.close();
    console.log('✅ Role seeding complete!');
}, 2000);