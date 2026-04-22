import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { REVIEW_MODULE } from "../../modules/review"

type CreateReviewStepInput = {
  product_id: string
  order_id: string
  customer_id: string
  rating: number
  title?: string
  body?: string
}

export const createReviewStep = createStep(
  "create-review-step",
  async (input: CreateReviewStepInput, { container }) => {
    const reviewService = container.resolve(REVIEW_MODULE)
    const orderService = container.resolve(Modules.ORDER)

    // Verify the order exists, belongs to this customer, and contains the product
    const [orders] = await orderService.listOrders(
      { id: input.order_id, customer_id: input.customer_id },
      { relations: ["items"] }
    )

    if (!orders) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Order not found or does not belong to you"
      )
    }

    const hasProduct = orders.items?.some(
      (item: any) => item.product_id === input.product_id
    )

    if (!hasProduct) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "You can only review products from your orders"
      )
    }

    // Check if customer already reviewed this product from this order
    const [existing] = await reviewService.listReviews({
      product_id: input.product_id,
      order_id: input.order_id,
      customer_id: input.customer_id,
    })

    if (existing) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        "You have already reviewed this product for this order"
      )
    }

    const review = await reviewService.createReviews({
      product_id: input.product_id,
      order_id: input.order_id,
      customer_id: input.customer_id,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body ?? null,
    })

    return new StepResponse(review, review.id)
  },
  async (reviewId: string, { container }) => {
    const reviewService = container.resolve(REVIEW_MODULE)
    await reviewService.deleteReviews(reviewId)
  }
)
