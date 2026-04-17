import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { join } from "path";
import { mkdirSync } from "fs";

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []),
]
  .filter((v): v is string => Boolean(v))
  .map((v) => new URL(v).origin);

export const auth = betterAuth({
  database: new Database(join(dataDir, "database.db")),
  emailAndPassword: { enabled: true },
  basePath: "/app/api/auth",
  trustedOrigins,
});
