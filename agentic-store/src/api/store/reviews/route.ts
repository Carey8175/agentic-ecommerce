import { AuthenticatedMedusaRequest, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../modules/review"
import createReviewWorkflow from "../../../workflows/create-review"
import { CreateReviewSchema } from "./middlewares"

// GET /store/reviews?product_id=xxx  — public, no auth required
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.query as { product_id?: string }

  if (!product_id) {
    return res.status(400).json({ message: "product_id is required" })
  }

  const reviewService = req.scope.resolve(REVIEW_MODULE)

  const reviews = await reviewService.listReviews(
    { product_id },
    { order: { created_at: "DESC" } }
  )

  // Compute average rating
  const avg =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 0

  return res.json({
    reviews,
    count: reviews.length,
    average_rating: Math.round(avg * 10) / 10,
  })
}

// POST /store/reviews  — requires customer auth (set via middleware)
export async function POST(
  req: AuthenticatedMedusaRequest<CreateReviewSchema>,
  res: MedusaResponse
) {
  const customerId = req.auth_context.actor_id
  const { product_id, order_id, rating, title, body } = req.validatedBody

  const { result } = await createReviewWorkflow(req.scope).run({
    input: { product_id, order_id, customer_id: customerId, rating, title, body },
  })

  return res.status(201).json({ review: result })
}
