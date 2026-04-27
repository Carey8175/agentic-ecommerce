import { Router, Request, Response } from "express"
import { createTryOnJob, completeTryOnJob, failTryOnJob, getTryOnJob, listTryOnJobs } from "../db/tryon-jobs"
import { generateTryOn } from "../agents/tryon-agent"
import * as medusa from "../tools/medusa"

const router = Router()

// GET /agent/tryon-jobs/debug/all — debug
router.get("/debug/all", (req: Request, res: Response) => {
  const db = require("../db/schema").getDb()
  const jobs = db.prepare("SELECT * FROM tryon_jobs ORDER BY created_at DESC LIMIT 10").all()
  res.json({ jobs: jobs.map(parseJob) })
})

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

// POST /agent/tryon-jobs — start an async try-on job, return job_id immediately
router.post("/", async (req: Request, res: Response) => {
  const customer_id = req.headers["x-customer-id"] as string
  const customer_token = req.headers["x-customer-token"] as string

  if (!customer_id || !customer_token) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const { product_id, context_image_url, prefer_home } = req.body
  if (!product_id || !context_image_url) {
    res.status(400).json({ message: "product_id and context_image_url are required" })
    return
  }

  // Fetch product details upfront so the pending card has a thumbnail + handle
  let productStub: { id: string; title?: string; thumbnail?: string; handle?: string; category?: string } = { id: product_id }
  try {
    const p = await medusa.getProductFromCatalog(product_id, customer_token)
    if (p) productStub = { id: p.id, title: p.title, thumbnail: p.thumbnail, handle: p.handle, category: p.categories?.[0]?.name ?? p.type?.value ?? undefined }
    else {
      const pd = await medusa.getProductDetails(product_id, customer_token)
      productStub = { id: pd.id, title: pd.title, thumbnail: pd.thumbnail, handle: pd.handle }
    }
  } catch (e) { console.error("[tryon-jobs] product fetch failed:", e) }

  // Normalise to absolute URL so browsers on other ports can load it
  const contextImageAbsolute = context_image_url.startsWith("http")
    ? context_image_url
    : `${AGENT_SERVICE_URL}${context_image_url}`

  // Create job row immediately
  const job = createTryOnJob({
    customer_id,
    product: productStub,
    context_image_used: contextImageAbsolute,
  })

  // Fire and forget — run generation in background
  setImmediate(async () => {
    try {
      const result = await generateTryOn({
        product_id,
        context_image_url,
        customerToken: customer_token,
        base_url: AGENT_SERVICE_URL,
        customerId: customer_id,
      })

      // Store absolute URL for the generated image
      const imageUrl = result.image_url.startsWith("http")
        ? result.image_url
        : `${AGENT_SERVICE_URL}${result.image_url}`

      // Update job with enriched product info and result
      const db = require("../db/schema").getDb()
      // Use productStub for all metadata (already has title, thumbnail, handle, category)
      // Only take image_url from the generation result
      db.prepare("UPDATE tryon_jobs SET status = 'done', image_url = ?, product = ? WHERE id = ?").run(
        imageUrl,
        JSON.stringify(productStub),
        job.id
      )
    } catch (err: any) {
      failTryOnJob(job.id, err.message ?? "Generation failed")
    }
  })

  res.json({ job_id: job.id, status: "pending" })
})

// GET /agent/tryon-jobs — list all jobs for this customer
router.get("/", (req: Request, res: Response) => {
  const customer_id = req.headers["x-customer-id"] as string
  if (!customer_id) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }
  const jobs = listTryOnJobs(customer_id, 10)
  res.json({ jobs: jobs.map(parseJob) })
})

// GET /agent/tryon-jobs/:id — poll single job (job UUID is the auth token)
router.get("/:id", (req: Request, res: Response) => {
  const job = getTryOnJob(req.params.id)
  if (!job) {
    res.status(404).json({ message: "Not found" })
    return
  }
  res.json(parseJob(job))
})

function toAbsolute(url: string | null): string | null {
  if (!url) return null
  return url.startsWith("http") ? url : `${AGENT_SERVICE_URL}${url}`
}

function parseJob(job: any) {
  let product = {}
  try { product = JSON.parse(job.product) } catch { /* empty */ }
  return {
    ...job,
    product,
    image_url: toAbsolute(job.image_url),
    context_image_used: toAbsolute(job.context_image_used),
  }
}

export default router
