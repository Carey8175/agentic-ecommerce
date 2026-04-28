"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { streamChat } from "../hooks/use-agent-stream"
import ProductCard from "./product-card"
import CheckoutCard from "./checkout-card"
import OrderConfirmedCard from "./order-confirmed-card"
import CancelConfirmCard from "./cancel-confirm-card"
import TicketCreatedCard from "./ticket-created-card"
import PromoCard from "./promo-card"
import HistoryTab from "./history-tab"
import OrderCard from "./order-card"
import CartCard from "./cart-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useRouter } from "next/navigation"

type Tab = "chat" | "history"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  products?: any[]
  orders?: any[]
  cartData?: any
  checkoutData?: any
  confirmedOrder?: any
  cancelData?: { orderId: string; displayId: number }
  confirmedCancel?: boolean
  ticketData?: { ticketId: string; orderDisplayId?: number }
  promotions?: any[]
  uiAction?: any
  tryOnJobId?: string
}

type AgentPanelProps = {
  mode?: "floating" | "hero" | "support"
  cartId?: string | null
  initialTab?: Tab
}

// Cross-panel events
const SESSION_EVENT = "agent_session_created"   // detail: { id, messages }
const CLEAR_EVENT   = "agent_session_cleared"
const MSG_EVENT     = "agent_messages_updated"  // detail: Message[]

