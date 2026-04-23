import { Router, Request, Response } from "express"
import multer from "multer"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { detectCategory, generateTryOn } from "../agents/tryon-agent"
import { saveUpload } from "../tools/byteplus"

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

// Step 1: Detect upload type for a product
router.post("/detect-category", async (req: Request, res: Response) => {
  const { product_id } = req.body
  const customerToken: string = (req.headers["x-customer-token"] as string) ?? ""

  if (!product_id) {
    res.status(400).json({ error: "product_id is required" })
    return
  }

  try {
    const result = await detectCategory(product_id, customerToken)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Step 2: Upload context image
router.post("/upload", upload.single("image"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "image file is required" })
    return
  }

  try {
    const url = saveUpload(req.file.buffer, req.file.mimetype)
    res.json({ url })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// Step 3: Generate try-on image
router.post("/generate", async (req: Request, res: Response) => {
  const { product_id, context_image_url } = req.body
  const customerToken: string = (req.headers["x-customer-token"] as string) ?? ""

  if (!product_id || !context_image_url) {
    res.status(400).json({ error: "product_id and context_image_url are required" })
    return
  }

  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`
    const result = await generateTryOn({ product_id, context_image_url, customerToken, base_url: baseUrl })
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
