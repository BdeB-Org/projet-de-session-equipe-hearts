const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.test' });

const createTestDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  // Drop and recreate the test database
  await connection.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
  await connection.query(`CREATE DATABASE ${process.env.DB_NAME}`);
  await connection.query(`USE ${process.env.DB_NAME}`);

  // Set up the schema
  await connection.query(`
    CREATE TABLE e_utilisateur (
      e_id INT AUTO_INCREMENT PRIMARY KEY,
      e_nom VARCHAR(100) NOT NULL,
      e_prenom VARCHAR(100) NOT NULL,
      date_naissance DATE NULL,
      e_courriel VARCHAR(100) NOT NULL UNIQUE,
      e_photo VARCHAR(255),
      e_location TEXT NOT NULL,
      e_number TEXT NOT NULL,
      e_password VARCHAR(255),
      abonnement_id VARCHAR(255),
      swipe_count INT DEFAULT 0,
      last_swipe_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      genre VARCHAR(10) NOT NULL
    );
  `);

  console.log('Test database created successfully!');
  await connection.end();
};

module.exports = createTestDatabase;
