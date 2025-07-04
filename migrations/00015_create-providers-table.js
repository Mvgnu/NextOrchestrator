exports.shorthands = undefined;

exports.up = pgm => {
  console.log('Migration 1747600405113_create-providers-table: Creating providers table...');
  pgm.createTable('providers', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true, unique: true },
    // api_key_env_var: { type: 'varchar(100)' }, // Store API keys securely, not directly in DB usually
    // base_url: { type: 'varchar(255)' },
    // For now, keep it simple. Specifics can be added later or managed elsewhere.
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createTrigger('providers', 'update_providers_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'trigger_set_timestamp'
  });
  console.log('Migration 1747600405113_create-providers-table: providers table created.');
};

exports.down = pgm => {
  console.log('Migration 1747600405113_create-providers-table (down): Dropping providers table...');
  pgm.dropTrigger('providers', 'update_providers_updated_at', { ifExists: true });
  pgm.dropTable('providers');
  console.log('Migration 1747600405113_create-providers-table (down): providers table dropped.');
}; 