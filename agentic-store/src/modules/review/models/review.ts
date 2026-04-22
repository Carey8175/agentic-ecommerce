import { model } from "@medusajs/framework/utils"

const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  order_id: model.text(),
  customer_id: model.text(),
  rating: model.number(),
  title: model.text().nullable(),
  body: model.text().nullable(),
})

export default Review
