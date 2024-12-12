const dotenv = require("dotenv");
dotenv.config({ path: "./.env.test" }); // Explicitly specify the .env.test file

const mysql = require("mysql2/promise");

describe("User Registration Tests", () => {
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
    await connection.execute(`DELETE FROM e_utilisateur WHERE e_courriel = ?`, [
      "john.doe@example.com",
    ]);
  });

  afterEach(async () => {
    await connection.execute(`DELETE FROM e_utilisateur WHERE e_courriel = ?`, [
      "john.doe@example.com",
    ]);
  });

  it("should insert a new user into the database", async () => {
    const [result] = await connection.execute(
      `INSERT INTO e_utilisateur (e_nom, e_prenom, e_courriel, e_location, e_number, genre) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        "Doe",
        "John",
        "john.doe@example.com",
        "Unknown",
        "123-456-7890",
        "Homme",
      ]
    );

    expect(result.affectedRows).toBe(1);

    const [rows] = await connection.execute(
      `SELECT * FROM e_utilisateur WHERE e_courriel = ?`,
      ["john.doe@example.com"]
    );

    expect(rows.length).toBe(1);
    expect(rows[0].e_nom).toBe("Doe");
    expect(rows[0].e_prenom).toBe("John");
  });
});
