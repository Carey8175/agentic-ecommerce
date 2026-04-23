import { model } from "@medusajs/framework/utils"

const ProductNote = model.define("agent_product_note", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  note: model.text().nullable(),
  recommend_enabled: model.boolean().default(true),
})

export default ProductNote
