import * as byteplus from "../tools/byteplus"
import * as medusa from "../tools/medusa"
import fs from "fs"
import path from "path"

export async function detectCategory(product_id: string, customerToken: string) {
  const product = await medusa.getProductDetails(product_id, customerToken)
  const category = product?.categories?.[0]?.handle ?? product?.type?.value ?? "other"
  return byteplus.detectVisualCategory({
    title: product.title,
    category,
    description: product.description,
  })
}

export async function generateTryOn(opts: {
  product_id: string
  context_image_url: string
  customerToken: string
  base_url: string
  customerId?: string
}) {
  const product = await medusa.getProductDetails(opts.product_id, opts.customerToken)
  const category = product?.categories?.[0]?.handle ?? "other"
  const productImageUrl = product?.thumbnail ?? product?.images?.[0]?.url

  if (!productImageUrl) throw new Error("Product has no image")

  // Convert all image URLs to base64 — BytePlus cannot reach localhost URLs
  const contextAbsUrl = await urlToBase64(opts.context_image_url, opts.base_url)
  const productAbsUrl = await urlToBase64(productImageUrl, opts.base_url)

  // Stage 1: VLM generates the Seedream prompt
  const prompt = await byteplus.generateTryOnPrompt({
    contextImageUrl: contextAbsUrl,
    productImageUrl: productAbsUrl,
    productTitle: product.title,
    category,
    uploadType: "context",
  })

  // Stage 2: Seedream generates the image
  const imageUrl = await byteplus.generateTryOnImage({
    prompt,
    contextImageUrl: contextAbsUrl,
    productImageUrl: productAbsUrl,
    customerId: opts.customerId,
  })

  return {
    image_url: imageUrl,
    prompt_used: prompt,
    product: { id: product.id, title: product.title, thumbnail: product.thumbnail },
  }
}

// Converts any image URL to a base64 data URL.
// - Local /uploads/ paths are read directly from disk (fast, no HTTP)
// - localhost:* URLs are fetched server-side (agent-service can reach them)
// - External URLs are fetched normally
async function urlToBase64(url: string, base_url: string): Promise<string> {
  // 1. Local disk file via /uploads/ path
  const uploadsPrefix = `${base_url}/uploads/`
  let filePath: string | null = null

  if (url.startsWith(uploadsPrefix)) {
    filePath = path.join(__dirname, "../../src/uploads", url.slice(uploadsPrefix.length))
  } else if (url.startsWith("/uploads/")) {
    filePath = path.join(__dirname, "../../src/uploads", url.slice("/uploads/".length))
  }

  if (filePath && fs.existsSync(filePath)) {
    const ext = path.extname(filePath).slice(1).toLowerCase() || "jpeg"
    const mime = ext === "png" ? "image/png" : "image/jpeg"
    const data = fs.readFileSync(filePath).toString("base64")
    return `data:${mime};base64,${data}`
  }

  // 2. Resolve relative URLs
  const absUrl = url.startsWith("http") ? url : `${base_url}${url}`

  // 3. Fetch from the network (works for both localhost and external CDN)
  const res = await fetch(absUrl)
  if (!res.ok) throw new Error(`Failed to fetch image ${absUrl}: ${res.status}`)
  const contentType = res.headers.get("content-type") ?? "image/jpeg"
  const buffer = Buffer.from(await res.arrayBuffer())
  return `data:${contentType};base64,${buffer.toString("base64")}`
}
