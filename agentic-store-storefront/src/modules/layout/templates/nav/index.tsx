import { Suspense } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"

export default async function Nav() {

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white/95 backdrop-blur-sm border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          {/* Left — nav links */}
          <div className="flex items-center gap-x-6 h-full flex-1 basis-0">
            <LocalizedClientLink
              href="/"
              className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-medium"
              data-testid="nav-home-link"
            >
              Home
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store"
              className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-medium"
            >
              Shop
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/try-on"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors font-medium hidden small:block"
              data-testid="nav-tryon-link"
            >
              <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500 text-white px-1.5 py-0.5 rounded-full leading-none">NEW</span>
              Try-On
            </LocalizedClientLink>
          </div>

          {/* Centre — logo */}
          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="text-[17px] font-extrabold tracking-[0.18em] text-gray-900 hover:text-gray-600 transition-colors uppercase"
              data-testid="nav-store-link"
            >
              Byteshop
            </LocalizedClientLink>
          </div>

          {/* Right — account + cart */}
          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <LocalizedClientLink
              className="text-sm text-gray-400 hover:text-gray-900 transition-colors font-medium hidden small:block"
              href="/account"
              data-testid="nav-account-link"
            >
              Account
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
