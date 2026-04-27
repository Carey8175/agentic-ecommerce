import OpenAI from "openai"
import * as medusa from "../tools/medusa"

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
      description: "Search the catalog for products matching a query, style, or occasion.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: { type: "string" },
          min_price: { type: "number" },
          max_price: { type: "number" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_similar_products",
      description: "Find products in the same category as a given product handle.",
      parameters: {
        type: "object",
        properties: {
          product_handle: { type: "string" },
        },
        required: ["product_handle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_orders",
      description: "Retrieve the customer's past orders to inform recommendations.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
]

export interface RecommendationResult {
  text: string
  products?: any[]
  orders?: any[]
}

export async function runRecommendationAgent(opts: {
  user_message: string
  customer_token: string
  customer: any | null
  conversation_history?: { role: string; content: string }[]
  send?: (event: object) => void
}): Promise<RecommendationResult> {
  const { user_message, customer_token, customer, conversation_history = [], send } = opts

  const profile = customer?.metadata?.tryon_personalization ?? null

  const systemPrompt = `You are a personalized shopping recommendation specialist. Your only job is to recommend products based on the customer's taste, past purchases, and profile.

RULES:
- Use search_products for general discovery and "recommend/for me/what should I buy" intents.
- Use get_similar_products when the user asks for alternatives to a specific product (you will receive the product_handle in context).
- Use list_orders to understand past purchases and avoid recommending what they already own.
- Never fabricate product handles — only use handles returned by tools.
- Return a short explanation of WHY each recommendation fits the customer.
- Do not list items in text — the UI renders product cards automatically. Just write a 1-2 sentence intro.

Customer: ${customer?.first_name ? `${customer.first_name} ${customer.last_name}` : "Guest"}
${profile ? `
Personalization profile:
- Height: ${profile.profile?.height_cm ?? "unknown"} cm
- Weight: ${profile.profile?.weight_kg ?? "unknown"} kg
- Country: ${profile.profile?.country ?? "unknown"}
- Style notes: ${profile.profile?.style_notes ?? "none"}
- Room style: ${profile.derived?.room_style ?? "unknown"}
- Palette: ${(profile.derived?.palette ?? []).join(", ") || "unknown"}
- Body fit notes: ${profile.derived?.body_fit_notes ?? "none"}
` : "No personalization profile saved yet."}`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...conversation_history.map((m) => ({ role: m.role as any, content: m.content })),
    { role: "user", content: user_message },
  ]

  let resultText = ""
  let resultProducts: any[] | undefined
  let resultOrders: any[] | undefined
  let continueLoop = true

  while (continueLoop) {
    const response = await byteplus.chat.completions.create({
      model: MODEL,
      max_tokens: 512,
      tools: TOOLS,
      tool_choice: "auto",
      messages,
    })

    const choice = response.choices[0]
    const assistantMsg = choice.message
    messages.push(assistantMsg)

    if (assistantMsg.content) {
      resultText = assistantMsg.content
    }

    if (choice.finish_reason === "tool_calls" && assistantMsg.tool_calls?.length) {
      for (const tc of assistantMsg.tool_calls) {
        let input: any = {}
        try { input = JSON.parse(tc.function.arguments) } catch { /* empty */ }

        let result: any = null

        try {
          switch (tc.function.name) {
            case "search_products": {
              const products = await medusa.searchProducts(input.query, input, customer_token)
              result = products
              resultProducts = products
              send?.({ type: "tool_result", tool: "search_products", data: products })
              break
            }
            case "get_similar_products": {
              const similar = await medusa.getSimilarProducts(input.product_handle, customer_token)
              result = similar
              resultProducts = similar
              send?.({ type: "tool_result", tool: "search_products", data: similar })
              break
            }
            case "list_orders": {
              const orders = await medusa.listOrders(customer_token)
              result = orders
              resultOrders = orders
              // Don't surface order cards — this is context for recommendations only
              break
            }
            default:
              result = { error: `Unknown tool: ${tc.function.name}` }
          }
        } catch (err: any) {
          result = { error: err.message }
        }

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        })
      }
    } else {
      continueLoop = false
    }
  }

  return { text: resultText, products: resultProducts, orders: resultOrders }
}
