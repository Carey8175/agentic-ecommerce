import OpenAI from "openai"
import { Response } from "express"
import * as medusa from "../tools/medusa"
import { getMessages, appendMessage, updateSessionTitle } from "../db/history"
import { getSettings } from "../db/settings"

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
          query: { type: "string", description: "User's intent or search query (optional, omit to search purely by price/category)" },
          category: { type: "string", description: "Product category handle (optional)" },
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
                send({ type: "tool_result", tool: "search_products", data: products })
                break
              }
              case "get_product_details": {
                const product = await medusa.getProductDetails(input.product_id, customer_token)
                result = product
                send({ type: "tool_result", tool: "get_product_details", data: product })
                break
              }
              case "view_cart": {
                const cid = cart_id ?? input.cart_id
                if (!cid) { result = { error: "No active cart" }; break }
                const cart = await medusa.getCart(cid, customer_token)
                result = cart
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
                send({ type: "ui_action", action: "show_orders", data: orders })
                break
              }
              case "get_order_status": {
                const order = await medusa.getOrderStatus(input.order_id, customer_token)
                result = order
                send({ type: "ui_action", action: "show_orders", data: [order] })
                break
              }
              case "initiate_return": {
                result = { message: "Return request initiated. Our team will be in touch within 1-2 business days.", order_id: input.order_id }
                break
              }
              case "prepare_checkout": {
                const cid = cart_id ?? input.cart_id
                if (!cid) { result = { error: "No active cart" }; break }
                const summary = await medusa.prepareCheckout(cid, customer_token)
                const custSettings = customer_id ? getSettings(customer_id) : null
                const one_click_enabled = !!(custSettings?.one_click_checkout_enabled)
                console.log(`[checkout] customer_id=${customer_id} one_click=${one_click_enabled} settings=`, custSettings)
                result = { ...summary, one_click_enabled }
                send({ type: "ui_action", action: "show_checkout_confirm", data: { ...summary, one_click_enabled } })
                break
              }
              case "redirect_to_tryon": {
                send({ type: "ui_action", action: "redirect_to_tryon", product_id: input.product_id ?? null })
                result = { redirected: true }
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
      appendMessage({ session_id, role: "assistant", content: assistantContent })
    }

    send({ type: "done" })
    res.end()
  } catch (err: any) {
    send({ type: "error", message: err.message ?? "Unknown error" })
    res.end()
  }
}
