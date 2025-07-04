exports.up = pgm => {
  pgm.createTable('api_usage', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    project_id: { type: 'uuid', references: 'projects', onDelete: 'SET NULL' }, // Nullable
    agent_id: { type: 'uuid', references: 'agents', onDelete: 'SET NULL' }, // Nullable
    provider: { type: 'varchar(255)', notNull: true },
    model: { type: 'varchar(255)', notNull: true },
    action: { type: 'varchar(255)' }, // e.g., 'chat_completion', 'digest'
    tokens_prompt: { type: 'integer', notNull: true, default: 0 },
    tokens_completion: { type: 'integer', notNull: true, default: 0 },
    tokens_total: { type: 'integer', notNull: true, default: 0 },
    // cost: { type: 'numeric(10, 5)' }, // Cost is calculated on the fly by the service for now
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: { // Though usage records are typically immutable, having updated_at is a good practice
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });
  pgm.createIndex('api_usage', 'user_id');
  pgm.createIndex('api_usage', 'project_id');
  pgm.createIndex('api_usage', 'agent_id');
  pgm.createIndex('api_usage', 'created_at');
};

exports.down = pgm => {
  pgm.dropTable('api_usage');
}; 