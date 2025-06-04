// MongoDB initialization script for local development
db = db.getSiblingDB('project89_dev');

// Create a basic user for the application
db.createUser({
  user: 'project89_user',
  pwd: 'dev-app-password',
  roles: [
    {
      role: 'readWrite',
      db: 'project89_dev'
    }
  ]
});

// Create some basic indexes for performance
db.accounts.createIndex({ walletAddress: 1 }, { unique: true });
db.profiles.createIndex({ username: 1 }, { unique: true });
db.fingerprints.createIndex({ fingerprint: 1 }, { unique: true });

print('MongoDB initialized successfully for Project89 development');
