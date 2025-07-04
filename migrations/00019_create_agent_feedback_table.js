exports.up = async (pgm) => {
  await pgm.db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  pgm.createTable('agent_feedback', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    agent_id: {
      type: 'uuid',
      notNull: true,
      references: 'agents',
      onDelete: 'CASCADE',
    },
    message_id: { type: 'uuid', notNull: false },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    rating: { type: 'integer', notNull: true },
    comment: { type: 'text', notNull: false },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('agent_feedback');
}; 