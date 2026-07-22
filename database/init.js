const db = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const existingAdmin = db.users.findByEmail('admin@delivery.com');
if (!existingAdmin) {
  const adminId = uuidv4();
  const adminPassword = bcrypt.hashSync('admin123', 10);

  db.users.insert({
    id: adminId,
    name: 'Admin',
    email: 'admin@delivery.com',
    password: adminPassword,
    phone: '08000000000',
    role: 'admin',
    created_at: new Date().toISOString(),
  });

  console.log('Database initialized successfully.');
  console.log('Admin account created:');
  console.log('  Email: admin@delivery.com');
  console.log('  Password: admin123');
} else {
  console.log('Admin account already exists.');
  console.log('  Email: admin@delivery.com');
  console.log('  Password: admin123');
}
