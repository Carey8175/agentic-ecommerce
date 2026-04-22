import { createWorkflow, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { REVIEW_MODULE } from "../modules/review"
import { createReviewStep } from "./steps/create-review"

type CreateReviewWorkflowInput = {
  product_id: string
  order_id: string
  customer_id: string
  rating: number
  title?: string
  body?: string
}

const createReviewWorkflow = createWorkflow(
  "create-review",
  function (input: CreateReviewWorkflowInput) {
    const review = createReviewStep(input)

    // Link review → product (order matches defineLink: review first, then product)
    const linkData = transform({ review, input }, ({ review, input }) => [
      {
        [REVIEW_MODULE]: {
          review_id: review.id,
        },
        [Modules.PRODUCT]: {
          product_id: input.product_id,
        },
      },
    ])

    createRemoteLinkStep(linkData)

    return new WorkflowResponse(review)
  }
)

export default createReviewWorkflow
