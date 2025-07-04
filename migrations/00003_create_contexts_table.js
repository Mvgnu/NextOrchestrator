exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('contexts', {
    id: 'id',
    project_id: {
      type: 'uuid',
      notNull: true,
      references: 'projects',
      onDelete: 'cascade',
    },
    user_id: { type: 'uuid', notNull: true },
    name: { type: 'varchar(255)', notNull: true },
    content: { type: 'text' },
    digest: { type: 'text' },
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
  pgm.createTrigger('contexts', 'update_contexts_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    level: 'ROW',
    function: 'trigger_set_timestamp',
  });
};

exports.down = pgm => {
  pgm.dropTrigger('contexts', 'update_contexts_updated_at', { ifExists: true });
  pgm.dropTable('contexts');
}; 