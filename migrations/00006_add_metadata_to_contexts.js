exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('contexts', {
    metadata: { type: 'jsonb', notNull: false }
  });
  pgm.createIndex('contexts', 'metadata', { method: 'gin' }); // GIN index for jsonb
};

exports.down = (pgm) => {
  pgm.dropIndex('contexts', 'metadata', { method: 'gin' });
  pgm.dropColumn('contexts', 'metadata');
}; 