exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('versions', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    content_id: { type: 'uuid', notNull: true }, // Assuming this is a generic UUID foreign key
    content_type: { type: 'varchar(50)', notNull: true }, // e.g., 'context', 'agent_config'
    content_snapshot: { type: 'jsonb', notNull: true },
    metadata: { type: 'jsonb' },
    project_id: { type: 'uuid', notNull: false, references: 'projects', onDelete: 'CASCADE' }, // Changed to UUID, kept nullable
    user_id: { type: 'uuid', notNull: true }, // Will be changed to INTEGER by a later migration
    is_current: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.createIndex('versions', 'content_id');
  pgm.createIndex('versions', 'project_id');
  pgm.createIndex('versions', ['content_id', 'content_type', 'is_current']);
};

exports.down = (pgm) => {
  pgm.dropTable('versions');
}; 