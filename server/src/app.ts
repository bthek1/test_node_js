import express, { type ErrorRequestHandler } from "express";
import healthRouter from "./routes/health.js";

export function createApp() {
  const app = express();

  app.use(express.json()); // parses JSON request bodies into req.body

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });

  app.get("/", (req, res) => {
    res.send("Hello from Express");
  });

  app.use("/api/health", healthRouter);

  app.get("/api/echo/:word", (req, res) => {
    res.json({ word: req.params.word, shout: req.query.shout === "true" });
  });

  app.get("/api/boom", () => {
    throw new Error("boom");
  });

  app.get("/api/boom-async", async () => {
    throw new Error("async boom"); // Express 5 forwards rejected promises to the error handler
  });

  // 404: only reached if no route above sent a response
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler: the 4-argument signature is what marks it as one
  const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  };
  app.use(errorHandler);

  return app;
}
