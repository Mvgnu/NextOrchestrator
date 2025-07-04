exports.up = pgm => {
  pgm.addColumn('users', {
    password_hash: { type: 'text', nullable: true } // Or VARCHAR(255) if preferred
  });
};

exports.down = pgm => {
  pgm.dropColumn('users', 'password_hash');
}; 