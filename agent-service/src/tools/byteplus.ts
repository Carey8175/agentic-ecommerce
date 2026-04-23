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
}> {
  const response = await byteplus.chat.completions.create({
    model: VLM_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a product categorisation AI for a visual try-on/visualisation feature.
Given a product, determine the best context image the user should upload.
Respond ONLY with valid JSON — no explanation, no markdown.`,
      },
      {
        role: "user",
        content: `Product: "${product.title}"
Category: "${product.category ?? "unknown"}"
Description: "${product.description ?? ""}"

Pick the best upload_type from: self, face, feet, hands, room, wall, kitchen, desk, garden, vehicle, pet, environment, none.
Return JSON: { "upload_type": "...", "upload_prompt": "Upload a photo of ...", "upload_tips": "...", "category_label": "..." }`,
      },
    ],
    max_tokens: 200,
  })

  const raw = response.choices[0]?.message?.content ?? "{}"
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim())
  } catch {
    return {
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
  const response = await byteplus.chat.completions.create({
    model: VLM_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a visual AI for a photorealistic image generation pipeline.
Analyse both images and output ONLY a detailed Seedream 5.0 generation prompt.
No explanation. No markdown. Output the prompt text only.`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: opts.contextImageUrl },
          },
          {
            type: "image_url",
            image_url: { url: opts.productImageUrl },
          },
          {
            type: "text",
            text: `Image 1 is the user's context (${opts.uploadType}).
Image 2 is the product: "${opts.productTitle}" (category: ${opts.category}).
Generate a detailed, photorealistic Seedream 5.0 prompt showing the product
naturally in/on/with the context. Style: professional product photography,
natural lighting, high detail.`,
          },
        ] as any,
      },
    ],
    max_tokens: 400,
  })

  return response.choices[0]?.message?.content?.trim() ?? `${opts.productTitle} in a natural setting`
}

// ── Seedream 5.0: Generate image ──────────────────────────────────────────────

export async function generateTryOnImage(opts: {
  prompt: string
  contextImageUrl: string
  productImageUrl: string
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

  // Download and save locally (BytePlus URLs expire in 24h)
  const filename = `tryon-${uuidv4()}.png`
  const localPath = path.join(UPLOADS_DIR, filename)
  await downloadFile(imageUrl, localPath)

  return `/uploads/${filename}`
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
