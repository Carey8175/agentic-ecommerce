import * as byteplus from "../tools/byteplus"
import * as medusa from "../tools/medusa"

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
}) {
  const product = await medusa.getProductDetails(opts.product_id, opts.customerToken)
  const category = product?.categories?.[0]?.handle ?? "other"
  const productImageUrl = product?.images?.[0]?.url ?? product?.thumbnail

  if (!productImageUrl) throw new Error("Product has no image")

  // Use absolute URLs for BytePlus (it needs to fetch them)
  const contextAbsUrl = opts.context_image_url.startsWith("http")
    ? opts.context_image_url
    : `${opts.base_url}${opts.context_image_url}`

  const productAbsUrl = productImageUrl.startsWith("http")
    ? productImageUrl
    : `${opts.base_url}${productImageUrl}`

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
  })

  return {
    image_url: imageUrl,
    prompt_used: prompt,
    product: { id: product.id, title: product.title, thumbnail: product.thumbnail },
  }
}
