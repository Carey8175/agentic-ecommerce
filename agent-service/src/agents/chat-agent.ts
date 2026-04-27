import OpenAI from "openai"
import { Response } from "express"
import * as medusa from "../tools/medusa"
import { getMessages, appendMessage, updateSessionTitle } from "../db/history"
import { getSettings } from "../db/settings"
import { createTicket } from "../db/tickets"
import { runRecommendationAgent } from "./recommendation-agent"
import { resolveContextImage } from "./tryon-subagent"
import { detectVisualCategory } from "../tools/byteplus"

const byteplus = new OpenAI({
  baseURL: process.env.BYTEPLUS_BASE_URL ?? "https://ark.ap-southeast.bytepluses.com/api/v3",
  apiKey: process.env.ARK_API_KEY ?? "",
})

const MODEL = process.env.BYTEPLUS_VLM_MODEL ?? "ep-20260408110157-vdsdd"

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Search the store for products by keyword, intent, or description. The search engine is highly intelligent and can understand abstract intents (e.g., 'summer clothing', 'gifts'). Returns product cards. Use proactively for discovery and recommendations.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "User's intent, mood, occasion, or search query. Always populate this — the search engine understands abstract concepts like 'beach', 'summer', 'gifts for mom', 'cozy home'. Never leave blank just because you don't know the exact category handle." },
          category: { type: "string", description: "Exact category handle filter (optional). Only set this if the user explicitly names a known store category. Do NOT guess category handles — leave omitted if unsure." },
          min_price: { type: "number", description: "Minimum price filter in dollars (optional)" },
          max_price: { type: "number", description: "Maximum price filter in dollars (optional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Get full details for a specific product including all variants, stock levels, and description.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string" },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "view_cart",
      description: "Get the current cart contents, item count, and totals.",
      parameters: {
        type: "object",
        properties: {
          cart_id: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_from_cart",
      description: "Remove a specific item from the cart by line item ID.",
      parameters: {
        type: "object",
        properties: {
          cart_id: { type: "string" },
          line_item_id: { type: "string" },
        },
        required: ["line_item_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_orders",
      description: "List the customer's recent orders with status and fulfillment info.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_order_status",
      description: "Get status, fulfillment, and tracking for a specific order.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string" },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "initiate_return",
      description: "Initiate a return request for items in an order.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string" },
          reason: { type: "string" },
        },
        required: ["order_id", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "prepare_checkout",
      description:
        "Prepare a checkout summary showing all cart items, totals, address, and payment. Call when the user wants to checkout. This renders a checkout confirmation card in the UI with a Place Order button.",
      parameters: {
        type: "object",
        properties: {
          cart_id: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "redirect_to_tryon",
      description:
        "Switch the user to the Visual Studio tab to try on or visualise a product. Call when the user asks to see how something looks on them, in their space, or on their pet etc.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "Product to pre-select (optional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_order",
      description: "Cancel a customer's order. Only possible within 24 hours of placement. If outside 24h, automatically creates a support ticket instead.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "The order ID to cancel" },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_similar_products",
      description: "Find products similar to a given product — same category, different items. Use when a customer asks 'anything similar?', 'show me alternatives', or 'what else is like this?'.",
      parameters: {
        type: "object",
        properties: {
          product_handle: { type: "string", description: "The handle of the product to find similar items for" },
        },
        required: ["product_handle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "estimate_shipping",
      description: "Show available shipping options and estimated costs for the customer's current cart.",
      parameters: {
        type: "object",
        properties: {
          cart_id: { type: "string", description: "Cart ID (optional — will use active cart)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reorder",
      description: "Add all items from a previous order back into the customer's current cart. Use when customer says 'reorder', 'order again', 'buy this again'.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "The order ID to reorder from" },
        },
        required: ["order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_promotions",
      description: "Fetch active promo codes and discounts available in the store. Use when the customer asks about discounts, promo codes, deals, or sales.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delegate_to_recommendation_agent",
      description:
        "Delegate to the Recommendation Subagent when the user asks for personalized product suggestions, discovery, or similar/alternative products. Use for intents like: 'recommend something for me', 'what should I buy', 'based on my profile', 'similar to X', 'alternatives to X', 'more like this'. The subagent uses the customer's saved profile and order history.",
      parameters: {
        type: "object",
        properties: {
          user_message: {
            type: "string",
            description: "The user's recommendation request, verbatim or lightly paraphrased",
          },
          product_handle: {
            type: "string",
            description: "If the user is asking for similar/alternatives to a specific product, pass its handle here (optional)",
          },
        },
        required: ["user_message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delegate_to_tryon_subagent",
      description:
        "Delegate to the Try-On Subagent when the user wants to visualize a product on themselves or in their home/room. The subagent will automatically use the customer's saved profile photo (self or home) if no context image is provided. Use for intents like: 'show me wearing this', 'how would this look in my room', 'try this on me'.",
      parameters: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            description: "The product ID to try on",
          },
          context_image_url: {
            type: "string",
            description: "URL of the user-uploaded context image for this session (optional — falls back to saved profile photo)",
          },
          prefer_home: {
            type: "boolean",
            description: "Set true when the user wants to see the product in their room/home rather than on themselves (optional)",
          },
        },
        required: ["product_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_support_ticket",
      description: "Create a support ticket when the AI cannot resolve the issue (e.g. refund, return, damaged item, missing item, or order cancellation outside 24h). This escalates to a human operator.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "Related order ID (optional)" },
          order_display_id: { type: "number", description: "Order display number e.g. #12 (optional)" },
          type: { type: "string", enum: ["refund", "return", "damaged", "missing", "general"], description: "Type of issue" },
          subject: { type: "string", description: "Short summary of the issue" },
          initial_message: { type: "string", description: "Full description of the customer's issue, written from the customer's perspective" },
        },
        required: ["type", "subject", "initial_message"],
      },
    },
  },
]

function buildSystemPrompt(config: any, customer: any): string {
  const name = config?.name ?? "Byteshop Assistant"
  const tone = config?.tone ?? "friendly and helpful"
  const faqs = (config?.faqs ?? [])
    .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
    .join("\n\n")
  const knowledge = (config?.knowledge_base ?? [])
    .map((k: any) => `${k.title}:\n${k.content}`)
    .join("\n\n")
  const customPrompt = config?.system_prompt ?? ""

  return `You are ${name}, the AI shopping assistant for Byteshop. Be ${tone}.

You help customers with: product search and recommendations, cart management, order tracking and returns, checkout, and general store FAQs.

RULES:
- When a user asks to see how something looks on them or in their space, call redirect_to_tryon
- When a user wants to checkout, call prepare_checkout to show the order summary with a Place Order button
- When returning a list of products, orders, or a cart, DO NOT summarize or list the items in text. The UI will automatically render a beautiful visual card for each product, order, or cart item. You should simply write a short introductory sentence like "Here are some great options:", "Here are your orders:", or "Here is your cart:".
- Never place orders or add items to cart autonomously — surface UI actions for the user
- For add to cart, show the product card and tell the user to click "Add to Cart" on the card
- Be concise — 2-3 sentences max unless explaining something complex
- If you don't know something, say so honestly
- When a user asks about tracking for a specific order, call get_order_status with the order_id and explicitly state the tracking number(s) in your text response. If tracking_numbers is empty, tell the user the order hasn't shipped yet.
- When a user asks to track an order without specifying which one, call list_orders first so they can pick one, then call get_order_status once they identify the order.
- When a user wants to cancel an order, call cancel_order. If it returns eligible=true, a confirmation card will appear — tell the user to confirm using the card below (do NOT say the order has been cancelled yet). If it returns eligible=false, a support ticket has ALREADY been created automatically — do NOT call create_support_ticket again. Just tell the user the ticket has been raised and they can track it on the Customer Support page.
- When a user reports a damaged item, missing item, or requests a refund/return that you cannot handle automatically, call create_support_ticket to escalate to a human operator. Tell the user their ticket has been created and they can track it on the Customer Support page.
- For change email/password/address requests, tell the user to visit their Account → Profile page.
- When a user asks for something similar to a product, call get_similar_products with the product_handle. Never make up handles — only use handles from products already shown in this conversation.
- When a user asks about shipping costs or delivery options, call estimate_shipping.
- When a user wants to reorder a previous order, call list_orders first if you don't have the order_id, then call reorder with the correct order_id. After reordering, tell the user items were added and they can view their cart.
- When searching for products, always put the user's full intent in the query field — "beach apparel", "something for summer", "gifts for mom" are all valid queries. Never set category unless you know the exact handle. If the first search returns nothing, try again with a broader or reworded query before saying nothing is available.
- When a user asks about discounts, deals, promo codes, or sales, call get_promotions. Do NOT list or describe the codes in text — the UI renders a card automatically. Just say "Here are our active promotions:" if there are any, or "There are no active promotions right now." if empty.
- Never invent ticket IDs, promo codes, or order statuses — only use data returned by tools.
- When a user asks for personalized recommendations, discovery, or similar/alternative products, call delegate_to_recommendation_agent. Pass the user's message and optionally the product_handle if they want alternatives to a specific product.
- When a user wants to see a product on themselves or in their home/room, call delegate_to_tryon_subagent with the product_id. The subagent will use the customer's saved profile photos automatically. Set prefer_home=true if they mention room/home/space.
- After delegate_to_recommendation_agent returns, relay its text response to the user. Do NOT add your own product list — the subagent's products are already rendered.
- After delegate_to_tryon_subagent returns: if the result contains a "user_error" field, relay that exact message to the user verbatim — do NOT rephrase it or blame a service issue. If the result contains a "job_id", tell the user the try-on is being generated and they can check the Try-On page for results — it usually takes about 30 seconds.

Current customer: ${customer?.first_name ? `${customer.first_name} ${customer.last_name}` : "Guest"}
Current date: ${new Date().toDateString()}
${customPrompt ? `\nAdditional instructions:\n${customPrompt}` : ""}
${faqs ? `\nFAQs:\n${faqs}` : ""}
${knowledge ? `\nKnowledge base:\n${knowledge}` : ""}`
}

export async function runChatAgent(opts: {
  session_id: string
  customer_id: string | null
  cart_id: string | null
  customer_token: string
  user_message: string
  res: Response
}) {
  const { session_id, customer_id, cart_id, customer_token, user_message, res } = opts

  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")
  res.flushHeaders()

  function send(event: object) {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  try {
    const settings = customer_id ? getSettings(customer_id) : null
    const historyWindow = settings?.history_window ?? 30

    const [history, config, customer] = await Promise.all([
      Promise.resolve(getMessages(session_id, historyWindow)),
      medusa.getAgentConfig(),
      customer_token ? medusa.getCustomer(customer_token).catch(() => null) : Promise.resolve(null),
    ])

    appendMessage({ session_id, role: "user", content: user_message })

    if (history.length === 0) {
      updateSessionTitle(session_id, user_message.slice(0, 60) + (user_message.length > 60 ? "…" : ""))
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(config, customer) },
      ...history.map((m: any) => {
        const base: any = { role: m.role, content: m.content || null }
        if (m.role === "assistant" && m.tool_calls) {
          try {
            const parsed = JSON.parse(m.tool_calls)
            base.tool_calls = parsed.map((tc: any) => ({
              id: tc.id,
              type: "function",
              function: { name: tc.name, arguments: tc.arguments }
            }))
          } catch { /* empty */ }
        }
        if (m.role === "tool") {
          base.tool_call_id = m.tool_call_id
        }
        return base
      }),
      { role: "user", content: user_message },
    ]

    let assistantContent = ""
    let continueLoop = true
    // Accumulated card data to persist with the final assistant message
    const uiDataAccum: Record<string, any> = {}

    while (continueLoop) {
      const stream = await byteplus.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        tools: TOOLS,
        tool_choice: "auto",
        messages,
        stream: true,
      })

      let currentText = ""
      let stopReason = ""
      const toolCallMap: Record<number, { id: string; name: string; arguments: string }> = {}

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        const finishReason = chunk.choices[0]?.finish_reason

        if (delta?.content) {
          currentText += delta.content
          assistantContent += delta.content
          send({ type: "token", content: delta.content })
        }

        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!toolCallMap[tc.index]) {
              toolCallMap[tc.index] = { id: tc.id ?? "", name: tc.function?.name ?? "", arguments: "" }
              send({ type: "tool_start", tool: tc.function?.name ?? "" })
            }
            if (tc.function?.arguments) {
              toolCallMap[tc.index].arguments += tc.function.arguments
            }
          }
        }

        if (finishReason) stopReason = finishReason
      }

      const toolCalls = Object.values(toolCallMap)

      console.log("stopReason:", stopReason, "toolCalls:", toolCalls.length)

      if (stopReason === "tool_calls" && toolCalls.length > 0) {
        const assistantMsg: OpenAI.Chat.ChatCompletionMessageParam = {
          role: "assistant",
          content: currentText || null,
          tool_calls: toolCalls.map(tc => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        }
        messages.push(assistantMsg)

        // Save the assistant's tool call intent to history
        appendMessage({
          session_id,
          role: "assistant",
          content: currentText || "",
          tool_calls: JSON.stringify(toolCalls),
        })

        for (const tc of toolCalls) {
          let input: any = {}
          try { input = JSON.parse(tc.arguments) } catch { /* empty */ }

          let result: any = null

          try {
            switch (tc.name) {
              case "search_products": {
                const exclude_ids: string[] = []
                history.forEach((m: any) => {
                  if (m.role === "tool" && m.tool_name === "search_products") {
                    try {
                      const data = JSON.parse(m.content)
                      if (Array.isArray(data)) data.forEach((p: any) => { if (p.id) exclude_ids.push(p.id) })
                    } catch { /* empty */ }
                  }
                })
                input.exclude_ids = exclude_ids

                const products = await medusa.searchProducts(input.query, input, customer_token)
                result = products
                uiDataAccum.products = products
                send({ type: "tool_result", tool: "search_products", data: products })
                break
              }
              case "get_product_details": {
                const product = await medusa.getProductDetails(input.product_id, customer_token)
                result = product
                uiDataAccum.products = [product]
                send({ type: "tool_result", tool: "get_product_details", data: product })
                break
              }
              case "view_cart": {
                const cid = cart_id ?? input.cart_id
                if (!cid) { result = { error: "No active cart" }; break }
                const cart = await medusa.getCart(cid, customer_token)
                result = cart
                uiDataAccum.cartData = cart
                send({ type: "ui_action", action: "show_cart", data: cart })
                break
              }
              case "remove_from_cart": {
                const cid = cart_id ?? input.cart_id
                if (!cid) { result = { error: "No active cart" }; break }
                const cart = await medusa.removeFromCart(cid, input.line_item_id, customer_token)
                result = cart
                send({ type: "tool_result", tool: "remove_from_cart", data: cart })
                break
              }
              case "list_orders": {
                const orders = await medusa.listOrders(customer_token)
                result = orders
                uiDataAccum.orders = orders
                send({ type: "ui_action", action: "show_orders", data: orders })
                break
              }
              case "get_order_status": {
                const order = await medusa.getOrderStatus(input.order_id, customer_token)
                result = order
                uiDataAccum.orders = [order]
                send({ type: "ui_action", action: "show_orders", data: [order] })
                break
              }
              case "initiate_return": {
                const ticket = createTicket({
                  customer_id: customer_id ?? "guest",
                  subject: `Return request for order ${input.order_id}`,
                  initial_message: input.reason ?? "Customer requested a return.",
                  type: "return",
                })
                send({ type: "ui_action", action: "show_ticket_created", ticket_id: ticket.id })
                result = { ticket_id: ticket.id, status: "open", message: "Return request created. Our support team will be in touch within 1-2 business days." }
                break
              }
              case "prepare_checkout": {
                const cid = cart_id ?? input.cart_id
                if (!cid) { result = { error: "No active cart" }; break }
                // Auto-apply active promos to cart before building summary
                const appliedPromos: string[] = []
                try {
                  const promos = await medusa.getActivePromotions()
                  for (const promo of promos) {
                    try {
                      await medusa.applyPromotionsToCart(cid, [promo.code], customer_token)
                      appliedPromos.push(promo.code)
                    } catch { /* skip ineligible promo */ }
                  }
                } catch { /* promos optional — don't block checkout */ }
                const summary = await medusa.prepareCheckout(cid, customer_token)
                const custSettings = customer_id ? getSettings(customer_id) : null
                const one_click_enabled = !!(custSettings?.one_click_checkout_enabled)
                const checkoutPayload = { ...summary, one_click_enabled, applied_promos: appliedPromos }
                uiDataAccum.checkoutData = checkoutPayload
                result = checkoutPayload
                send({ type: "ui_action", action: "show_checkout_confirm", data: checkoutPayload })
                break
              }
              case "redirect_to_tryon": {
                send({ type: "ui_action", action: "redirect_to_tryon", product_id: input.product_id ?? null })
                result = { redirected: true }
                break
              }
              case "get_similar_products": {
                const similar = await medusa.getSimilarProducts(input.product_handle, customer_token)
                result = similar
                send({ type: "tool_result", tool: "search_products", data: similar })
                break
              }
              case "estimate_shipping": {
                const cid = cart_id ?? input.cart_id
                if (!cid) { result = { error: "No active cart" }; break }
                const options = await medusa.getShippingOptions(cid, customer_token)
                result = options
                break
              }
              case "reorder": {
                const cid = cart_id ?? input.cart_id
                if (!cid) { result = { error: "No active cart — please start shopping first" }; break }
                const reorderResult = await medusa.reorderItems(input.order_id, cid, customer_token)
                result = reorderResult
                if (reorderResult.cart) {
                  uiDataAccum.cartData = reorderResult.cart
                  send({ type: "ui_action", action: "show_cart", data: reorderResult.cart })
                }
                break
              }
              case "get_promotions": {
                const promos = await medusa.getActivePromotions()
                result = promos
                if (promos.length > 0) {
                  uiDataAccum.promotions = promos
                  send({ type: "ui_action", action: "show_promotions", data: promos })
                }
                break
              }
              case "cancel_order": {
                // Fetch order to check eligibility, then show confirmation card — don't auto-cancel
                const orderData = await medusa.getOrderStatus(input.order_id, customer_token)
                const createdAt = new Date(orderData.created_at ?? Date.now()).getTime()
                const hoursSince = (Date.now() - createdAt) / (1000 * 60 * 60)
                if (hoursSince > 24) {
                  // Outside window — create ticket automatically
                  const ticket = createTicket({
                    customer_id: customer_id ?? undefined,
                    order_id: input.order_id,
                    order_display_id: orderData.display_id,
                    type: "refund",
                    subject: `Cancellation request for Order #${orderData.display_id}`,
                    initial_message: `Customer requested cancellation of Order #${orderData.display_id} but it is outside the 24-hour cancellation window. Requesting manual review.`,
                    session_id: session_id ?? undefined,
                  })
                  result = { eligible: false, ticket_id: ticket.id }
                  send({ type: "ui_action", action: "show_ticket_created", ticket_id: ticket.id, order_display_id: orderData.display_id })
                } else {
                  // Within window — show confirmation card, let customer press the button
                  result = { eligible: true, order_id: input.order_id, display_id: orderData.display_id }
                  send({ type: "ui_action", action: "show_cancel_confirm", order_id: input.order_id, display_id: orderData.display_id })
                }
                break
              }
              case "delegate_to_recommendation_agent": {
                const recHistory = history
                  .filter((m: any) => m.role === "user" || m.role === "assistant")
                  .slice(-10)
                  .map((m: any) => ({ role: m.role, content: m.content || "" }))

                const recResult = await runRecommendationAgent({
                  user_message: input.user_message,
                  customer_token,
                  customer,
                  conversation_history: recHistory,
                  send,
                })

                result = { text: recResult.text }
                if (recResult.products?.length) {
                  uiDataAccum.products = recResult.products
                }
                break
              }
              case "delegate_to_tryon_subagent": {
                const baseUrl = process.env.AGENT_SERVICE_URL ?? "http://localhost:3001"

                try {
                  // Check if try-on is applicable for this product before doing anything
                  const product = await medusa.getProductDetails(input.product_id, customer_token).catch(() => null)
                  if (product) {
                    const categoryInfo = await detectVisualCategory({
                      title: product.title,
                      category: product.categories?.[0]?.handle ?? product.type?.value,
                      description: product.description ?? "",
                    })
                    if (!categoryInfo.is_tryon_applicable) {
                      const reason = categoryInfo.not_applicable_reason || "This product type isn't suitable for visual try-on."
                      result = { user_error: `Sorry, virtual try-on isn't available for **${product.title}**. ${reason}` }
                      break
                    }
                  }

                  const contextImageUrl = await resolveContextImage({
                    context_image_url: input.context_image_url,
                    customer_token,
                    prefer_home: input.prefer_home ?? false,
                  })

                  const jobRes = await fetch(`${baseUrl}/agent/tryon-jobs`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-customer-id": customer_id ?? "",
                      "x-customer-token": customer_token,
                    },
                    body: JSON.stringify({
                      product_id: input.product_id,
                      context_image_url: contextImageUrl,
                      prefer_home: input.prefer_home ?? false,
                    }),
                  })
                  if (!jobRes.ok) {
                    const err = await jobRes.json().catch(() => ({ message: jobRes.statusText })) as { message?: string }
                    throw new Error(`Failed to queue try-on: ${err.message ?? jobRes.statusText}`)
                  }
                  const job = await jobRes.json() as { job_id: string; status: string }
                  result = { job_id: job.job_id, status: "pending" }
                  send({ type: "ui_action", action: "tryon_job_queued", data: { job_id: job.job_id } })
                } catch (tryonErr: any) {
                  result = { user_error: tryonErr.message }
                }
                break
              }
              case "create_support_ticket": {
                const ticket = createTicket({
                  customer_id: customer_id ?? undefined,
                  order_id: input.order_id,
                  order_display_id: input.order_display_id,
                  type: input.type,
                  subject: input.subject,
                  initial_message: input.initial_message,
                  session_id: session_id ?? undefined,
                })
                result = { ticket_id: ticket.id, status: "open" }
                send({ type: "ui_action", action: "show_ticket_created", ticket_id: ticket.id })
                break
              }
              default:
                result = { error: `Unknown tool: ${tc.name}` }
            }
          } catch (err: any) {
            result = { error: err.message }
          }

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          })

          appendMessage({
            session_id,
            role: "tool",
            content: JSON.stringify(result),
            tool_name: tc.name,
            tool_call_id: tc.id,
          })
        }
      } else {
        continueLoop = false
      }
    }

    if (assistantContent) {
      const ui_data = Object.keys(uiDataAccum).length > 0 ? JSON.stringify(uiDataAccum) : undefined
      appendMessage({ session_id, role: "assistant", content: assistantContent, ui_data })
    }

    send({ type: "done" })
    res.end()
  } catch (err: any) {
    send({ type: "error", message: err.message ?? "Unknown error" })
    res.end()
  }
}
