const jwt = require('jsonwebtoken');
require('dotenv').config();

// Available users from the database:
const users = [
  {
    userId: 'a1b2c3d4-e5f6-4890-abcd-123456789002',
    email: 'client1@example.com',
    role: 'client',
    name: 'Sarah Johnson'
  },
  {
    userId: 'a1b2c3d4-e5f6-4890-abcd-123456789003',
    email: 'client2@example.com', 
    role: 'client',
    name: 'Mike Davis'
  },
  {
    userId: 'd253aecb-e7e5-4586-a5a8-21c84c7daca3',
    email: 'test@example.com',
    role: 'client',
    name: 'Test User'
  },
  {
    userId: 'a1b2c3d4-e5f6-4890-abcd-123456789001',
    email: 'admin@actcoaching.com',
    role: 'admin',
    name: 'Admin User'
  }
];

console.log('Available users:');
users.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
});

// Generate tokens for each user
console.log('\nGenerated JWT tokens:\n');

users.forEach(user => {
  const payload = {
    userId: user.userId,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
  
  console.log(`${user.name} (${user.email}):`);
  console.log(`Bearer ${token}`);
  console.log('---');
});

// Generate a specific token for client1 (most likely to work)
const client1Payload = {
  userId: 'a1b2c3d4-e5f6-4890-abcd-123456789002',
  email: 'client1@example.com',
  role: 'client'
};

const client1Token = jwt.sign(client1Payload, process.env.JWT_SECRET, { expiresIn: '24h' });

console.log('\nRecommended token for testing (client1@example.com):');
console.log(client1Token);