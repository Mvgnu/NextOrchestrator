exports.up = pgm => {
  pgm.addColumn('users', {
    role: { type: 'varchar(50)', default: 'user' } // e.g., 'user', 'admin'
  });
};

exports.down = pgm => {
  pgm.dropColumn('users', 'role');
}; 