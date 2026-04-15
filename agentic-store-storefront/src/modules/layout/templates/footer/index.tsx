import { Text, clx } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  return (
    <footer className="w-full bg-[#232F3E] text-gray-300">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 md:flex-row items-start justify-between py-16 md:py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl mx-auto text-sm">
            {/* Column 1 */}
            <div className="flex flex-col gap-y-3">
              <span className="font-bold text-white mb-1">Get to Know Us</span>
              <ul className="flex flex-col gap-y-2">
                <li><a href="#" className="hover:underline">About Us</a></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-y-3">
              <span className="font-bold text-white mb-1">Connect with Us</span>
              <ul className="flex flex-col gap-y-2">
                <li><a href="#" className="hover:underline">Facebook</a></li>
                <li><a href="#" className="hover:underline">Twitter</a></li>
                <li><a href="#" className="hover:underline">Instagram</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-y-3">
              <span className="font-bold text-white mb-1">Make Money with Us</span>
              <ul className="flex flex-col gap-y-2">
                <li><a href="#" className="hover:underline">Protect and Build Your Brand</a></li>
                <li><a href="#" className="hover:underline">Advertise Your Products</a></li>
                <li><a href="#" className="hover:underline">Sell on our platform</a></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div className="flex flex-col gap-y-3">
              <span className="font-bold text-white mb-1">Customer Support</span>
              <ul className="flex flex-col gap-y-2">
                <li><LocalizedClientLink href="/customer-service?q=Your Account" className="hover:underline">Your Account</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/customer-service?q=Track my order" className="hover:underline">Your Orders</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/customer-service?q=Shipping Rates and Policies" className="hover:underline">Shipping Rates and Policies</LocalizedClientLink></li>
                <li><LocalizedClientLink href="/customer-service" className="hover:underline">Contact Us</LocalizedClientLink></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="flex w-full mb-16 justify-between text-gray-400 border-t border-gray-700 pt-8 mt-4">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} Byteshop. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  )
}
