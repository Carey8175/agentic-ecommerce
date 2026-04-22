import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { REVIEW_MODULE } from "../../../../modules/review"

// DELETE /admin/reviews/:id
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const reviewService = req.scope.resolve(REVIEW_MODULE)

  const review = await reviewService.retrieveReview(id).catch(() => null)
  if (!review) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Review ${id} not found`)
  }

  await reviewService.deleteReviews(id)

  return res.json({ id, deleted: true })
}
