exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('contexts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    project_id: {
      type: 'uuid',
      notNull: true,
      references: 'projects(id)',
      onDelete: 'CASCADE', // If a project is deleted, its contexts are also deleted
    },
    user_id: { // To maintain ownership/access consistency with projects
      type: 'text',
      notNull: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    content: {
      type: 'text',
    },
    digest: { // For the AI-generated digest
      type: 'text',
      nullable: true,
    },
    // We can add agent_id later if needed when agents table is created
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
  // Add an index on project_id for faster lookups
  pgm.createIndex('contexts', 'project_id');
  // Add an index on user_id if contexts are often queried directly by user
  pgm.createIndex('contexts', 'user_id');
};

exports.down = pgm => {
  pgm.dropTable('contexts');
}; 