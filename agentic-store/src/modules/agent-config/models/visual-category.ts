import { model } from "@medusajs/framework/utils"

const VisualCategory = model.define("agent_visual_category", {
  id: model.id().primaryKey(),
  category_handle: model.text(),
  upload_type: model.text(),
  upload_prompt: model.text(),
  prompt_hint: model.text().nullable(),
  seedream_model: model.text().nullable(),
})

export default VisualCategory
