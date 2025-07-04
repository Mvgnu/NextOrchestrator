exports.up = pgm => {
  pgm.createTable('agent_ratings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    agent_id: { type: 'uuid', notNull: true, references: 'agents', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' }, // User who gave the rating
    rating: { type: 'integer', notNull: true }, // e.g., 1-5 stars
    // interaction_id: { type: 'uuid', references: 'api_usage', onDelete: 'SET NULL' }, // Optional: link to a specific API usage record
    comment: { type: 'text' }, // Optional: user comment with the rating
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
    // No updated_at for ratings, they are typically immutable points in time.
  });
  pgm.createIndex('agent_ratings', 'agent_id');
  pgm.createIndex('agent_ratings', 'user_id');
  pgm.createIndex('agent_ratings', ['agent_id', 'user_id']); // For quick lookups of user's rating for an agent
  pgm.addConstraint('agent_ratings', 'rating_check', 'CHECK (rating >= 1 AND rating <= 5)'); // Assuming 1-5 rating scale
};

exports.down = pgm => {
  pgm.dropTable('agent_ratings');
}; 