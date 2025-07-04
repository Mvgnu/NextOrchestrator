exports.shorthands = undefined;

exports.up = pgm => {
  console.log('Migration 00013_create_agent_presets_table: Creating agent_presets table...');
  pgm.createTable('agent_presets', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true, unique: true }, // Presets probably unique by name for a user?
    description: { type: 'text' },
    base_prompt: { type: 'text' },
    temperature: { type: 'real' }, // Or float, double precision
    recommended_provider: { type: 'varchar(100)' },
    recommended_model: { type: 'varchar(100)' },
    icon: { type: 'varchar(50)', notNull: false }, // Added from interface, assuming varchar
    category: { type: 'varchar(50)', notNull: false }, // Added from interface
    memory_toggle: { type: 'boolean', default: false, notNull: false }, // Added from interface
    tone: { type: 'varchar(50)', notNull: false }, // Added from interface
    tags: { type: 'jsonb', notNull: false }, // Added from interface
    is_system: { type: 'boolean', notNull: true, default: false }, // Added column
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('agent_presets', 'user_id');
  pgm.createIndex('agent_presets', 'is_system'); // Index for is_system
  pgm.createTrigger('agent_presets', 'update_agent_presets_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'trigger_set_timestamp'
  });
  console.log('Migration 00013_create_agent_presets_table: agent_presets table created.');
};

exports.down = pgm => {
  console.log('Migration 00013_create_agent_presets_table (down): Dropping agent_presets table...');
  pgm.dropTrigger('agent_presets', 'update_agent_presets_updated_at', { ifExists: true });
  pgm.dropTable('agent_presets');
  console.log('Migration 00013_create_agent_presets_table (down): agent_presets table dropped.');
}; 