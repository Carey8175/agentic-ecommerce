import "dotenv/config"
import express from "express"
import cors from "cors"
import path from "path"
import { getDb } from "./db/schema"

import chatRoute from "./routes/chat"
import tryonRoute from "./routes/tryon"
import historyRoute from "./routes/history"
import settingsRoute from "./routes/settings"
import checkoutRoute from "./routes/checkout"

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: ["http://localhost:8000", "http://localhost:3000"], credentials: true }))
app.use(express.json({ limit: "50mb" }))

// Serve uploaded/generated images
app.use("/uploads", express.static(path.join(__dirname, "../src/uploads")))

// Init DB on startup
getDb()

// Routes
app.use("/agent/chat", chatRoute)
app.use("/agent/tryon", tryonRoute)
app.use("/agent", historyRoute)
app.use("/agent/settings", settingsRoute)
app.use("/agent/checkout", checkoutRoute)

app.get("/health", (_, res) => res.json({ status: "ok" }))

app.listen(PORT, () => {
  console.log(`Agent service running on http://localhost:${PORT}`)
})
