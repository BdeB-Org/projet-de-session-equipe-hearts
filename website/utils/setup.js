const createTestDatabase = require('../utils/databaseSetup'); // Update the path if moved

beforeAll(async () => {
  console.log('Setting up test database...');
  await createTestDatabase();
});
