exports.up = pgm => {
  pgm.addColumn('agents', {
    project_id: {
      type: 'uuid',
      notNull: true, // Or false if an agent can exist without a project
      references: 'projects',
      onDelete: 'CASCADE' // If a project is deleted, its agents are also deleted
    }
  });
  pgm.createIndex('agents', 'project_id');
};

exports.down = pgm => {
  pgm.dropIndex('agents', 'project_id');
  pgm.dropColumn('agents', 'project_id');
}; 