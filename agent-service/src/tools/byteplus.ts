import OpenAI from "openai"
import fs from "fs"
import path from "path"
import https from "https"
import { v4 as uuidv4 } from "uuid"

const byteplus = new OpenAI({
  baseURL: process.env.BYTEPLUS_BASE_URL ?? "https://ark.ap-southeast.bytepluses.com/api/v3",
  apiKey: process.env.ARK_API_KEY ?? "",
})

const VLM_MODEL = process.env.BYTEPLUS_VLM_MODEL ?? "ep-20260408110157-vdsdd"
const SEEDREAM_MODEL = process.env.BYTEPLUS_SEEDREAM_MODEL ?? "ep-20260226142035-nxn9d"
const UPLOADS_DIR = path.join(__dirname, "../../src/uploads")

// ── VLM: Category detection (text only) ──────────────────────────────────────

export async function detectVisualCategory(product: {
  title: string
  category?: string
  description?: string
}): Promise<{
  upload_type: string
  upload_prompt: string
  upload_tips: string
  category_label: string
  is_tryon_applicable: boolean
  not_applicable_reason: string
}> {
  const response = await byteplus.chat.completions.create({
    model: VLM_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a product categorisation AI for a visual try-on/visualisation feature.
Given a product, determine whether AI visual try-on makes sense for it, and if so, what context image the user should upload.

Visual try-on IS applicable for:
- Apparel & Accessories (clothing, shoes, bags, jewellery, watches, hats, scarves)
- Sporting Goods (wearable items like jerseys, helmets, gear)
- Luggage & Bags
- Home & Garden (furniture, decor, rugs, lamps, plants, garden items)
- Furniture
- Health & Beauty (skincare, cosmetics, beauty tools — visualise on face/body)
- Toys & Games (physical toys that can be visualised in a room)
- Animals & Pet Supplies (pet beds, cages, wearable pet accessories)
- Cameras & Optics (can be visualised on a desk or shelf)

Visual try-on is NOT applicable for:
- Food, Beverages & Tobacco
- Software (digital, subscriptions, apps)
- Services (intangible)
- Media (books, music, movies, games — digital or physical)
- Business & Industrial (machinery, raw materials, B2B equipment)
- Arts & Entertainment (tickets, events, digital art)
- Electronics (phones, laptops, cables — too small/abstract to visualise meaningfully)
- Hardware (tools, fasteners, plumbing)
- Vehicles & Parts
- Office Supplies (pens, paper, staplers)
- Baby & Toddler (clothing exception: baby clothes ARE applicable; furniture like cribs ARE applicable; food/formula is NOT)

Respond ONLY with valid JSON — no explanation, no markdown.`,
      },
      {
        role: "user",
        content: `Product: "${product.title}"
Category: "${product.category ?? "unknown"}"
Description: "${product.description ?? ""}"

Pick the best upload_type from: self, face, feet, hands, room, wall, kitchen, desk, garden, vehicle, pet, environment, none.
Return JSON: { "is_tryon_applicable": true/false, "not_applicable_reason": "..." (empty string if applicable), "upload_type": "...", "upload_prompt": "Upload a photo of ...", "upload_tips": "...", "category_label": "..." }`,
      },
    ],
    max_tokens: 250,
  })

  const raw = response.choices[0]?.message?.content ?? "{}"
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim())
    return {
      is_tryon_applicable: parsed.is_tryon_applicable ?? true,
      not_applicable_reason: parsed.not_applicable_reason ?? "",
      upload_type: parsed.upload_type ?? "environment",
      upload_prompt: parsed.upload_prompt ?? "Upload a relevant photo",
      upload_tips: parsed.upload_tips ?? "Clear, well-lit photo works best",
      category_label: parsed.category_label ?? "PRODUCT",
    }
  } catch {
    return {
      is_tryon_applicable: true,
      not_applicable_reason: "",
      upload_type: "environment",
      upload_prompt: "Upload a relevant photo",
      upload_tips: "Clear, well-lit photo works best",
      category_label: "PRODUCT",
    }
  }
}

// ── VLM: Generate Seedream prompt from 2 images ───────────────────────────────

export async function generateTryOnPrompt(opts: {
  contextImageUrl: string
  productImageUrl: string
  productTitle: string
  category: string
  uploadType: string
}): Promise<string> {
  const isApparel = ["clothing", "apparel", "fashion", "shirt", "shoes", "footwear", "accessories"].some(k =>
    opts.category.toLowerCase().includes(k) || opts.productTitle.toLowerCase().includes(k)
  )

  const editInstruction = isApparel
    ? `Dress the person in Image 1 with the exact clothing/accessory shown in Image 2 ("${opts.productTitle}"). Preserve the person's pose, face, body position, background environment, and lighting exactly. Only replace the relevant clothing/accessory — keep everything else unchanged.`
    : `Place the product from Image 2 ("${opts.productTitle}") naturally into the scene from Image 1. Keep the entire environment, lighting, perspective, and all other objects in Image 1 completely unchanged. Only add or replace the product in a realistic, well-integrated way as if it was always part of the scene.`

  const response = await byteplus.chat.completions.create({
    model: VLM_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an expert at writing image editing prompts for Seedream 4.5, a state-of-the-art image generation model.
Your task: analyse two images and write a single, precise editing prompt following Seedream 4.5 best practices.

Rules:
- Use clear natural language describing subject + action + environment.
- For editing tasks, explicitly state what to keep unchanged (pose, background, lighting, other objects).
- Be concise and precise — do NOT stack ornate or repetitive vocabulary.
- Do NOT use bullet points, markdown, or any formatting.
- Output the prompt text ONLY — no explanation, no preamble.`,
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: opts.contextImageUrl } },
          { type: "image_url", image_url: { url: opts.productImageUrl } },
          {
            type: "text",
            text: `Image 1: the user's scene/person (context type: ${opts.uploadType}).
Image 2: the product to visualise — "${opts.productTitle}" (category: ${opts.category}).

Task: ${editInstruction}

Write the Seedream 4.5 image editing prompt now.`,
          },
        ] as any,
      },
    ],
    max_tokens: 300,
  })

  return response.choices[0]?.message?.content?.trim() ?? `Place "${opts.productTitle}" naturally into the scene, keeping the environment unchanged.`
}

// ── Seedream 5.0: Generate image ──────────────────────────────────────────────

export async function generateTryOnImage(opts: {
  prompt: string
  contextImageUrl: string
  productImageUrl: string
  customerId?: string
}): Promise<string> {
  const response = await (byteplus.images.generate as any)({
    model: SEEDREAM_MODEL,
    prompt: opts.prompt,
    size: "2K",
    response_format: "url",
    image: [opts.contextImageUrl, opts.productImageUrl],
    watermark: false,
    sequential_image_generation: "disabled",
  })

  const imageUrl: string = response.data?.[0]?.url
  if (!imageUrl) throw new Error("Seedream returned no image URL")

  // Save into customer subfolder if customer_id provided
  const subdir = opts.customerId ? path.join(UPLOADS_DIR, opts.customerId) : UPLOADS_DIR
  if (!fs.existsSync(subdir)) fs.mkdirSync(subdir, { recursive: true })

  const filename = `tryon-${uuidv4()}.png`
  const localPath = path.join(subdir, filename)
  await downloadFile(imageUrl, localPath)

  return opts.customerId ? `/uploads/${opts.customerId}/${filename}` : `/uploads/${filename}`
}

// ── Upload helpers ────────────────────────────────────────────────────────────

export function saveUpload(buffer: Buffer, mimetype: string): string {
  const ext = mimetype.includes("png") ? "png" : "jpg"
  const filename = `upload-${uuidv4()}.${ext}`
  const dest = path.join(UPLOADS_DIR, filename)
  fs.writeFileSync(dest, buffer)
  return `/uploads/${filename}`
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (res) => {
      res.pipe(file)
      file.on("finish", () => { file.close(); resolve() })
    }).on("error", (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}
