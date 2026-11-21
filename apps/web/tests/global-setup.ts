import { execFileSync } from "node:child_process";
import fs from "node:fs";

// Builds a throwaway SQLite DB by applying prisma/migrations (same path as `npm run db:deploy`).
export default function setup() {
  const db = process.env.PANTRY_TEST_DB!;
  fs.rmSync(db, { force: true });
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: `file:${db}` },
    stdio: "pipe",
  });
  return () => fs.rmSync(db, { force: true });
}
