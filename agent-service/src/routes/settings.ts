import { Router, Request, Response } from "express"
import { getSettings, upsertSettings } from "../db/settings"

const router = Router()

router.get("/", (req: Request, res: Response) => {
  const customerId = req.headers["x-customer-id"] as string
  if (!customerId) {
    res.json({ settings: { one_click_checkout_enabled: false, saved_address_id: null, history_window: 30 } })
    return
  }
  res.json({ settings: getSettings(customerId) })
})

router.post("/", (req: Request, res: Response) => {
  const customerId = req.headers["x-customer-id"] as string
  if (!customerId) {
    res.status(400).json({ error: "x-customer-id header required" })
    return
  }
  const { one_click_checkout_enabled, saved_address_id, history_window } = req.body
  const settings = upsertSettings(customerId, {
    ...(one_click_checkout_enabled !== undefined && { one_click_checkout_enabled }),
    ...(saved_address_id !== undefined && { saved_address_id }),
    ...(history_window !== undefined && { history_window }),
  })
  res.json({ settings })
})

export default router
