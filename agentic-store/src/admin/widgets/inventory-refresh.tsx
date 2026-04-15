import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

const InventoryRefreshWidget = () => {
  useEffect(() => {
    // We observe the DOM for the "Inventory level updated successfully" toast
    // and trigger a page reload since React Query cache invalidation is broken.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            // Check if the toast notification text appears
            // In the screenshot, the text is "Inventory level updated successfully."
            if (node.innerText && node.innerText.includes("Inventory level updated successfully")) {
              console.log("[InventoryRefreshWidget] Detected inventory update, reloading page...")
              window.location.reload()
            }
          }
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null // This is a headless widget
}

export const config = defineWidgetConfig({
  zone: [
    "product.details.side.after",
    "inventory_item.details.side.after",
    "inventory_item.details.before",
    "inventory_item.details.after"
  ],
})

export default InventoryRefreshWidget
