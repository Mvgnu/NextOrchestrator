exports.shorthands = undefined;

exports.up = pgm => {
  // Users table
  pgm.createTable('users', {
    id: 'id', //SERIAL PRIMARY KEY
    name: { type: 'varchar(255)' },
    email: { type: 'varchar(255)' },
    "emailVerified": { type: 'timestamptz' },
    image: { type: 'text' },
  });
  pgm.createIndex('users', 'email', { unique: true }); // Ensure email is unique

  // Accounts table
  pgm.createTable('accounts', {
    id: 'id', //SERIAL PRIMARY KEY
    "userId": { 
      type: 'integer', 
      notNull: true,
      references: 'users', 
      onDelete: 'CASCADE' 
    },
    type: { type: 'varchar(255)', notNull: true },
    provider: { type: 'varchar(255)', notNull: true },
    "providerAccountId": { type: 'varchar(255)', notNull: true },
    refresh_token: { type: 'text' },
    access_token: { type: 'text' },
    expires_at: { type: 'bigint' },
    id_token: { type: 'text' },
    scope: { type: 'text' },
    session_state: { type: 'text' },
    token_type: { type: 'text' },
  });
  pgm.createIndex('accounts', '"userId"');
  pgm.createIndex('accounts', ['provider', '"providerAccountId"'], { unique: true });

  // Sessions table
  pgm.createTable('sessions', {
    id: 'id', //SERIAL PRIMARY KEY
    "userId": { 
      type: 'integer', 
      notNull: true,
      references: 'users', 
      onDelete: 'CASCADE' 
    },
    expires: { type: 'timestamptz', notNull: true },
    "sessionToken": { type: 'varchar(255)', notNull: true },
  });
  pgm.createIndex('sessions', '"sessionToken"', { unique: true });
  pgm.createIndex('sessions', '"userId"');

  // Verification_token table
  pgm.createTable('verification_token', {
    identifier: { type: 'text', notNull: true },
    expires: { type: 'timestamptz', notNull: true },
    token: { type: 'text', notNull: true },
  }, {
    constraints: {
      primaryKey: ['identifier', 'token']
    }
  });
  pgm.createIndex('verification_token', 'token', { unique: true }); // Ensure token is unique
};

exports.down = pgm => {
  pgm.dropTable('verification_token');
  pgm.dropTable('sessions');
  pgm.dropTable('accounts');
  pgm.dropTable('users');
}; 