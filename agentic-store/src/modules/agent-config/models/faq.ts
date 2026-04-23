import { model } from "@medusajs/framework/utils"

const Faq = model.define("agent_faq", {
  id: model.id().primaryKey(),
  question: model.text(),
  answer: model.text(),
  order: model.number().default(0),
})

export default Faq
