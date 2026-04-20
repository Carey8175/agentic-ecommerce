/**
 * Tests for cart Item component
 * src/modules/cart/components/item/index.tsx
 *
 * Uses +/- buttons for quantity control (not a dropdown).
 * Quantity is capped by inventory when manage_inventory is true.
 */
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Item from "@modules/cart/components/item"

jest.mock("@lib/data/cart", () => ({
  updateLineItem: jest.fn(),
}))

jest.mock("@medusajs/ui", () => ({
  Table: {
    Row: ({ children, "data-testid": testId }: any) => <tr data-testid={testId}>{children}</tr>,
    Cell: ({ children, className }: any) => <td className={className}>{children}</td>,
  },
  Text: ({ children, "data-testid": testId, className }: any) => (
    <span data-testid={testId} className={className}>{children}</span>
  ),
  clx: (...args: any[]) => args.flatMap((a) => {
    if (!a) return []
    if (typeof a === "string") return [a]
    return Object.entries(a).filter(([, v]) => v).map(([k]) => k)
  }).join(" "),
}))

jest.mock("@modules/products/components/thumbnail", () => {
  const MockThumb = () => <div data-testid="thumbnail" />
  MockThumb.displayName = "MockThumb"
  return MockThumb
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

  it("renders +/- quantity controls in full mode by default", () => {
    render(<Item item={makeItem()} currencyCode="USD" />)
    expect(screen.getByTestId("product-quantity-control")).toBeInTheDocument()
    expect(screen.getByTestId("product-quantity-minus")).toBeInTheDocument()
    expect(screen.getByTestId("product-quantity-plus")).toBeInTheDocument()
    expect(screen.getByTestId("product-quantity-value")).toBeInTheDocument()
  })

  it("displays the current quantity in the quantity value span", () => {
    render(<Item item={makeItem({ quantity: 3 })} currencyCode="USD" />)
    expect(screen.getByTestId("product-quantity-value")).toHaveTextContent("3")
  })

  it("does not render quantity controls in preview mode", () => {
    render(<Item item={makeItem()} currencyCode="USD" type="preview" />)
    expect(screen.queryByTestId("product-quantity-control")).not.toBeInTheDocument()
    expect(screen.queryByTestId("product-delete-button")).not.toBeInTheDocument()
  })

  it("links to the correct product page", () => {
    render(<Item item={makeItem()} currencyCode="USD" />)
    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/cool-shirt")
  })

  // ── Button disabled states ─────────────────────────────────────────────

  it("disables minus button when quantity is 1", () => {
    render(<Item item={makeItem({ quantity: 1 })} currencyCode="USD" />)
    expect(screen.getByTestId("product-quantity-minus")).toBeDisabled()
  })

  it("enables minus button when quantity > 1", () => {
    render(<Item item={makeItem({ quantity: 2 })} currencyCode="USD" />)
    expect(screen.getByTestId("product-quantity-minus")).not.toBeDisabled()
  })

  it("disables plus button at max inventory quantity", () => {
    render(<Item item={makeItem({ quantity: 5, variant: { manage_inventory: true, inventory_quantity: 5, product: { images: [] } } })} currencyCode="USD" />)
    expect(screen.getByTestId("product-quantity-plus")).toBeDisabled()
  })

  it("disables plus button at 10 when manage_inventory is false", () => {
    render(<Item item={makeItem({ quantity: 10, variant: { manage_inventory: false, inventory_quantity: 50, product: { images: [] } } })} currencyCode="USD" />)
    expect(screen.getByTestId("product-quantity-plus")).toBeDisabled()
  })

  // ── Quantity update via buttons ────────────────────────────────────────

  it("calls updateLineItem with quantity - 1 when minus is clicked", async () => {
    mockUpdateLineItem.mockResolvedValue(undefined)
    render(<Item item={makeItem({ quantity: 3 })} currencyCode="USD" />)

    fireEvent.click(screen.getByTestId("product-quantity-minus"))

    await waitFor(() => {
      expect(mockUpdateLineItem).toHaveBeenCalledWith({ lineId: "li_01", quantity: 2 })
    })
  })

  it("calls updateLineItem with quantity + 1 when plus is clicked", async () => {
    mockUpdateLineItem.mockResolvedValue(undefined)
    render(<Item item={makeItem({ quantity: 2 })} currencyCode="USD" />)

    fireEvent.click(screen.getByTestId("product-quantity-plus"))

    await waitFor(() => {
      expect(mockUpdateLineItem).toHaveBeenCalledWith({ lineId: "li_01", quantity: 3 })
    })
  })

  it("shows spinner while updating", async () => {
    let resolveUpdate: () => void
    mockUpdateLineItem.mockReturnValue(new Promise((res) => { resolveUpdate = res }))
    render(<Item item={makeItem({ quantity: 2 })} currencyCode="USD" />)

    fireEvent.click(screen.getByTestId("product-quantity-plus"))

    await waitFor(() => expect(screen.getByTestId("spinner")).toBeInTheDocument())
    resolveUpdate!()
    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument())
  })

  it("shows error message when updateLineItem fails", async () => {
    mockUpdateLineItem.mockRejectedValue(new Error("Out of stock"))
    render(<Item item={makeItem({ quantity: 2 })} currencyCode="USD" />)

    fireEvent.click(screen.getByTestId("product-quantity-plus"))

    await waitFor(() => {
      expect(screen.getByTestId("product-error-message")).toHaveTextContent("Out of stock")
    })
  })

  it("hides spinner after update completes successfully", async () => {
    mockUpdateLineItem.mockResolvedValue(undefined)
    render(<Item item={makeItem({ quantity: 2 })} currencyCode="USD" />)

    fireEvent.click(screen.getByTestId("product-quantity-plus"))

    await waitFor(() => expect(screen.queryByTestId("spinner")).not.toBeInTheDocument())
  })
})
