import { MedusaService } from "@medusajs/framework/utils"
import AgentConfig from "./models/agent-config"
import Faq from "./models/faq"
import KnowledgeEntry from "./models/knowledge-entry"
import VisualCategory from "./models/visual-category"
import ProductNote from "./models/product-note"

class AgentConfigModuleService extends MedusaService({
  AgentConfig,
  Faq,
  KnowledgeEntry,
  VisualCategory,
  ProductNote,
}) {}

export default AgentConfigModuleService
