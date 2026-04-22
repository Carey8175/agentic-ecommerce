import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework"
import { z } from "zod"

export const CreateReviewSchema = z.object({
  product_id: z.string(),
  order_id: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
})

export type CreateReviewSchema = z.infer<typeof CreateReviewSchema>

export const reviewStoreMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/reviews",
    method: "POST",
    middlewares: [validateAndTransformBody(CreateReviewSchema)],
  },
]
