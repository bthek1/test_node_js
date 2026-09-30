import express from "express";

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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/echo/:word", (req, res) => {
  res.json({ word: req.params.word, shout: req.query.shout === "true" });
});
app.listen(3001, () => console.log("Listening on http://localhost:3001"));