import { Router, Request, Response } from "express"
import { cancelOrder } from "../tools/medusa"

const router = Router()

router.post("/", async (req: Request, res: Response) => {
  const customerToken = req.headers["x-customer-token"] as string
  const { order_id } = req.body
  if (!order_id) { res.status(400).json({ error: "order_id is required" }); return }
  try {
    const result = await cancelOrder(order_id, customerToken)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
