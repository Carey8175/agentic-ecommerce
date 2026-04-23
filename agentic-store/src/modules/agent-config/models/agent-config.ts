import { model } from "@medusajs/framework/utils"

const AgentConfig = model.define("agent_config", {
  id: model.id().primaryKey(),
  name: model.text().default("Byteshop Assistant"),
  tone: model.text().default("friendly and helpful"),
  system_prompt: model.text().nullable(),
  restrictions: model.json().nullable(),
  one_click_require_confirm: model.boolean().default(true),
})

export default AgentConfig
