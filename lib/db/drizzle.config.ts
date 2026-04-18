import { defineConfig } from "drizzle-kit";
import path from "path";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), "../../.env.local") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