export default function AgentPanel({ mode = "floating", cartId = null, initialTab = "chat" }: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [checkoutPending, setCheckoutPending] = useState(false)
  const [oneClickEnabled, setOneClickEnabled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Track session in a ref so event listeners always see the latest value
  const sessionIdRef = useRef<string | null>(null)
  const router = useRouter()

  function setSession(id: string | null) {
    sessionIdRef.current = id
    setSessionId(id)
  }

  // Fetch one-click setting on mount
  useEffect(() => {
    fetch("/api/agent/settings")
      .then(r => r.json())
      .then(d => setOneClickEnabled(!!(d.settings?.one_click_checkout_enabled)))
      .catch(() => {})
  }, [])

  // Poll try-on jobs queued in THIS session and notify user in chat when done
  const notifyTryOnDone = useCallback((jobId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/agent/tryon-jobs?id=${jobId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === "done") {
          setMessages(prev => [...prev, {
            id: `tryon-done-${jobId}`,
            role: "assistant",
            content: `Your virtual try-on is ready!`,
            tryOnJobId: jobId,
          }])
        } else if (data.status === "error") {
          setMessages(prev => [...prev, {
            id: `tryon-err-${jobId}`,
            role: "assistant",
            content: `Your try-on generation encountered an issue: ${data.error ?? "unknown error"}. Please try again.`,
          }])
        } else {
          setTimeout(poll, 5000)
        }
      } catch { setTimeout(poll, 8000) }
    }
    setTimeout(poll, 5000)
  }, [])

  // Direct try-on: bypass LLM, call tryon-jobs API directly
  async function handleTryOn(productId: string, productTitle: string) {
    addMessage({ role: "user", content: `Try on ${productTitle}` })
    const assistantId = Math.random().toString(36).slice(2)
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "Queuing your try-on…" }])
    try {
      const res = await fetch("/api/agent/tryon-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to queue try-on")
      const jobId = data.job_id
      try {
        const stored = localStorage.getItem("_agent_tryon_jobs")
        const existing: string[] = stored ? JSON.parse(stored) : []
        localStorage.setItem("_agent_tryon_jobs", JSON.stringify([...existing, jobId].slice(-10)))
      } catch { localStorage.setItem("_agent_tryon_jobs", JSON.stringify([jobId])) }
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: "Your try-on is being generated! Check the Try-On page in ~30 seconds for the result." } : m))
      notifyTryOnDone(jobId)
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: e.message ?? "Try-on failed. Please try again." } : m))
    }
  }

  const sendMessageRef = useRef(sendMessage)
  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  const handleTryOnRef = useRef(handleTryOn)
  useEffect(() => {
    handleTryOnRef.current = handleTryOn
  }, [handleTryOn])

  // On mount: hero always starts a fresh session; floating panel restores existing
  useEffect(() => {
    if (isHero) {
      localStorage.removeItem("_agent_session_id")
      setSession(null)
      setMessages([])
      window.dispatchEvent(new CustomEvent(CLEAR_EVENT))
      return
    }
    const stored = localStorage.getItem("_agent_session_id")
    if (stored) {
      setSession(stored)
      fetch(`/api/agent/history?session_id=${stored}`)
        .then(r => r.json())
        .then(d => {
          const msgs: Message[] = (d.messages ?? [])
            .filter((m: any) => m.role === "user" || m.role === "assistant")
            .map((m: any) => ({
              id: m.id ?? Math.random().toString(36).slice(2),
              role: m.role,
              content: m.content ?? "",
              products: m.products,
              orders: m.orders,
              cartData: m.cartData,
              checkoutData: m.checkoutData,
              confirmedOrder: m.confirmedOrder,
              cancelData: m.cancelData,
              ticketData: m.ticketData,
              promotions: m.promotions,
              uiAction: m.uiAction,
            }))
          if (msgs.length) setMessages(msgs)
        })
        .catch(() => {})
    }

    // Another panel created/adopted a session — sync messages directly (no re-fetch, preserves cards)
    const handleSessionCreated = (e: any) => {
      const { id, messages: sharedMsgs } = e.detail ?? {}
      if (id && id !== sessionIdRef.current) {
        setSession(id)
        localStorage.setItem("_agent_session_id", id)
        if (Array.isArray(sharedMsgs)) setMessages(sharedMsgs)
      }
    }

    // Another panel pushed new messages — mirror them (preserves cards)
    const handleMsgUpdate = (e: any) => {
      setMessages(e.detail ?? [])
    }

    const handleClear = () => {
      setSession(null)
      setMessages([])
      setCheckoutPending(false)
    }

    const handleCheckoutError = () => {
      // Just unlock the input so user can chat, but keep the card visible
      setCheckoutPending(false)
    }

    const handleOpenAndSend = (e: any) => {
      setActiveTab("chat")
      if (e.detail?.message) {
        const hiddenCtx: string = e.detail.hidden_context ?? ""
        const productIdMatch = hiddenCtx.match(/product_id:\s*(\S+)/)
        const isTryOn = /try.?on/i.test(e.detail.message)
        if (isTryOn && productIdMatch) {
          handleTryOnRef.current(productIdMatch[1], e.detail.message.replace(/^try.?on\s*/i, "").trim())
        } else {
          sendMessageRef.current(e.detail.message, hiddenCtx)
        }
      }
    }

    window.addEventListener(SESSION_EVENT, handleSessionCreated)
    window.addEventListener(MSG_EVENT, handleMsgUpdate)
    window.addEventListener(CLEAR_EVENT, handleClear)
    window.addEventListener("agent_checkout_error", handleCheckoutError)
    window.addEventListener("agent_open_and_send", handleOpenAndSend)
    return () => {
      window.removeEventListener(SESSION_EVENT, handleSessionCreated)
      window.removeEventListener(MSG_EVENT, handleMsgUpdate)
      window.removeEventListener(CLEAR_EVENT, handleClear)
      window.removeEventListener("agent_checkout_error", handleCheckoutError)
      window.removeEventListener("agent_open_and_send", handleOpenAndSend)
    }
  }, [])

  // Auto-scroll
  const messageCount = messages.length
  useEffect(() => {
    const c = scrollContainerRef.current
    if (c) c.scrollTop = c.scrollHeight
  }, [messageCount])

  function broadcastSession(id: string, msgs: Message[]) {
    window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: { id, messages: msgs } }))
  }

  function broadcastMessages(msgs: Message[]) {
    window.dispatchEvent(new CustomEvent(MSG_EVENT, { detail: msgs }))
  }

  function persistSession(id: string) {
    setSession(id)
    localStorage.setItem("_agent_session_id", id)
    // Don't broadcast here — we'll broadcast after the full response with messages included
  }

  function startNewChat() {
    localStorage.removeItem("_agent_session_id")
    setSession(null)
    setMessages([])
    setCheckoutPending(false)
    window.dispatchEvent(new CustomEvent(CLEAR_EVENT))
    setActiveTab("chat")
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).slice(2) }])
  }, [])

  async function sendMessage(text?: string, hiddenContext?: string) {
    const msg = (text ?? input).trim()
    if (!msg || streaming) return
    setInput("")
    setCheckoutPending(false)

    addMessage({ role: "user", content: msg })

    const assistantId = Math.random().toString(36).slice(2)
    let assistantText = ""
    let productList: any[] = []
    let orderList: any[] = []
    let cartData: any = null
    let checkoutData: any = null
    let cancelData: { orderId: string; displayId: number } | null = null
    let ticketData: { ticketId: string; orderDisplayId?: number } | null = null
    let promotions: any[] | null = null
    let uiAction: any = null
    let resolvedSessionId = sessionIdRef.current

    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }])
    setStreaming(true)

    // Append hidden context to the payload sent to the AI without displaying it to the user
    const aiMessagePayload = hiddenContext ? `${msg}\n[System Hidden Context: ${hiddenContext}]` : msg;

    try {
      for await (const event of streamChat({
        message: aiMessagePayload,
        sessionId: resolvedSessionId,
        cartId,
        surface: mode,
        onSessionId: (id) => {
          resolvedSessionId = id
          persistSession(id)
        },
      })) {
        if (event.type === "token") {
          assistantText += event.content
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantText } : m))
        } else if (event.type === "tool_result" && event.tool === "search_products") {
          productList = event.data ?? []
        } else if (event.type === "tool_result" && event.tool === "get_product_details") {
          if (event.data) productList = [event.data]
        } else if (event.type === "ui_action") {
          if (event.action === "show_orders") orderList = event.data ?? []
          else if (event.action === "show_cart") cartData = event.data
          else if (event.action === "show_checkout_confirm") { checkoutData = event.data; setCheckoutPending(true) }
          else if (event.action === "show_cancel_confirm") cancelData = { orderId: event.order_id, displayId: event.display_id }
          else if (event.action === "show_ticket_created") ticketData = { ticketId: event.ticket_id, orderDisplayId: event.order_display_id }
          else if (event.action === "show_promotions") promotions = event.data ?? []
          else if (event.action === "redirect_to_tryon") uiAction = event
          else if (event.action === "tryon_job_queued") {
            const jobId = event.data?.job_id
            if (jobId) {
              try {
                const stored = localStorage.getItem("_agent_tryon_jobs")
                const existing: string[] = stored ? JSON.parse(stored) : []
                const updated = [...existing, jobId].slice(-10)
                localStorage.setItem("_agent_tryon_jobs", JSON.stringify(updated))
              } catch { localStorage.setItem("_agent_tryon_jobs", JSON.stringify([jobId])) }
              notifyTryOnDone(jobId)
            }
          }
        } else if (event.type === "done") {
          setMessages(prev => {
            const updated = prev.map(m => m.id === assistantId
              ? { ...m, content: assistantText, products: productList.length ? productList : undefined, orders: orderList.length ? orderList : undefined, cartData: cartData ?? undefined, checkoutData: checkoutData ?? undefined, cancelData: cancelData ?? undefined, ticketData: ticketData ?? undefined, promotions: promotions ?? undefined, uiAction: uiAction ?? undefined }
              : m
            )
            // Schedule broadcast outside of the state updater to avoid setState-during-render
            setTimeout(() => {
              if (resolvedSessionId) broadcastSession(resolvedSessionId, updated)
              else broadcastMessages(updated)
              
              if (ticketData) {
                window.dispatchEvent(new Event("ticket_created"))
              }
            }, 0)
            return updated
          })
        }
      }
    } finally {
      setStreaming(false)
    }
  }

  function resumeSession(id: string) {
    // If resuming the current session, just switch tab — preserve cards in memory
    if (id === sessionIdRef.current) {
      setActiveTab("chat")
      return
    }
    localStorage.setItem("_agent_session_id", id)
    setSession(id)
    fetch(`/api/agent/history?session_id=${id}`)
      .then(r => r.json())
      .then(d => {
        const msgs: Message[] = (d.messages ?? [])
          .filter((m: any) => m.role === "user" || m.role === "assistant")
          .map((m: any) => ({
            id: m.id ?? Math.random().toString(36).slice(2),
            role: m.role,
            content: m.content ?? "",
            products: m.products,
            orders: m.orders,
            cartData: m.cartData,
            checkoutData: m.checkoutData,
            confirmedOrder: m.confirmedOrder,
            cancelData: m.cancelData,
            ticketData: m.ticketData,
            promotions: m.promotions,
            uiAction: m.uiAction,
          }))
        setMessages(msgs)
        setActiveTab("chat")
        broadcastSession(id, msgs)
      })
      .catch(() => setActiveTab("chat"))
  }

  async function handleCartCheckout() {
    if (!oneClickEnabled || !cartId) {
      window.location.href = "/checkout?step=address"
      return
    }
    // One-click: place order directly and show confirmation in chat
    const assistantId = Math.random().toString(36).slice(2)
    addMessage({ role: "user", content: "Checkout" })
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "Placing your order..." }])
    setCheckoutPending(true)
    try {
      const res = await fetch("/api/agent/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Checkout failed")
      fetch("/api/agent/bust-cache", { method: "POST" }).catch(() => {})
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: "Your order has been placed!", confirmedOrder: json.order }
        : m
      ))
      // Soft reload by refreshing the Next.js router cache to instantly update the cart badge
      setTimeout(() => { router.refresh() }, 1500)
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === assistantId
        ? { ...m, content: `Checkout failed: ${err.message}. Please try manually.` }
        : m
      ))
    } finally {
      setCheckoutPending(false)
    }
  }

  function handleOrderSuccess(order: any) {
    setCheckoutPending(false)
    setMessages(prev => {
      const updated = prev.map(m => m.checkoutData ? { ...m, checkoutData: undefined, confirmedOrder: order } : m)
      setTimeout(() => broadcastMessages(updated), 0)
      return updated
    })
    // Soft reload by refreshing the Next.js router cache to instantly update the cart badge
    // and layout data without a jarring full-page browser refresh.
    setTimeout(() => { 
      const event = new Event("cart_updated")
      window.dispatchEvent(event)
      router.refresh() 
    }, 1500)
  }

  const SUGGESTED = ["Recommend a gift under $50", "What's popular right now?", "Track my order", "I need something for summer"]
  const isHero = mode === "hero"
  const isSupport = mode === "support"

  const containerBg = isSupport ? "bg-white shadow-sm border border-gray-200" : "bg-[#0f1117]"
  const headerBg = isSupport ? "border-gray-200" : "border-white/10"
  const tabActiveClass = isSupport ? "bg-gray-100 text-gray-900" : "bg-white/10 text-white"
  const tabInactiveClass = isSupport ? "text-gray-500 hover:text-gray-800" : "text-white/40 hover:text-white/70"
  const aiBubbleBg = isSupport ? "bg-indigo-600" : "bg-indigo-500"
  const userMsgBg = isSupport ? "bg-indigo-600 text-white" : "bg-indigo-600 text-white"
  const assistantMsgBg = isSupport ? "bg-gray-100 text-gray-800" : "bg-white/8 text-white/90"
  const inputBg = isSupport ? "bg-gray-50 border-gray-200" : "bg-white/8 border-white/10"
  const inputColor = isSupport ? "text-gray-900 placeholder-gray-400" : "text-white placeholder-white/30"
  const suggestedBg = isSupport ? "text-gray-600 border-gray-200 hover:bg-gray-50" : "text-white/60 border-white/10 hover:bg-white/5"
  const dotColor = isSupport ? "bg-gray-400" : "bg-white/40"

  return (
    <div className={`flex flex-col ${isHero ? "w-full h-full" : isSupport ? "w-full h-full" : "w-full h-full"} ${containerBg} rounded-2xl overflow-hidden`}>

      {/* Tabs — not shown in hero mode */}
      {!isHero && (
        <div className={`flex items-center border-b ${headerBg} px-3 pt-3 gap-1 flex-shrink-0`}>
          {(["chat", "history"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors capitalize ${
                activeTab === tab ? tabActiveClass : tabInactiveClass
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <div className="flex-1" />
          <LocalizedClientLink href="/try-on" className={`px-2.5 py-1 text-[10px] font-semibold rounded-full mr-1 transition-colors mb-1 ${isSupport ? "text-indigo-500 hover:text-indigo-600 border border-indigo-200 bg-indigo-50" : "text-indigo-400 hover:text-indigo-300 border border-indigo-500/30"}`}>
            Try-On
          </LocalizedClientLink>
          <button
            onClick={startNewChat}
            title="New chat"
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-colors mb-1 ${isSupport ? "text-gray-500 hover:text-gray-800 border-gray-200 border" : "text-white/40 hover:text-white/70 border border-white/10"}`}
          >
            + New
          </button>
        </div>
      )}

      {/* Chat tab */}
      {(activeTab === "chat" || isHero) && (
        <div className="flex flex-col flex-1 min-h-0">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
            {messages.length === 0 && (
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full ${aiBubbleBg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>AI</div>
                <div className={`${assistantMsgBg} rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-xs`}>
                  Hi there! I&apos;m your AI shopping assistant. How can I help you today?
                </div>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className={`w-7 h-7 rounded-full ${aiBubbleBg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1`}>AI</div>
                )}
                <div className="max-w-[80%] space-y-2">
                  {(msg.content || (msg.role === "assistant" && streaming && msg.id === messages[messages.length - 1]?.id)) && (
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user" ? `${userMsgBg} rounded-tr-sm` : `${assistantMsgBg} rounded-tl-sm`
                    }`}>
                      {msg.content || (
                        <span className="inline-flex gap-1">
                          {[0,1,2].map(i => <span key={i} className={`w-1.5 h-1.5 ${dotColor} rounded-full animate-bounce`} style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </span>
                      )}
                    </div>
                  )}
                  {msg.products && msg.products.length > 0 && (
                    <div className="flex flex-col gap-2 w-full">
                      {msg.products.map((p: any) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          isLight={isSupport}
                          onTryOn={(productId, productTitle) =>
                            handleTryOn(productId, productTitle)
                          }
                        />
                      ))}
                    </div>
                  )}
                  {msg.orders && msg.orders.length > 0 && (
                    <div className="flex flex-col gap-2 w-full">
                      {msg.orders.map((o: any) => <OrderCard key={o.id} order={o} isLight={isSupport} />)}
                    </div>
                  )}
                  {msg.cartData && (
                    <div className="flex flex-col gap-2 w-full">
                      <CartCard cart={msg.cartData} onCheckout={handleCartCheckout} isLight={isSupport} />
                    </div>
                  )}
                  {msg.uiAction?.action === "redirect_to_tryon" && (
                    <div className={`border rounded-xl p-3 flex items-center justify-between gap-3 ${isSupport ? "bg-indigo-50 border-indigo-200" : "bg-white/5 border-indigo-500/20"}`}>
                      <p className={`text-xs ${isSupport ? "text-gray-600" : "text-white/60"}`}>Ready to try it on?</p>
                      <LocalizedClientLink href="/try-on" className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-colors font-medium">
                        Open Try-On Studio
                      </LocalizedClientLink>
                    </div>
                  )}
                  {msg.checkoutData && !msg.confirmedOrder && (
                    <div className="flex flex-col gap-2 w-full mt-2">
                      <CheckoutCard
                        data={msg.checkoutData}
                        cartId={cartId} // pass the active cart ID to verify it hasn't changed
                        onSuccess={handleOrderSuccess}
                        isLight={isSupport}
                        onDismiss={() => {
                          setCheckoutPending(false)
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, checkoutData: undefined } : m))
                        }}
                      />
                    </div>
                  )}
                  {msg.confirmedOrder && <OrderConfirmedCard order={msg.confirmedOrder} isLight={isSupport} />}
                  {msg.confirmedCancel && (
                    <div className={`border rounded-xl p-3 flex items-center gap-3 w-full ${isSupport ? "bg-emerald-50 border-emerald-200" : "bg-white/5 border-emerald-500/30"}`}>
                      <span className="text-emerald-500 text-lg flex-shrink-0">✓</span>
                      <div>
                        <p className={`text-xs font-semibold ${isSupport ? "text-emerald-900" : "text-white"}`}>Order Cancelled</p>
                        <p className={`text-[10px] mt-0.5 ${isSupport ? "text-emerald-700" : "text-white/50"}`}>Refund will be processed within 3–5 business days.</p>
                      </div>
                    </div>
                  )}
                  {msg.cancelData && !msg.confirmedOrder && (
                    <CancelConfirmCard
                      orderId={msg.cancelData.orderId}
                      displayId={msg.cancelData.displayId}
                      isLight={isSupport}
                      onConfirmed={(successMsg) => {
                        setMessages(prev => prev.map(m => m.id === msg.id
                          ? { ...m, cancelData: undefined, confirmedCancel: true, content: successMsg || "Your order has been successfully cancelled. A refund will be processed within 3–5 business days." }
                          : m
                        ))
                        setTimeout(() => router.refresh(), 500)
                      }}
                      onDismiss={() => {
                        setMessages(prev => prev.map(m => m.id === msg.id
                          ? { ...m, cancelData: undefined, content: "No problem — your order will continue as normal." }
                          : m
                        ))
                      }}
                    />
                  )}
                  {msg.promotions && msg.promotions.length > 0 && (
                    <PromoCard promos={msg.promotions} isLight={isSupport} />
                  )}
                  {msg.ticketData && (
                    <TicketCreatedCard
                      ticketId={msg.ticketData.ticketId}
                      orderDisplayId={msg.ticketData.orderDisplayId}
                      isLight={isSupport}
                    />
                  )}
                  {msg.tryOnJobId && (
                    <LocalizedClientLink href={`/try-on/${msg.tryOnJobId}`}>
                      <button className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors ${isSupport ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30"}`}>
                        View Try-On Result →
                      </button>
                    </LocalizedClientLink>
                  )}
                </div>
              </div>
            ))}
            <div />
          </div>

          {messages.length === 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => sendMessage(s)} className={`text-xs rounded-full px-3 py-1 transition-colors border ${suggestedBg}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className={`px-4 pb-4 flex-shrink-0 ${checkoutPending ? "opacity-50 pointer-events-none" : ""}`}>
            <div className={`flex gap-2 rounded-full px-4 py-2.5 border ${inputBg}`}>
              <input
                ref={inputRef}
                className={`flex-1 bg-transparent text-sm outline-none ${inputColor}`}
                placeholder={checkoutPending ? "Complete or dismiss your order above" : "Ask me anything..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={streaming || checkoutPending}
              />
              <button
                onClick={() => sendMessage()}
                disabled={streaming || !input.trim() || checkoutPending}
                className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white disabled:opacity-40 transition-opacity flex-shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && !isHero && (
        <HistoryTab onResumeSession={resumeSession} currentSessionId={sessionId} isLight={isSupport} surface={mode} />
      )}
    </div>
  )
}
