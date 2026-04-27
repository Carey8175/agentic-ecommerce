import { Router, Request, Response } from "express"
import multer from "multer"
import path from "path"
import fs from "fs"

const MEDUSA_URL = process.env.MEDUSA_URL ?? "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY ?? ""
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

const router = Router()

// Dynamic storage: one subfolder per customer
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const customerId = (req.headers["x-customer-id"] as string) || "guest"
    const dir = path.join(__dirname, "../../src/uploads", customerId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg"
    cb(null, `${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, true)
    else cb(new Error("Only image files are allowed"))
  },
})

// POST /agent/tryon-profile
// Form fields: type = "self" | "home"
// File field: image
router.post("/", upload.single("image"), async (req: Request, res: Response) => {
  const customerToken = req.headers["x-customer-token"] as string
  const customerId = req.headers["x-customer-id"] as string

  if (!customerToken || !customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  if (!req.file) {
    res.status(400).json({ message: "No image uploaded" })
    return
  }

  const type = (req.body.type as string) === "home" ? "home" : "self"
  const imageUrl = `${AGENT_SERVICE_URL}/uploads/${customerId}/${req.file.filename}`

  // Fetch current customer metadata
  const customerRes = await fetch(`${MEDUSA_URL}/store/customers/me`, {
    headers: {
      "x-publishable-api-key": PUBLISHABLE_KEY,
      Authorization: `Bearer ${customerToken}`,
    },
  })

  if (!customerRes.ok) {
    res.status(401).json({ message: "Failed to fetch customer" })
    return
  }

  const { customer } = await customerRes.json() as any
  const existingProfile = customer?.metadata?.tryon_personalization ?? {}
  const existingImages = existingProfile.images ?? {}

  // Delete old file from disk before saving new one
  const oldUrl: string | undefined = existingImages[`${type}_url`]
  if (oldUrl) {
    try {
      const oldFilename = oldUrl.split(`/uploads/${customerId}/`)[1]
      if (oldFilename) {
        const oldPath = path.join(__dirname, "../../src/uploads", customerId, oldFilename)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
    } catch { /* ignore */ }
  }

  const updatedImages = {
    ...existingImages,
    [`${type}_url`]: imageUrl,
  }

  // PATCH customer metadata
  const patchRes = await fetch(`${MEDUSA_URL}/store/customers/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      metadata: {
        tryon_personalization: {
          ...existingProfile,
          images: updatedImages,
        },
      },
    }),
  })

  if (!patchRes.ok) {
    const text = await patchRes.text()
    res.status(500).json({ message: `Failed to save profile: ${text}` })
    return
  }

  res.json({ success: true, type, url: imageUrl })
})

// DELETE /agent/tryon-profile/:type — removes self or home photo
router.delete("/:type", async (req: Request, res: Response) => {
  const customerToken = req.headers["x-customer-token"] as string
  const customerId = req.headers["x-customer-id"] as string
  const type = req.params.type === "home" ? "home" : "self"

  if (!customerToken || !customerId) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }

  const customerRes = await fetch(`${MEDUSA_URL}/store/customers/me`, {
    headers: {
      "x-publishable-api-key": PUBLISHABLE_KEY,
      Authorization: `Bearer ${customerToken}`,
    },
  })

  if (!customerRes.ok) {
    res.status(401).json({ message: "Failed to fetch customer" })
    return
  }

  const { customer } = await customerRes.json() as any
  const existingProfile = customer?.metadata?.tryon_personalization ?? {}
  const existingImages = { ...(existingProfile.images ?? {}) }

  // Delete file from disk
  const fileUrl: string | undefined = existingImages[`${type}_url`]
  if (fileUrl) {
    try {
      const filename = fileUrl.split(`/uploads/${customerId}/`)[1]
      if (filename) {
        const filePath = path.join(__dirname, "../../src/uploads", customerId, filename)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      }
    } catch { /* ignore */ }
  }

  delete existingImages[`${type}_url`]

  const patchRes = await fetch(`${MEDUSA_URL}/store/customers/me`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      metadata: {
        tryon_personalization: {
          ...existingProfile,
          images: existingImages,
        },
      },
    }),
  })

  if (!patchRes.ok) {
    res.status(500).json({ message: "Failed to remove photo" })
    return
  }

  res.json({ success: true })
})

export default router
