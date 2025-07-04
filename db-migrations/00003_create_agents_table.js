exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('agents', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: { // Assuming user_id is a string (e.g., from NextAuth)
      type: 'text',
      notNull: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    system_prompt: {
      type: 'text',
    },
    config: { // For model parameters, temperature, max_tokens etc.
      type: 'jsonb',
      nullable: true,
    },
    is_public: {
      type: 'boolean',
      default: false,
      notNull: true,
    },
    // We might want to link agents to projects or contexts later through join tables
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
  // Index on user_id for fetching user-specific agents
  pgm.createIndex('agents', 'user_id');
  // Index on is_public for fetching public agents
  pgm.createIndex('agents', 'is_public');
};

exports.down = pgm => {
  pgm.dropTable('agents');
}; 