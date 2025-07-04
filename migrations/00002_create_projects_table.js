exports.shorthands = undefined;

exports.up = async (pgm) => {
  // Ensure uuid-ossp extension is available if using uuid_generate_v4()
  await pgm.db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  pgm.createTable('projects', {
    id: {
      type: 'uuid',
      default: pgm.func('uuid_generate_v4()'),
      primaryKey: true,
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  // A common trigger function for setting updated_at
  // This function would need to be created in a separate, earlier migration or manually in the DB
  // CREATE OR REPLACE FUNCTION trigger_set_timestamp()
  // RETURNS TRIGGER AS $$
  // BEGIN
  //   NEW.updated_at = NOW();
  //   RETURN NEW;
  // END;
  // $$ LANGUAGE plpgsql;
  pgm.createTrigger('projects', 'update_projects_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'trigger_set_timestamp', 
  });
};

exports.down = pgm => {
  pgm.dropTrigger('projects', 'update_projects_updated_at', { ifExists: true });
  pgm.dropTable('projects');
  // Optionally drop the extension if it's certain no other table uses it:
  // pgm.db.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
}; 