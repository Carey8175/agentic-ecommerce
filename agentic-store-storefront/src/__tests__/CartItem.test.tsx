/**
 * Tests for cart Item component
 * src/modules/cart/components/item/index.tsx
 */
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Item from "@modules/cart/components/item"

jest.mock("@lib/data/cart", () => ({
  updateLineItem: jest.fn(),
}))

// Stub all sub-components to isolate the Item logic
jest.mock("@medusajs/ui", () => ({
  Table: {
    Row: ({ children, "data-testid": testId }: any) => <tr data-testid={testId}>{children}</tr>,
    Cell: ({ children, className }: any) => <td className={className}>{children}</td>,
  },
  Text: ({ children, "data-testid": testId, className }: any) => (
    <span data-testid={testId} className={className}>{children}</span>
  ),
  clx: (...args: any[]) => args.filter(Boolean).join(" "),
}))

jest.mock("@modules/products/components/thumbnail", () => {
  const MockThumb = () => <div data-testid="thumbnail" />
  MockThumb.displayName = "MockThumb"
  return MockThumb
})
jest.mock("@modules/cart/components/cart-item-select", () => {
  const MockSelect = ({ value, onChange, children, "data-testid": testId }: any) => (
    <select data-testid={testId} value={value} onChange={onChange}>{children}</select>
  )
  MockSelect.displayName = "MockSelect"
  return MockSelect
})
jest.mock("@modules/common/components/delete-button", () => {
  const MockDelete = ({ id, "data-testid": testId }: any) => (
    <button data-testid={testId} data-id={id}>Delete</button>
  )
  MockDelete.displayName = "MockDelete"
  return MockDelete
})
jest.mock("@modules/common/components/line-item-options", () => {
  const MockOptions = ({ "data-testid": testId }: any) => (
    <div data-testid={testId} />
  )
  MockOptions.displayName = "MockOptions"
  return MockOptions
})
jest.mock("@modules/common/components/line-item-price", () => {
  const MockPrice = () => <div data-testid="line-item-price" />
  MockPrice.displayName = "MockPrice"
  return MockPrice
})
jest.mock("@modules/common/components/line-item-unit-price", () => {
  const MockUnitPrice = () => <div data-testid="line-item-unit-price" />
  MockUnitPrice.displayName = "MockUnitPrice"
  return MockUnitPrice
})
jest.mock("@modules/common/components/localized-client-link", () => {
  const MockLink = ({ children, href }: any) => <a href={href}>{children}</a>
  MockLink.displayName = "MockLink"
  return MockLink
})
jest.mock("@modules/checkout/components/error-message", () => {
  const MockError = ({ error, "data-testid": testId }: any) => (
    error ? <div data-testid={testId}>{error}</div> : null
  )
  MockError.displayName = "MockError"
  return MockError
})
jest.mock("@modules/common/icons/spinner", () => {
  const MockSpinner = () => <div data-testid="spinner" />
  MockSpinner.displayName = "MockSpinner"
  return MockSpinner
})

import { updateLineItem } from "@lib/data/cart"
const mockUpdateLineItem = updateLineItem as jest.Mock

function makeItem(overrides: any = {}): any {
  return {
    id: "li_01",
    product_title: "Cool Shirt",
    product_handle: "cool-shirt",
    thumbnail: "https://example.com/shirt.jpg",
    quantity: 2,
    variant: {
      id: "var_01",
      manage_inventory: true,
      inventory_quantity: 5,
      product: { images: [] },
    },
    ...overrides,
  }
}

describe("Cart Item", () => {
  beforeEach(() => jest.clearAllMocks())

  // ── Rendering ──────────────────────────────────────────────────────────

  it("renders the product title", () => {
    render(<Item item={makeItem()} currencyCode="USD" />)
    expect(screen.getByTestId("product-title")).toHaveTextContent("Cool Shirt")
  })

  it("renders in full mode by default", () => {
    render(<Item item={makeItem()} currencyCode="USD" />)
    expect(screen.getByTestId("product-delete-button")).toBeInTheDocument()
    expect(screen.getByTestId("product-select-button")).toBeInTheDocument()
  })

  it("does not render delete/quantity controls in preview mode", () => {
    render(<Item item={makeItem()} currencyCode="USD" type="preview" />)
    expect(screen.queryByTestId("product-delete-button")).not.toBeInTheDocument()
    expect(screen.queryByTestId("product-select-button")).not.toBeInTheDocument()
  })

  it("links to the correct product page", () => {
    render(<Item item={makeItem()} currencyCode="USD" />)
    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/cool-shirt")
  })

  // ── Inventory-based quantity options ───────────────────────────────────

  it("renders quantity options up to inventory_quantity when manage_inventory is true", () => {
    render(<Item item={makeItem({ variant: { manage_inventory: true, inventory_quantity: 3 } })} currencyCode="USD" />)
    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveValue("1")
    expect(options[2]).toHaveValue("3")
  })

  it("caps quantity options at 10 even if inventory_quantity > 10", () => {
    render(<Item item={makeItem({ variant: { manage_inventory: true, inventory_quantity: 50 } })} currencyCode="USD" />)
    expect(screen.getAllByRole("option")).toHaveLength(10)
  })

  it("shows 10 options when manage_inventory is false regardless of inventory_quantity", () => {
    render(<Item item={makeItem({ variant: { manage_inventory: false, inventory_quantity: 2 } })} currencyCode="USD" />)
    expect(screen.getAllByRole("option")).toHaveLength(10)
  })

  it("falls back to 10 when inventory_quantity is null", () => {
    render(<Item item={makeItem({ variant: { manage_inventory: true, inventory_quantity: null } })} currencyCode="USD" />)
    expect(screen.getAllByRole("option")).toHaveLength(10)
  })

  // ── Quantity update ────────────────────────────────────────────────────

  it("calls updateLineItem when quantity is changed", async () => {
    mockUpdateLineItem.mockResolvedValue(undefined)
    render(<Item item={makeItem()} currencyCode="USD" />)

    fireEvent.change(screen.getByTestId("product-select-button"), {
      target: { value: "4" },
    })

    await waitFor(() => {
      expect(mockUpdateLineItem).toHaveBeenCalledWith({ lineId: "li_01", quantity: 4 })
    })
  })

  it("shows spinner while updating", async () => {
    let resolveUpdate: () => void
    mockUpdateLineItem.mockReturnValue(new Promise((res) => { resolveUpdate = res }))
    render(<Item item={makeItem()} currencyCode="USD" />)

    fireEvent.change(screen.getByTestId("product-select-button"), {
      target: { value: "3" },
    })

    await waitFor(() => expect(screen.getByTestId("spinner")).toBeInTheDocument())
    resolveUpdate!()
    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument())
  })

  it("shows error message when updateLineItem fails", async () => {
    mockUpdateLineItem.mockRejectedValue(new Error("Out of stock"))
    render(<Item item={makeItem()} currencyCode="USD" />)

    fireEvent.change(screen.getByTestId("product-select-button"), {
      target: { value: "3" },
    })

    await waitFor(() => {
      expect(screen.getByTestId("product-error-message")).toHaveTextContent("Out of stock")
    })
  })

  it("hides spinner after update completes successfully", async () => {
    mockUpdateLineItem.mockResolvedValue(undefined)
    render(<Item item={makeItem()} currencyCode="USD" />)

    fireEvent.change(screen.getByTestId("product-select-button"), {
      target: { value: "2" },
    })

    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument())
  })
})
