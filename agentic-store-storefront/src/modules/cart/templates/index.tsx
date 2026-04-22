import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const totalItems = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0

  return (
    <div className="py-8">
      <div className="content-container" data-testid="cart-container">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-7 text-xs text-gray-400">
          <LocalizedClientLink href="/" className="hover:text-gray-900 transition-colors">Home</LocalizedClientLink>
          <span>/</span>
          <span className="text-gray-900 font-medium">Cart</span>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1.5">YOUR BAG</p>
          <h1 className="text-[32px] font-extrabold tracking-tight text-gray-900">
            Shopping Cart
            {totalItems > 0 && (
              <span className="text-base font-normal text-gray-400 ml-2.5">{totalItems} items</span>
            )}
          </h1>
        </div>

        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-12 xl:gap-x-16">
            <div className="flex flex-col bg-white gap-y-5">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-24">
                {cart && cart.region && (
                  <div className="bg-white">
                    <Summary cart={cart as any} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
