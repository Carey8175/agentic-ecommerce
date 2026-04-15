import { Text } from "@medusajs/ui"
import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FooterRegionSelectors from "./region-selectors"

export default async function Footer() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions(),
    listLocales(),
    getLocale(),
  ])

  return (
    <footer className="w-full border-t border-gray-100 bg-white">
      <div className="content-container">
        {/* Top section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 py-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <span className="text-lg font-bold tracking-widest text-gray-900 uppercase">Byteshop</span>
            <p className="text-sm text-gray-400 leading-relaxed max-w-[200px]">
              AI-powered shopping for the modern era.
            </p>
            <div className="flex gap-3 mt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-800 hover:text-gray-900 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-pink-500 hover:text-pink-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: "Shop",
              links: [
                { label: "All Products", href: "/store" },
                { label: "New Arrivals", href: "/store" },
                { label: "Categories", href: "/store" },
              ],
            },
            {
              title: "Account",
              links: [
                { label: "My Account", href: "/account" },
                { label: "Orders", href: "/account/orders" },
                { label: "Addresses", href: "/account/addresses" },
              ],
            },
            {
              title: "Support",
              links: [
                { label: "Contact Us", href: "/customer-service" },
                { label: "Track Order", href: "/customer-service?q=Track my order" },
                { label: "Shipping Policy", href: "/customer-service?q=Shipping Rates and Policies" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About Us", href: "/about" },
                { label: "Careers", href: "/about#careers" },
                { label: "Press", href: "/about#press" },
              ],
            },
          ].map(({ title, links }) => (
            <div key={title} className="flex flex-col gap-4">
              <span className="text-xs font-semibold text-gray-900 uppercase tracking-widest">{title}</span>
              <ul className="flex flex-col gap-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <LocalizedClientLink
                      href={href}
                      className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      {label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Region / Language selectors */}
        <div className="py-6 border-t border-gray-100">
          <FooterRegionSelectors
            regions={regions}
            locales={locales}
            currentLocale={currentLocale}
          />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-gray-100">
          <Text className="text-xs text-gray-400">
            © {new Date().getFullYear()} Byteshop. All rights reserved.
          </Text>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((t) => (
              <a key={t} href="#" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                {t}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
