exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  console.log("Migration 00001_create_auth_tables: Creating Auth tables...");

  // Users table
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    name: { type: 'text', notNull: false },
    email: { type: 'text', notNull: false, unique: true }, // Made notNull: false to align with some providers not returning it initially
    emailVerified: { type: 'timestamptz', notNull: false },
    image: { type: 'text', notNull: false },
  });

  // Accounts table
  pgm.createTable('accounts', {
    id: 'id', // SERIAL PRIMARY KEY
    userId: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    type: { type: 'text', notNull: true },
    provider: { type: 'text', notNull: true },
    providerAccountId: { type: 'text', notNull: true },
    refresh_token: { type: 'text' },
    access_token: { type: 'text' },
    expires_at: { type: 'bigint' }, // Changed from integer to bigint for flexibility
    token_type: { type: 'text' },
    scope: { type: 'text' },
    id_token: { type: 'text' },
    session_state: { type: 'text' },
  });
  pgm.addConstraint('accounts', 'accounts_provider_providerAccountId_unique', {
    unique: ['provider', 'providerAccountId'],
  });


  // Sessions table
  pgm.createTable('sessions', {
    id: 'id', // SERIAL PRIMARY KEY
    sessionToken: { type: 'text', notNull: true, unique: true },
    userId: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    expires: { type: 'timestamptz', notNull: true },
  });

  // VerificationTokens table
  pgm.createTable('verification_tokens', {
    identifier: { type: 'text', notNull: true },
    token: { type: 'text', notNull: true, unique: true },
    expires: { type: 'timestamptz', notNull: true },
  });
  pgm.addConstraint('verification_tokens', 'verification_tokens_identifier_token_pk', {
    primaryKey: ['identifier', 'token'],
  });

  console.log("Migration 00001_create_auth_tables: Auth tables created.");
};

exports.down = async (pgm) => {
  console.log("Migration 00006_create_auth_tables (down): Dropping Auth tables...");
  pgm.dropTable('verification_tokens');
  pgm.dropTable('sessions');
  pgm.dropTable('accounts');
  pgm.dropTable('users');
  console.log("Migration 00006_create_auth_tables (down): Auth tables dropped.");
}; 