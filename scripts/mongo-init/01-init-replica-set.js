// Initialize MongoDB as a replica set for Prisma compatibility
rs.initiate({
  _id: "rs0",
  members: [
    {
      _id: 0,
      host: "mongo:27017"
    }
  ]
});

// Wait for replica set to be ready
sleep(2000);

// Switch to admin database
db = db.getSiblingDB('admin');

// Create root user if not exists
try {
  db.createUser({
    user: 'admin',
    pwd: 'dev-password',
    roles: [
      { role: 'root', db: 'admin' }
    ]
  });
} catch (e) {
  print('Admin user already exists');
}

// Switch to application database
db = db.getSiblingDB('project89_dev');

// Create application user
try {
  db.createUser({
    user: 'project89',
    pwd: 'dev-password',
    roles: [
      { role: 'readWrite', db: 'project89_dev' }
    ]
  });
} catch (e) {
  print('Application user already exists');
}

print('MongoDB replica set initialized successfully');