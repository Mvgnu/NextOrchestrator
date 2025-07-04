exports.shorthands = undefined;

exports.up = pgm => {
  // console.log('Migration 00008_add_project_id_to_agents: SKIPPED - Placeholder for already applied migration.');
  console.log('Migration 00008_add_project_id_to_agents: Adding project_id to agents table...');
  pgm.addColumn('agents', {
    project_id: {
      type: 'uuid',
      notNull: true, // Assuming an agent must belong to a project
      references: 'projects',
      onDelete: 'CASCADE' // Optional: if an agent should be deleted when its project is deleted
    }
  });
  pgm.createIndex('agents', 'project_id');
  console.log('Migration 00008_add_project_id_to_agents: project_id column and index added.');
};

exports.down = pgm => {
  // console.log('Migration 00008_add_project_id_to_agents (down): SKIPPED - Placeholder.');
  console.log('Migration 00008_add_project_id_to_agents (down): Removing project_id from agents table...');
  pgm.dropIndex('agents', 'project_id');
  pgm.dropColumn('agents', 'project_id');
  console.log('Migration 00008_add_project_id_to_agents (down): project_id column and index removed.');
}; 