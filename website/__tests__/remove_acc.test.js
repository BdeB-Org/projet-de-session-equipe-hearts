const dotenv = require("dotenv");
dotenv.config({ path: "./.env.test" });

const mysql = require("mysql2/promise");

describe("User Removal Tests", () => {
  let connection;

  beforeAll(async () => {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  });

  afterAll(async () => {
    await connection.end();
  });

  beforeEach(async () => {
    await connection.execute(
      `DELETE FROM e_utilisateur WHERE e_courriel IN (?, ?)`,
      ["john.doe@example.com", "jane.doe@example.com"]
    );
  });

  it("should remove an existing user from the database", async () => {
    // Insert a user to test removal
    await connection.execute(
      `INSERT INTO e_utilisateur (e_nom, e_prenom, e_courriel, e_location, e_number, genre) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "Doe",
        "Jane",
        "jane.doe@example.com",
        "Unknown",
        "987-654-3210",
        "Femme",
      ]
    );

    const [rowsBefore] = await connection.execute(
      `SELECT * FROM e_utilisateur WHERE e_courriel = ?`,
      ["jane.doe@example.com"]
    );
    expect(rowsBefore.length).toBe(1);

    const [deleteResult] = await connection.execute(
      `DELETE FROM e_utilisateur WHERE e_courriel = ?`,
      ["jane.doe@example.com"]
    );

    expect(deleteResult.affectedRows).toBe(1);

    const [rowsAfter] = await connection.execute(
      `SELECT * FROM e_utilisateur WHERE e_courriel = ?`,
      ["jane.doe@example.com"]
    );
    expect(rowsAfter.length).toBe(0);
  });
});
