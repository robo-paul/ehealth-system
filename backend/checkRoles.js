// backend/checkRoles.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ehealth.db');

db.all("SELECT * FROM roles", [], (err, roles) => {
    if (err) {
        console.error('Error:', err);
    } else if (roles.length === 0) {
        console.log('No roles found. Please run the seed script.');
    } else {
        console.log('Roles found:');
        console.table(roles);
    }
    db.close();
});