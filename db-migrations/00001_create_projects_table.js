exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('projects', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'), // Requires PostgreSQL 13+ or pgcrypto extension for gen_random_uuid()
    },
    user_id: {
      type: 'text', // Assuming user_id is a string (e.g., from NextAuth)
      notNull: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = pgm => {
  pgm.dropTable('projects');
}; 