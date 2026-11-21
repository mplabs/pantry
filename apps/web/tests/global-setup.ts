import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Builds a throwaway SQLite DB from prisma/init.sql (needs the sqlite3 CLI, same as `npm run db:init`).
export default function setup() {
  const db = process.env.PANTRY_TEST_DB!;
  fs.rmSync(db, { force: true });
  execFileSync("sqlite3", [db], { input: fs.readFileSync(path.resolve("prisma/init.sql")) });
  return () => fs.rmSync(db, { force: true });
}
