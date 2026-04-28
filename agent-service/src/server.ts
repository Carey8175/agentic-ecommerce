import "dotenv/config"
// Allow self-signed/untrusted certs in Docker (CA bundle may be incomplete in alpine)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
import express from "express"
import cors from "cors"
import path from "path"
import fs from "fs"
import { getDb } from "./db/schema"
import { failStalePendingJobs } from "./db/tryon-jobs"

import chatRoute from "./routes/chat"
import tryonRoute from "./routes/tryon"
import historyRoute from "./routes/history"
import settingsRoute from "./routes/settings"
import checkoutRoute from "./routes/checkout"
import ticketsRoute from "./routes/tickets"
import cancelOrderRoute from "./routes/cancel-order"
import tryonProfileRoute from "./routes/tryon-profile"
import tryonJobsRoute from "./routes/tryon-jobs"

const app = express()
const PORT = process.env.PORT ?? 3001

const STOREFRONT_URL = process.env.STOREFRONT_URL ?? "http://localhost:3000"
const MEDUSA_ADMIN_URL = process.env.MEDUSA_ADMIN_URL ?? "http://localhost:9001"
app.use(cors({
  origin: [STOREFRONT_URL, MEDUSA_ADMIN_URL, "http://localhost:3000", "http://localhost:8000", "http://localhost:9001"],
  credentials: true,
}))
app.use(express.json({ limit: "50mb" }))

// Serve uploaded/generated images
app.use("/uploads", express.static(path.join(__dirname, "../src/uploads")))

// Init DB on startup + clean up any jobs that were stuck pending from a previous run
getDb()
failStalePendingJobs()

// Routes
app.use("/agent/chat", chatRoute)
app.use("/agent/tryon", tryonRoute)
app.use("/agent", historyRoute)
app.use("/agent/settings", settingsRoute)
app.use("/agent/checkout", checkoutRoute)
app.use("/agent/tickets", ticketsRoute)
app.use("/agent/cancel-order", cancelOrderRoute)
app.use("/agent/tryon-profile", tryonProfileRoute)
app.use("/agent/tryon-jobs", tryonJobsRoute)

app.get("/health", (_, res) => res.json({ status: "ok" }))

// Delete tryon images older than 24h — runs on startup and every hour
function cleanupOldTryonImages() {
  const uploadsDir = path.join(__dirname, "../src/uploads")
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  try {
    for (const entry of fs.readdirSync(uploadsDir)) {
      const entryPath = path.join(uploadsDir, entry)
      const stat = fs.statSync(entryPath)
      if (stat.isDirectory()) {
        // Customer subfolder — delete tryon files inside
        for (const file of fs.readdirSync(entryPath)) {
          if (!file.startsWith("tryon-")) continue
          const filePath = path.join(entryPath, file)
          if (fs.statSync(filePath).mtimeMs < cutoff) {
            fs.unlinkSync(filePath)
            console.log(`[cleanup] deleted ${filePath}`)
          }
        }
      } else if (entry.startsWith("tryon-") && stat.mtimeMs < cutoff) {
        // Legacy flat tryon files
        fs.unlinkSync(entryPath)
        console.log(`[cleanup] deleted ${entryPath}`)
      }
    }
  } catch (e) { console.error("[cleanup] error:", e) }
}

cleanupOldTryonImages()
setInterval(cleanupOldTryonImages, 60 * 60 * 1000)

app.listen(PORT, () => {
  console.log(`Agent service running on http://localhost:${PORT}`)
})
