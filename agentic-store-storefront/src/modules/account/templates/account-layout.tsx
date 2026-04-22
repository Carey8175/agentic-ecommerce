import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 small:py-12" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-white flex flex-col">
        <div className="grid grid-cols-1  small:grid-cols-[240px_1fr] py-12">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <div className="flex-1">{children}</div>
        </div>
        <div className="flex flex-col small:flex-row items-center justify-between small:border-t border-gray-200 py-12 gap-6 bg-gray-50/50 rounded-2xl px-8 my-8 border">
          <div className="text-center small:text-left">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Got questions?</h3>
            <span className="text-gray-500 text-sm max-w-md inline-block">
              You can find frequently asked questions and answers on our
              customer service page.
            </span>
          </div>
          <div>
            <LocalizedClientLink href="/customer-service" className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors">
              Customer Service
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
