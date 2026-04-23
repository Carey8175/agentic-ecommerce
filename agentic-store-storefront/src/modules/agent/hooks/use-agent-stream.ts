"use client"

export type AgentEvent =
  | { type: "token"; content: string }
  | { type: "tool_start"; tool: string }
  | { type: "tool_result"; tool: string; data: any }
  | { type: "ui_action"; action: string; [key: string]: any }
  | { type: "done" }
  | { type: "error"; message: string }

export async function* streamChat(opts: {
  message: string
  sessionId: string | null
  cartId: string | null
  surface?: string
  onSessionId?: (id: string) => void
}): AsyncGenerator<AgentEvent> {
  const res = await fetch("/api/agent/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: opts.message,
      session_id: opts.sessionId,
      cart_id: opts.cartId,
      surface: opts.surface ?? "floating",
    }),
  })

  const newSessionId = res.headers.get("x-session-id")
  if (newSessionId && opts.onSessionId) opts.onSessionId(newSessionId)

  const reader = res.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6)) as AgentEvent
        } catch { /* skip malformed */ }
      }
    }
  }
}
