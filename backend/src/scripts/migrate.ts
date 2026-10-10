import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import { config } from "../config.js";

const root = path.resolve("../database/migrations");

const connection = await mysql.createConnection({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  multipleStatements: true
});

await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.DB_NAME}\``);
await connection.query(`USE \`${config.DB_NAME}\``);

const files = (await fs.readdir(root)).filter((file) => file.endsWith(".sql")).sort();
for (const file of files) {
  const sql = await fs.readFile(path.join(root, file), "utf8");
  await connection.query(sql);
  console.log(`Migrated ${file}`);
}

await connection.end();
