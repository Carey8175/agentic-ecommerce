const MEDUSA_URL = process.env.MEDUSA_URL ?? "http://localhost:9000"
const MEDUSA_API_KEY = process.env.MEDUSA_API_KEY ?? ""
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY ?? ""

async function storeReq(path: string, customerToken: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(`${MEDUSA_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
      ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
      ...(opts.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Medusa ${path} ${res.status}: ${text}`)
  }
  return res.json()
}

async function adminReq(path: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(`${MEDUSA_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MEDUSA_API_KEY}`,
      ...(opts.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Medusa admin ${path} ${res.status}: ${text}`)
  }
  return res.json()
}

// ── Products ──────────────────────────────────────────────────────────────────

let _regionId: string | null = null
async function getRegionId(customerToken: string): Promise<string> {
  if (_regionId) return _regionId
  const data = await storeReq("/store/regions?limit=1", customerToken)
  _regionId = data.regions?.[0]?.id ?? ""
  return _regionId!
}



const RESULT_COUNT = 6

// Catalog cache: fetched once, reused for the lifetime of the process.
// Avoids a 500-item Medusa round-trip on every search.
let _catalogCache: any[] | null = null
let _catalogCacheAt = 0
// Force cache miss on first request after server start

const CATALOG_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function getCatalog(customerToken: string, regionId: string): Promise<any[]> {
  const now = Date.now()
  if (_catalogCache && now - _catalogCacheAt < CATALOG_TTL_MS) return _catalogCache

  const params = new URLSearchParams({ limit: "500", fields: "id,title,description,thumbnail,handle,*categories,*variants,*variants.calculated_price,*variants.prices" })
  if (regionId) params.set("region_id", regionId)
  const data = await storeReq(`/store/products?${params}`, customerToken)
  _catalogCache = (data.products ?? []) as any[]
  _catalogCacheAt = now
  return _catalogCache
}

function priceOf(p: any): number | null {
  return p.variants?.[0]?.calculated_price?.calculated_amount
      ?? p.variants?.[0]?.prices?.[0]?.amount
      ?? null
}

function shapeProduct(p: any) {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    description: p.description?.slice(0, 120),
    thumbnail: p.thumbnail,
    variants: (p.variants ?? []).map((v: any) => ({
      id: v.id,
      title: v.title,
      price: v.calculated_price?.calculated_amount ?? v.prices?.[0]?.amount ?? null,
      currency: v.calculated_price?.currency_code ?? v.prices?.[0]?.currency_code ?? null,
      in_stock: (v.inventory_quantity ?? 1) > 0,
    })),
  }
}

export async function searchProducts(
  query: string | undefined,
  filters: { min_price?: number; max_price?: number; category?: string; in_stock?: boolean; exclude_ids?: string[] } = {},
  customerToken: string
): Promise<any[]> {
  const regionId = await getRegionId(customerToken)
  const all = await getCatalog(customerToken, regionId)

  let pool = all.filter(p => {
    if (filters.exclude_ids?.includes(p.id)) return false
    if (filters.category && !p.categories?.some((c: any) => c.handle === filters.category)) return false
    const price = priceOf(p)
    if (filters.min_price != null && price != null && price < filters.min_price) return false
    if (filters.max_price != null && price != null && price > filters.max_price) return false
    return true
  })

  // No query → random sample, zero LLM calls
  if (!query?.trim()) {
    return pool.sort(() => Math.random() - 0.5).slice(0, RESULT_COUNT).map(shapeProduct)
  }

  // Slim catalog: id + title only (~6K tokens for 500 items)
  const slim = pool.sort(() => Math.random() - 0.5).map(p => ({
    id: p.id,
    t: p.title,
    c: p.categories?.[0]?.handle ?? "",
  }))

  try {
    const byteplus = new (await import("openai")).default({
      baseURL: process.env.BYTEPLUS_BASE_URL ?? "https://ark.ap-southeast.bytepluses.com/api/v3",
      apiKey: process.env.ARK_API_KEY ?? "",
    })
    const res = await byteplus.chat.completions.create({
      model: process.env.BYTEPLUS_VLM_MODEL ?? "ep-20260408110157-vdsdd",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are a creative personal shopper. The user wants: "${query}". From the JSON list of {id, t, c} (t=title, c=category) below, return ONLY a raw JSON array of up to ${RESULT_COUNT} id strings that best match — reason creatively about activities, occasions, and vibes. No markdown, no explanation.`,
        },
        { role: "user", content: JSON.stringify(slim) },
      ],
    })
    const raw = (res.choices[0]?.message?.content ?? "").replace(/```json|```/g, "").trim()
    console.log(`[search] query="${query}" llm_raw=${raw.slice(0, 400)}`)
    // Extract all prod_* IDs via regex — tolerates truncated JSON
    const ids = Array.from(raw.matchAll(/"(prod_[A-Z0-9]+)"/g), m => m[1])
    const poolMap: Record<string, any> = {}
    for (const p of pool) poolMap[p.id] = p
    const ranked = ids.map(id => poolMap[id]).filter(Boolean)
    console.log(`[search] resolved ${ranked.length}/${ids.length} ids`)
    if (ranked.length) return ranked.map(shapeProduct)
  } catch (e) {
    console.error("Semantic search failed, falling back", e)
  }

  return pool.slice(0, RESULT_COUNT).map(shapeProduct)
}

