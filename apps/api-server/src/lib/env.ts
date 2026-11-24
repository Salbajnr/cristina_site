import dotenv from "dotenv";
import path from "node:path";

const workspaceRoot = path.resolve(import.meta.dirname, "../../..");
dotenv.config({ path: path.join(workspaceRoot, ".env.local") });
dotenv.config({ path: path.join(workspaceRoot, ".env") });
