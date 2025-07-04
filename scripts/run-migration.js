require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to add columns to tables
async function updateSchema() {
  try {
    console.log('Updating database schema...');

    // Check if 'users' table exists
    console.log('Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.error('Error accessing users table:', usersError);
      return;
    }

    console.log('Users table exists, checking for password_hash column...');
    
    // Check if user has password_hash column
    let passwordHashExists = false;
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .limit(1);
      
      if (!userError) {
        passwordHashExists = true;
        console.log('password_hash column already exists');
      } else {
        console.log('Need to add password_hash column');
      }
    } catch (e) {
      console.log('Error checking for password_hash column, will attempt to add it');
    }

    console.log('Printing SQL migration instructions...');
    console.log('Please execute the following SQL in your Supabase SQL Editor:');
    console.log('\n----------------------------------\n');
    
    // Read migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/0001_add_password_auth.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(sql);
    
    console.log('\n----------------------------------\n');
    console.log('After executing the SQL, you can test the authentication by creating a new user at /auth/signup');
    
  } catch (error) {
    console.error('Failed to update schema:', error);
  }
}

updateSchema(); 