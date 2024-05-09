import { AsyncDatabase } from "promised-sqlite3";
import { readFile } from "node:fs/promises";

const path = new URL("../db", import.meta.url).pathname;
const db = await AsyncDatabase.open(`${path}/db.sqlite`);
const init = await readFile(`${path}/init.sql`, "utf8");
await db.run(init);

export default db;
