exports.shorthands = undefined;

exports.up = pgm => {
  console.log('Migration 1747600435504_create-models-table: Creating models table...');
  pgm.createTable('models', {
    id: 'id',
    provider_id: { type: 'integer', notNull: true, references: 'providers', onDelete: 'CASCADE' },
    model_id_on_provider: { type: 'varchar(255)', notNull: true }, // e.g., 'gpt-4o', 'claude-3-opus-20240229'
    display_name: { type: 'varchar(255)', notNull: true },     // e.g., 'GPT-4 Omni', 'Claude 3 Opus'
    // Add other model-specific attributes like context_window, knowledge_cutoff_date, etc. as needed later
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });
  pgm.createIndex('models', 'provider_id');
  pgm.createIndex('models', ['provider_id', 'model_id_on_provider'], { unique: true }); // A model should be unique per provider
  pgm.createTrigger('models', 'update_models_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'trigger_set_timestamp'
  });
  console.log('Migration 1747600435504_create-models-table: models table created.');
};

exports.down = pgm => {
  console.log('Migration 1747600435504_create-models-table (down): Dropping models table...');
  pgm.dropTrigger('models', 'update_models_updated_at', { ifExists: true });
  pgm.dropTable('models');
  console.log('Migration 1747600435504_create-models-table (down): models table dropped.');
}; 