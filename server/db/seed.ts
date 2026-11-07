import "dotenv/config";
import { db } from "./database.js";

const result = db.prepare("SELECT COUNT(*) AS count FROM posts").get() as {
  count: number;
};

console.log(`Local database ready: ${result.count} post(s) available.`);
db.close();
