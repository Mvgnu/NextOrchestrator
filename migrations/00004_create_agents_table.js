exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('agents', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: { type: 'uuid', notNull: true },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    system_prompt: { type: 'text' },
    config: { type: 'jsonb' },
    is_public: { type: 'boolean', default: false },
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
  pgm.createTrigger('agents', 'update_agents_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'trigger_set_timestamp',
  });
};

exports.down = pgm => {
  pgm.dropTrigger('agents', 'update_agents_updated_at', { ifExists: true });
  pgm.dropTable('agents');
}; 