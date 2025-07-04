const fs = require('fs');
const path = require('path');

// Read migration SQL file
const migrationPath = path.join(__dirname, '../supabase/migrations/0001_add_password_auth.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log('=== SUPABASE SQL MIGRATION COMMANDS ===');
console.log('Copy the SQL below and execute in your Supabase SQL Editor:');
console.log('===========================================');
console.log(sql);
console.log('===========================================');
console.log('After executing the SQL, you can test the authentication by creating a new user at /auth/signup'); 