"use client"

import { useToggleState } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import CountrySelect from "@modules/layout/components/country-select"
import LanguageSelect from "@modules/layout/components/language-select"

type Props = {
  regions: HttpTypes.StoreRegion[]
  locales: Locale[] | null
  currentLocale: string | null
}

export default function FooterRegionSelectors({ regions, locales, currentLocale }: Props) {
  const countryToggle = useToggleState()
  const languageToggle = useToggleState()

  return (
    <div className="flex flex-col sm:flex-row gap-6 text-sm text-gray-500">
      {/* Shipping region */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-gray-900 transition-colors relative"
        onMouseEnter={countryToggle.open}
        onMouseLeave={countryToggle.close}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <CountrySelect toggleState={countryToggle} regions={regions} />
      </div>

      {/* Language */}
      {!!locales?.length && (
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-gray-900 transition-colors relative"
          onMouseEnter={languageToggle.open}
          onMouseLeave={languageToggle.close}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>
          </svg>
          <LanguageSelect toggleState={languageToggle} locales={locales} currentLocale={currentLocale} />
        </div>
      )}
    </div>
  )
}
