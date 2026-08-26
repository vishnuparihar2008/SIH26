import config from "./src/config/config.js";
import app from "./src/app.js";
import { connectDB } from "./src/db/db.js";

async function start() {
  await connectDB();

  app.listen(config.port, () => {
    console.log(
      `[server] Running in ${config.env} mode on port ${config.port}`,
    );
  });
}

start().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});

