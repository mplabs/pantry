import os from "node:os";
import path from "node:path";

import { defineConfig } from "vitest/config";

const dbFile = path.join(os.tmpdir(), `pantry-test-${process.pid}.db`);
process.env.PANTRY_TEST_DB = dbFile;

export default defineConfig({
  resolve: { alias: { "@": path.resolve("src") } },
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    env: { DATABASE_URL: `file:${dbFile}`, INGREDIENT_TRANSLATOR_PROVIDER: "noop" },
  },
});
