exports.shorthands = undefined;

exports.up = pgm => {
  pgm.createTable('versions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: { // Name or tag for the version itself, e.g., "v1.0", "Draft for review"
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      nullable: true,
    },
    content_id: { // ID of the item being versioned (e.g., context_id, agent_id)
      type: 'uuid', // Assuming versioned items have UUID IDs
      notNull: true,
    },
    content_type: { // Type of item being versioned, e.g., 'context', 'agent', 'project'
      type: 'varchar(100)',
      notNull: true,
    },
    content_snapshot: { // The actual data snapshot of the versioned item
      type: 'jsonb',
      notNull: true,
    },
    metadata: { // Additional metadata for the version itself
      type: 'jsonb',
      nullable: true,
    },
    project_id: { // If versions are scoped under a project
      type: 'uuid',
      nullable: true, // May not always apply, or could reference projects.id
      // references: 'projects(id)', // Optional: if you want a direct FK to projects
      // onDelete: 'SET NULL' 
    },
    user_id: { // User who created this version or owns the content
      type: 'text',
      nullable: true, // Depending on ownership model for versions
    },
    is_current: {
      type: 'boolean',
      default: false,
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    // updated_at is not typically on versions unless the version entry itself is mutable beyond is_current flag
  });

  // Indexes for common query patterns
  pgm.createIndex('versions', ['content_id', 'content_type']); // For finding versions of a specific item
  pgm.createIndex('versions', ['content_id', 'content_type', 'is_current']); // For finding the current version
  pgm.createIndex('versions', 'project_id');
  pgm.createIndex('versions', 'user_id');
};

exports.down = pgm => {
  pgm.dropTable('versions');
}; 