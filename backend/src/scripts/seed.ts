import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import { config } from "../config.js";

const connection = await mysql.createConnection({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  multipleStatements: true
});

const seedRoot = path.resolve("../database/seeds");
const files = (await fs.readdir(seedRoot)).filter((file) => file.endsWith(".sql")).sort();
for (const file of files) {
  await connection.query(await fs.readFile(path.join(seedRoot, file), "utf8"));
  console.log(`Seeded ${file}`);
}

const adminPassword = await bcrypt.hash("Admin123!", 12);
await connection.execute(
  "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin') ON DUPLICATE KEY UPDATE role = 'admin'",
  [randomUUID(), "Super Admin", "admin@example.com", adminPassword]
);

const userPassword = await bcrypt.hash("User12345!", 12);
await connection.execute("INSERT IGNORE INTO super_admin_accounts(user_id) SELECT id FROM users WHERE email='admin@example.com' AND role='admin' AND NOT EXISTS (SELECT 1 FROM super_admin_accounts)");
await connection.execute(
  "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'user') ON DUPLICATE KEY UPDATE name = VALUES(name)",
  [randomUUID(), "Demo User", "demo@example.com", userPassword]
);

console.log("Development accounts: admin@example.com / Admin123!, demo@example.com / User12345!");
await connection.end();
