import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Explicitly load .env for Prisma CLI (required in Prisma v7 with prisma.config.ts)
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Use DIRECT_URL for migrations (bypasses PgBouncer pooler)
    // Fall back to DATABASE_URL if DIRECT_URL is not set
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
