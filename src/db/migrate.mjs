// Applies SQL migrations from ./drizzle. Plain JS so it runs in the production image without tsx.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await migrate(drizzle(pool), { migrationsFolder: process.env.MIGRATIONS_DIR ?? "./drizzle" });
  await pool.end();
  console.log("Migrations applied");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