export async function getProductDetails(product_id: string, customerToken: string) {
  const data = await storeReq(`/store/products/${product_id}`, customerToken)
  return data.product
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export async function getCart(cartId: string, customerToken: string) {
  const data = await storeReq(
    `/store/carts/${cartId}?fields=*items,*items.variant,*items.variant.product,+items.unit_price,+items.subtotal,+items.total`,
    customerToken
  )
  return data.cart
}

export async function addToCart(cartId: string, variant_id: string, quantity: number, customerToken: string) {
  const data = await storeReq(`/store/carts/${cartId}/line-items`, customerToken, {
    method: "POST",
    body: JSON.stringify({ variant_id, quantity }),
  })
  return data.cart
}

export async function removeFromCart(cartId: string, lineItemId: string, customerToken: string) {
  const data = await storeReq(`/store/carts/${cartId}/line-items/${lineItemId}`, customerToken, {
    method: "DELETE",
  })
  return data.cart
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function listOrders(customerToken: string) {
  const data = await storeReq("/store/orders?limit=10&fields=*items,*items.variant,*items.variant.product,+fulfillments,+fulfillments.labels", customerToken)
  return (data.orders ?? []).map((o: any) => ({
    id: o.id,
    display_id: o.display_id,
    status: o.status,
    fulfillment_status: o.fulfillment_status,
    total: o.total,
    currency_code: o.currency_code,
    created_at: o.created_at,
    items: (o.items ?? []).map((i: any) => ({
      title: i.title,
      quantity: i.quantity,
      thumbnail: i.variant?.product?.thumbnail ?? i.thumbnail,
      handle: i.variant?.product?.handle
    })),
    tracking_numbers: (o.fulfillments ?? [])
      .flatMap((f: any) => f.labels ?? f.tracking_links ?? [])
      .map((t: any) => t.tracking_number ?? t.url ?? t.tracking_url)
      .filter(Boolean),
  }))
}

export async function getOrderStatus(order_id: string, customerToken: string) {
  const data = await storeReq(
    `/store/orders/${order_id}?fields=*items,*items.variant,*items.variant.product,+fulfillments,+fulfillments.labels`,
    customerToken
  )
  const o = data.order
  return {
    id: o.id,
    display_id: o.display_id,
    status: o.status,
    fulfillment_status: o.fulfillment_status,
    total: o.total,
    currency_code: o.currency_code,
    items: (o.items ?? []).map((i: any) => ({
      title: i.title,
      quantity: i.quantity,
      thumbnail: i.variant?.product?.thumbnail ?? i.thumbnail,
      handle: i.variant?.product?.handle
    })),
    tracking_numbers: (o.fulfillments ?? [])
      .flatMap((f: any) => f.labels ?? f.tracking_links ?? [])
      .map((t: any) => t.tracking_number ?? t.url ?? t.tracking_url)
      .filter(Boolean),
    shipping_address: o.shipping_address,
  }
}

export async function getLatestOrder(customerToken: string) {
  const orders = await listOrders(customerToken)
  return orders[0] ?? null
}

// ── Checkout ──────────────────────────────────────────────────────────────────

export async function prepareCheckout(cartId: string, customerToken: string) {
  const cart = await getCart(cartId, customerToken)
  return {
    items: (cart.items ?? []).map((i: any) => ({
      id: i.id,
      title: i.title,
      quantity: i.quantity,
      unit_price: i.unit_price ?? i.subtotal ?? 0,
      total: i.total ?? i.subtotal ?? (i.unit_price ? i.unit_price * i.quantity : 0),
      thumbnail: i.thumbnail,
    })),
    subtotal: cart.subtotal,
    shipping_total: cart.shipping_total,
    discount_total: cart.discount_total,
    total: cart.total,
    currency_code: cart.currency_code,
    shipping_address: cart.shipping_address,
    payment_method: "Manual Payment",
  }
}

export async function completeCheckout(
  cartId: string,
  customerToken: string,
  addressId?: string
) {
  // 1. Set shipping address if provided — fetch full address then apply to cart
  if (addressId) {
    try {
      const addrData = await storeReq(`/store/customers/me/addresses/${addressId}`, customerToken)
      const a = addrData.address
      if (a) {
        await storeReq(`/store/carts/${cartId}`, customerToken, {
          method: "POST",
          body: JSON.stringify({
            shipping_address: {
              first_name: a.first_name,
              last_name: a.last_name,
              address_1: a.address_1,
              address_2: a.address_2 ?? "",
              city: a.city,
              province: a.province ?? "",
              postal_code: a.postal_code,
              country_code: a.country_code,
              phone: a.phone ?? "",
            },
          }),
        })
      }
    } catch {
      // Address not found — proceed with cart's existing address
    }
  }

  // Validate cart is not already completed
  const cartCheck = await storeReq(`/store/carts/${cartId}`, customerToken)
  if (cartCheck.cart?.completed_at) {
    throw new Error("Your cart has already been checked out. Please add items to your new cart first.")
  }

  // 2. Get available shipping options
  const shippingData = await storeReq(
    `/store/shipping-options?cart_id=${cartId}`,
    customerToken
  )
  const shippingOption = shippingData.shipping_options?.[0]
  if (!shippingOption) throw new Error("No shipping options available")

  // 3. Add shipping method
  await storeReq(`/store/carts/${cartId}/shipping-methods`, customerToken, {
    method: "POST",
    body: JSON.stringify({ option_id: shippingOption.id }),
  })

  // 4. Create payment collection and initialize session
  const cart = await storeReq(`/store/carts/${cartId}`, customerToken)
  let paymentCollectionId = cart.cart?.payment_collection?.id
  if (!paymentCollectionId) {
    const pc = await storeReq(`/store/payment-collections`, customerToken, {
      method: "POST",
      body: JSON.stringify({ cart_id: cartId }),
    })
    paymentCollectionId = pc.payment_collection?.id
  }
  await storeReq(`/store/payment-collections/${paymentCollectionId}/payment-sessions`, customerToken, {
    method: "POST",
    body: JSON.stringify({ provider_id: "pp_system_default" }),
  })

  // 5. Complete cart
  const data = await storeReq(`/store/carts/${cartId}/complete`, customerToken, {
    method: "POST",
  })

  if (data.type === "cart") throw new Error(data.error ?? "Checkout failed")
  return data.order
}

// ── Customer ──────────────────────────────────────────────────────────────────

export async function getCustomer(customerToken: string) {
  const data = await storeReq("/store/customers/me", customerToken)
  return data.customer
}

export async function getCustomerAddresses(customerToken: string) {
  const data = await storeReq("/store/customers/me/addresses", customerToken)
  return data.addresses ?? []
}

// ── Agent config (from Medusa admin) ─────────────────────────────────────────

export async function getAgentConfig() {
  try {
    const data = await adminReq("/admin/agent-config")
    return data.config ?? null
  } catch {
    return null
  }
}
