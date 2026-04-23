import { model } from "@medusajs/framework/utils"

const KnowledgeEntry = model.define("agent_knowledge_entry", {
  id: model.id().primaryKey(),
  title: model.text(),
  content: model.text(),
})

export default KnowledgeEntry
