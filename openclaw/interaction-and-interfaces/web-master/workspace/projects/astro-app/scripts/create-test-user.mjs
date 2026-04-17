// One-off script to create a test user via Better Auth's server API.
// Usage: node --env-file=.env scripts/create-test-user.mjs [email] [password]
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { join } from "path";

const [, , email = "test@example.com", password = "password1234"] = process.argv;

const auth = betterAuth({
  database: new Database(join(process.cwd(), "data", "database.db")),
  emailAndPassword: { enabled: true },
});

try {
  const res = await auth.api.signUpEmail({
    body: { email, password, name: email.split("@")[0] },
  });
  console.log(`Created user: ${res.user?.email ?? email}`);
  console.log(`Password: ${password}`);
} catch (err) {
  console.error("Failed:", err?.body?.message ?? err?.message ?? err);
  process.exit(1);
}
