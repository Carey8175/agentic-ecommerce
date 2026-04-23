import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AGENT_CONFIG_MODULE } from "../../../modules/agent-config"
import AgentConfigModuleService from "../../../modules/agent-config/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: AgentConfigModuleService = req.scope.resolve(AGENT_CONFIG_MODULE)

  const [configs, faqs, knowledge_base, visual_categories] = await Promise.all([
    svc.listAgentConfigs({}, { take: 1 }),
    svc.listFaqs({}, { order: { order: "ASC" } }),
    svc.listKnowledgeEntrys({}),
    svc.listVisualCategorys({}),
  ])

  res.json({
    config: configs[0] ?? null,
    faqs,
    knowledge_base,
    visual_categories,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc: AgentConfigModuleService = req.scope.resolve(AGENT_CONFIG_MODULE)
  const { config, faqs, knowledge_base, visual_categories } = req.body as any

  // Upsert main config (single row)
  if (config) {
    const existing = await svc.listAgentConfigs({}, { take: 1 })
    if (existing[0]) {
      await svc.updateAgentConfigs({ id: existing[0].id }, config)
    } else {
      await svc.createAgentConfigs(config)
    }
  }

  // Replace FAQs if provided
  if (Array.isArray(faqs)) {
    const existing = await svc.listFaqs({})
    if (existing.length) {
      await svc.deleteFaqs(existing.map((f: any) => f.id))
    }
    if (faqs.length) {
      await svc.createFaqs(faqs)
    }
  }

  // Replace knowledge entries if provided
  if (Array.isArray(knowledge_base)) {
    const existing = await svc.listKnowledgeEntrys({})
    if (existing.length) {
      await svc.deleteKnowledgeEntrys(existing.map((k: any) => k.id))
    }
    if (knowledge_base.length) {
      await svc.createKnowledgeEntrys(knowledge_base)
    }
  }

  // Replace visual categories if provided
  if (Array.isArray(visual_categories)) {
    const existing = await svc.listVisualCategorys({})
    if (existing.length) {
      await svc.deleteVisualCategorys(existing.map((v: any) => v.id))
    }
    if (visual_categories.length) {
      await svc.createVisualCategorys(visual_categories)
    }
  }

  res.json({ success: true })
}
