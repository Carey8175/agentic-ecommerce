import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AGENT_CONFIG_MODULE } from "../../../../modules/agent-config"
import AgentConfigModuleService from "../../../../modules/agent-config/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.query as { product_id: string }
  const svc: AgentConfigModuleService = req.scope.resolve(AGENT_CONFIG_MODULE)
  const notes = await svc.listProductNotes({ product_id })
  res.json({ note: notes[0] ?? null })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { product_id, note, recommend_enabled } = req.body as any
  const svc: AgentConfigModuleService = req.scope.resolve(AGENT_CONFIG_MODULE)
  const existing = await svc.listProductNotes({ product_id })
  if (existing[0]) {
    const updated = await svc.updateProductNotes({ id: existing[0].id }, { note, recommend_enabled })
    res.json({ note: updated })
  } else {
    const created = await svc.createProductNotes({ product_id, note, recommend_enabled })
    res.json({ note: created })
  }
}
