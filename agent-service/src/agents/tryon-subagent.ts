import * as medusa from "../tools/medusa"

// Resolves the context image URL from profile — throws user-friendly error if not found
export async function resolveContextImage(opts: {
  context_image_url?: string
  customer_token: string
  prefer_home?: boolean
}): Promise<string> {
  const { customer_token, prefer_home = false } = opts
  let context_image_url = opts.context_image_url

  if (!context_image_url) {
    const customer = await medusa.getCustomer(customer_token).catch(() => null)
    const profile = customer?.metadata?.tryon_personalization

    if (profile?.images) {
      context_image_url = prefer_home
        ? (profile.images.home_url ?? profile.images.self_url ?? undefined)
        : (profile.images.self_url ?? profile.images.home_url ?? undefined)
    }

    if (!context_image_url) {
      throw new Error(
        "No saved profile photo found for try-on. Please upload one at **Account → Profile → Try-On & Personalization** (scroll to the bottom of your profile page), then try again."
      )
    }
  }

  return context_image_url
}
