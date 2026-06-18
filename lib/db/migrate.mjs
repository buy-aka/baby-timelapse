// Production migration runner — standalone container дотор drizzle-kit/esbuild-гүйгээр ажиллана.
// Зөвхөн drizzle-orm + pg хэрэгтэй (container-т хоёулаа байгаа).
// Хэрэглээ:  docker compose -f docker-compose.prod.yml exec app node lib/db/migrate.mjs
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import pg from "pg"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL тохируулаагүй байна")
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: url })
try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" })
  console.log("✅ migrations applied")
} catch (err) {
  console.error("❌ migration failed:", err)
  process.exitCode = 1
} finally {
  await pool.end()
}
