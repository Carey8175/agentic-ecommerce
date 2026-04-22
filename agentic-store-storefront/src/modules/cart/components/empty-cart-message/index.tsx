import { ShoppingCart } from "@medusajs/icons"
import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const EmptyCartMessage = () => {
  return (
    <div 
      className="py-24 px-4 flex flex-col items-center justify-center text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl" 
      data-testid="empty-cart-message"
    >
      <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 flex items-center justify-center rounded-2xl mb-6">
        <ShoppingCart className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
        Your cart is empty
      </h2>
      <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm">
        Looks like you haven&apos;t added anything yet. Discover our latest products and find something you love.
      </p>
      <LocalizedClientLink href="/store">
        <Button size="large" variant="primary" className="rounded-full px-8 bg-gray-900 text-white hover:bg-gray-800 transition-colors">
          Explore Products
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
