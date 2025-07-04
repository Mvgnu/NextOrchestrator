exports.up = pgm => {
  pgm.createType('agent_context_role', ['primary', 'auxiliary', 'specialist']);

  pgm.createTable('context_agents', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    context_id: {
      type: 'uuid',
      notNull: true,
      references: 'contexts',
      onDelete: 'CASCADE'
    },
    agent_id: {
      type: 'uuid',
      notNull: true,
      references: 'agents',
      onDelete: 'CASCADE'
    },
    user_id: { // To track who made the assignment, and for permission checks
      type: 'uuid', 
      notNull: true,
      references: 'users', 
      onDelete: 'CASCADE' 
    },
    role: { type: 'agent_context_role', notNull: true },
    priority: { type: 'integer', default: 5 }, // Assuming a default priority
    custom_instructions: { type: 'text' },
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

  // Unique constraint to prevent assigning the same agent to the same context multiple times
  pgm.addConstraint('context_agents', 'context_agents_context_id_agent_id_key', {
    unique: ['context_id', 'agent_id']
  });

  pgm.createIndex('context_agents', 'context_id');
  pgm.createIndex('context_agents', 'agent_id');
  pgm.createIndex('context_agents', 'user_id');
};

exports.down = pgm => {
  pgm.dropTable('context_agents');
  pgm.dropType('agent_context_role');
}; 