exports.shorthands = undefined;

exports.up = pgm => {
  console.log("Migration 00014: Adding password_hash to users table...");
  pgm.addColumn('users', {
    password_hash: { type: 'text', notNull: false } // Nullable for OAuth users
  });
  console.log("Migration 00014: password_hash column added to users table.");
};

exports.down = pgm => {
  console.log("Migration 00014 (down): Removing password_hash from users table...");
  pgm.dropColumn('users', 'password_hash');
  console.log("Migration 00014 (down): password_hash column removed from users table.");
}; 