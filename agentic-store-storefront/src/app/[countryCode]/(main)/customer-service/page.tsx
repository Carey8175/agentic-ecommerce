import { Metadata } from "next"
import { Suspense } from "react"
import CustomerServiceChat from "@modules/ai-chat/components/customer-service-chat"

export const metadata: Metadata = {
  title: "Customer Service",
  description: "Get help with your orders, returns, and more.",
}

export default function CustomerServicePage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center">Loading...</div>}>
      <CustomerServiceChat />
    </Suspense>
  )
}
