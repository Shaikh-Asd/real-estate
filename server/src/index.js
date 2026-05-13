import express from "express";
import cors from "cors";
import itemsRouter from "./routes/items.js";
import statsRouter from "./routes/stats.js";
import { startItemsFileWatcher } from "./lib/itemsData.js";

const app = express();
const PORT = Number(process.env.PORT) || 4001;

app.use(cors({ origin: "http://localhost:3000" }));
app.use("/api", itemsRouter);
app.use("/api", statsRouter);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

startItemsFileWatcher();

const server = app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other API server (Ctrl+C in that terminal), or free the port: lsof -ti :${PORT} | xargs kill`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
