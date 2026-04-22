import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../modules/review"

// GET /admin/reviews?product_id=&limit=&offset=
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id, limit = "50", offset = "0" } = req.query as Record<string, string>

  const reviewService = req.scope.resolve(REVIEW_MODULE)

  const filters: Record<string, any> = {}
  if (product_id) filters.product_id = product_id

  const [reviews, count] = await reviewService.listAndCountReviews(filters, {
    take: parseInt(limit),
    skip: parseInt(offset),
    order: { created_at: "DESC" },
  })

  return res.json({
    reviews,
    count,
    limit: parseInt(limit),
    offset: parseInt(offset),
  })
}
