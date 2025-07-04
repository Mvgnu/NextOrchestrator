exports.shorthands = undefined;

exports.up = pgm => {
  console.log('Migration 00007_add_password_hash_to_users: SKIPPED - Placeholder for already applied migration.');
};

exports.down = pgm => {
  console.log('Migration 00007_add_password_hash_to_users (down): SKIPPED - Placeholder.');
}; 