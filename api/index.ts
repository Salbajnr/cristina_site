import serverless from "serverless-http";
import app from "../artifacts/api-server/dist/index.mjs";

export default serverless(app);

