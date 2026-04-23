import { Router, Request, Response } from "express"
import { completeCheckout } from "../tools/medusa"
import { getSettings } from "../db/settings"

const router = Router()

router.post("/complete", async (req: Request, res: Response) => {
  const { cart_id } = req.body
  const customerToken: string = (req.headers["x-customer-token"] as string) ?? ""
  const customerId: string = (req.headers["x-customer-id"] as string) ?? ""

  if (!cart_id) {
    res.status(400).json({ error: "cart_id is required" })
    return
  }

  const settings = customerId ? getSettings(customerId) : null
  if (settings && !settings.one_click_checkout_enabled) {
    res.status(403).json({ error: "One-click checkout is not enabled. Enable it in Settings." })
    return
  }

  try {
    const order = await completeCheckout(cart_id, customerToken, settings?.saved_address_id ?? undefined)
    res.json({
      order: {
        id: order.id,
        display_id: order.display_id,
        total: order.total,
        currency_code: order.currency_code,
        item_count: order.items?.length ?? 0,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
