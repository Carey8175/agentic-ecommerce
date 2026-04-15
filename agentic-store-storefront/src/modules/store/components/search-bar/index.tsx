"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Input, IconButton } from "@medusajs/ui"
import { MagnifyingGlass, XMarkMini } from "@medusajs/icons"

export default function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")

  // Keep latest router/pathname/searchParams in refs — avoids re-firing
  // the search effect on every URL change (page, category, sort).
  const routerRef = useRef(router)
  const pathnameRef = useRef(pathname)
  const searchParamsRef = useRef(searchParams)
  useEffect(() => { routerRef.current = router }, [router])
  useEffect(() => { pathnameRef.current = pathname }, [pathname])
  useEffect(() => { searchParamsRef.current = searchParams }, [searchParams])

  // Skip the initial mount — only push URL when the user actually types
  const isMounted = useRef(false)

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString())
      if (value) {
        params.set("q", value)
      } else {
        params.delete("q")
      }
      params.delete("page")
      routerRef.current.push(`${pathnameRef.current}?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="relative w-full mb-8">
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products..."
        className="w-full"
      />
    </div>
  )
}
