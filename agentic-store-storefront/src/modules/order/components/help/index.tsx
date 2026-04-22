import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"
import { ChatBubbleLeftRight, ArrowPath } from "@medusajs/icons"

const Help = () => {
  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <Heading className="text-xl font-bold tracking-tight text-gray-900 mb-4">Need help?</Heading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LocalizedClientLink href="/customer-service" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 group">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
            <ChatBubbleLeftRight className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Contact Support</p>
            <p className="text-xs text-gray-500">We're here to help</p>
          </div>
        </LocalizedClientLink>

        <LocalizedClientLink href="/customer-service" className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 group">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
            <ArrowPath className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Returns & Exchanges</p>
            <p className="text-xs text-gray-500">Read our policy</p>
          </div>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Help
