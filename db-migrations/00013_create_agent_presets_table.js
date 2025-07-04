exports.up = pgm => {
  pgm.createTable('agent_presets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text', notNull: true },
    base_prompt: { type: 'text', notNull: true },
    category: { type: 'varchar(100)', notNull: true }, // e.g., 'writing', 'coding', 'research'
    recommended_model: { type: 'varchar(100)', notNull: true },
    recommended_provider: { type: 'varchar(100)', notNull: true },
    icon: { type: 'varchar(255)', notNull: true }, // e.g., emoji or icon name
    temperature: { type: 'real', default: 0.5 }, // 'real' for floating point
    memory_toggle: { type: 'boolean', default: false },
    tone: { type: 'varchar(50)', default: 'neutral' },
    tags: { type: 'jsonb', default: '[]' }, // Array of strings
    is_system: { type: 'boolean', default: false, notNull: true },
    user_id: { type: 'uuid', references: 'users', onDelete: 'SET NULL' }, // Nullable for system presets
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });
  pgm.createIndex('agent_presets', 'user_id');
  pgm.createIndex('agent_presets', 'is_system');
  pgm.createIndex('agent_presets', 'category');
};

exports.down = pgm => {
  pgm.dropTable('agent_presets');
}; 