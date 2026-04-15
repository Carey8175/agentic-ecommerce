"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export default function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")

  const routerRef = useRef(router)
  const pathnameRef = useRef(pathname)
  const searchParamsRef = useRef(searchParams)
  useEffect(() => { routerRef.current = router }, [router])
  useEffect(() => { pathnameRef.current = pathname }, [pathname])
  useEffect(() => { searchParamsRef.current = searchParams }, [searchParams])

  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString())
      if (value) { params.set("q", value) } else { params.delete("q") }
      params.delete("page")
      routerRef.current.replace(`${pathnameRef.current}?${params.toString()}`, { scroll: false })
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="relative w-full mb-8">
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-indigo-300 focus-within:bg-white transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search products..."
          className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
        />
        {value && (
          <button onClick={() => setValue("")} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
