import "dotenv/config";
import {
  scrypt as scryptCallback,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { db } from "./database.js";

const scrypt = promisify(scryptCallback);
const rl = createInterface({ input: stdin, output: stdout });
try {
  const username = (await rl.question("Admin username: ")).trim();
  const password = await rl.question("Admin password (12+ characters): ");
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username))
    throw new Error(
      "Use 3–40 letters, numbers, dots, underscores, or hyphens for the username.",
    );
  if (password.length < 12)
    throw new Error("Choose a password with at least 12 characters.");
  if (db.prepare("SELECT id FROM admins WHERE username = ?").get(username))
    throw new Error("That admin username already exists.");
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  db.prepare(
    "INSERT INTO admins(username,salt,password_hash) VALUES(?,?,?)",
  ).run(username, salt, key.toString("hex"));
  console.log(
    `Admin account “${username}” created. Keep the password private.`,
  );
} finally {
  rl.close();
}
