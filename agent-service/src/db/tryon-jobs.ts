import { v4 as uuidv4 } from "uuid"
import { getDb } from "./schema"

export type TryOnJobStatus = "pending" | "done" | "error"

export interface TryOnJob {
  id: string
  customer_id: string
  status: TryOnJobStatus
  product: string        // JSON: { id, title, thumbnail, handle }
  context_image_used: string
  image_url: string | null
  error: string | null
  created_at: number
}

export function createTryOnJob(opts: {
  customer_id: string
  product: object
  context_image_used: string
}): TryOnJob {
  const db = getDb()
  const id = uuidv4()
  db.prepare(
    "INSERT INTO tryon_jobs (id, customer_id, status, product, context_image_used) VALUES (?, ?, 'pending', ?, ?)"
  ).run(id, opts.customer_id, JSON.stringify(opts.product), opts.context_image_used)

  // Keep only the 10 most recent jobs per customer — delete the rest
  db.prepare(`
    DELETE FROM tryon_jobs
    WHERE customer_id = ? AND id NOT IN (
      SELECT id FROM tryon_jobs WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10
    )
  `).run(opts.customer_id, opts.customer_id)

  return db.prepare("SELECT * FROM tryon_jobs WHERE id = ?").get(id) as TryOnJob
}

export function completeTryOnJob(id: string, image_url: string) {
  getDb().prepare(
    "UPDATE tryon_jobs SET status = 'done', image_url = ? WHERE id = ?"
  ).run(image_url, id)
}

export function failTryOnJob(id: string, error: string) {
  getDb().prepare(
    "UPDATE tryon_jobs SET status = 'error', error = ? WHERE id = ?"
  ).run(error, id)
}

export function getTryOnJob(id: string): TryOnJob | null {
  return (getDb().prepare("SELECT * FROM tryon_jobs WHERE id = ?").get(id) as TryOnJob) ?? null
}

export function listTryOnJobs(customer_id: string, limit = 20): TryOnJob[] {
  return getDb()
    .prepare("SELECT * FROM tryon_jobs WHERE customer_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(customer_id, limit) as TryOnJob[]
}

// Mark any pending jobs older than 2 minutes as error (stuck jobs from crashed runs)
export function failStalePendingJobs() {
  const twoMinutesAgo = Date.now() - 4 * 60 * 1000
  getDb()
    .prepare("UPDATE tryon_jobs SET status = 'error', error = 'Generation timed out. Please try again.' WHERE status = 'pending' AND created_at < ?")
    .run(twoMinutesAgo)
}
