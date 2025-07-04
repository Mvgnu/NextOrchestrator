exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumn('contexts', {
    metadata: { 
      type: 'jsonb',
      nullable: true 
    }
  });
  // Optionally, add a GIN index for metadata if you query it frequently
  pgm.createIndex('contexts', 'metadata', { method: 'gin' }); 
};

exports.down = pgm => {
  pgm.dropIndex('contexts', 'metadata', { method: 'gin' }); // Drop index first if it exists
  pgm.dropColumn('contexts', 'metadata');
}; 