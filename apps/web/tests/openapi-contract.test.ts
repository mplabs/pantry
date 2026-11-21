import fs from "node:fs";
import path from "node:path";

import { expect, it } from "vitest";
import { parse } from "yaml";

const root = path.resolve(__dirname, "..");
const apiDir = path.join(root, "src/app/api");
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
// Auth.js owns this catch-all; it is intentionally not part of the product contract.
const EXEMPT = new Set(["/api/auth/{...nextauth}"]);

function routeFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? routeFiles(p) : e.name === "route.ts" ? [p] : [];
  });
}

function implemented(): Set<string> {
  const out = new Set<string>();
  for (const file of routeFiles(apiDir)) {
    const urlPath =
      "/api/" +
      path
        .relative(apiDir, path.dirname(file))
        .split(path.sep)
        .map((s) => s.replace(/^\[\.\.\.(.+)\]$/, "{...$1}").replace(/^\[(.+)\]$/, "{$1}"))
        .join("/");
    if (EXEMPT.has(urlPath)) continue;
    const src = fs.readFileSync(file, "utf8");
    for (const m of METHODS) {
      if (new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b|export\\s+const\\s+${m}\\b`).test(src)) {
        out.add(`${m} ${urlPath}`);
      }
    }
  }
  return out;
}

function documented(): Set<string> {
  const spec = parse(fs.readFileSync(path.join(root, "openapi.yaml"), "utf8"));
  const out = new Set<string>();
  for (const [p, ops] of Object.entries<Record<string, unknown>>(spec.paths)) {
    for (const m of METHODS) if (ops[m.toLowerCase()]) out.add(`${m} ${p}`);
  }
  return out;
}

it("openapi.yaml and src/app/api document exactly the same path+method pairs", () => {
  const impl = implemented();
  const doc = documented();
  const A = "implemented but missing from openapi.yaml";
  const B = "documented but no route handler";
  expect({
    [A]: [...impl].filter((x) => !doc.has(x)).sort(),
    [B]: [...doc].filter((x) => !impl.has(x)).sort(),
  }).toEqual({ [A]: [], [B]: [] });
});
