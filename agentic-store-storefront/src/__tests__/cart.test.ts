/**
 * Tests for src/lib/data/cart.ts
 * Covers: parseAddress (via setAddresses), setAddresses
 *
 * parseAddress is not exported so we test it indirectly through setAddresses.
 */

jest.mock("@lib/config", () => ({
  sdk: {
    store: {
      cart: {
        retrieve: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        createLineItem: jest.fn(),
        updateLineItem: jest.fn(),
        deleteLineItem: jest.fn(),
        addShippingMethod: jest.fn(),
        complete: jest.fn(),
      },
    },
    client: {
      fetch: jest.fn(),
    },
  },
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ authorization: "Bearer test-token" }),
  getCacheTag: jest.fn().mockResolvedValue("carts-abc123"),
  getCacheOptions: jest.fn().mockResolvedValue({ tags: ["carts-abc123"] }),
  getCartId: jest.fn(),
  setCartId: jest.fn().mockResolvedValue(undefined),
  removeCartId: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }))
jest.mock("next/navigation", () => ({ redirect: jest.fn() }))
jest.mock("@lib/data/regions", () => ({ getRegion: jest.fn() }))
jest.mock("@lib/data/locale-actions", () => ({ getLocale: jest.fn().mockResolvedValue("en") }))
jest.mock("@lib/util/medusa-error", () => jest.fn((e: Error) => { throw e }))

import { getCartId } from "@lib/data/cookies"
import { redirect } from "next/navigation"
import { setAddresses } from "@lib/data/cart"
import { sdk } from "@lib/config"

const mockGetCartId = getCartId as jest.Mock
const mockRedirect = redirect as jest.Mock
const mockSdk = sdk as any

// Helper: build FormData for address form
function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData()
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
  return fd
}

function shippingFields(overrides: Record<string, string> = {}) {
  return {
    "shipping_address.first_name": "John",
    "shipping_address.last_name": "Doe",
    "shipping_address.address_1": "123 Main St",
    "shipping_address.company": "Acme",
    "shipping_address.postal_code": "10001",
    "shipping_address.city": "New York",
    "shipping_address.country_code": "us",
    "shipping_address.province": "NY",
    "shipping_address.phone": "5551234567",
    email: "john@example.com",
    ...overrides,
  }
}

// ─── setAddresses ─────────────────────────────────────────────────────────────

describe("setAddresses", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCartId.mockResolvedValue("cart_01")
    mockSdk.store.cart.update.mockResolvedValue({ cart: { id: "cart_01" } })
  })

  it("returns error string when cartId is missing", async () => {
    mockGetCartId.mockResolvedValue(undefined)
    const fd = makeFormData(shippingFields())
    const result = await setAddresses(null, fd)
    expect(result).toBe("No existing cart found when setting addresses")
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("parses shipping address fields correctly", async () => {
    const fd = makeFormData(shippingFields({ same_as_billing: "on" }))
    await setAddresses(null, fd)

    const updateCall = mockSdk.store.cart.update.mock.calls[0]
    const payload = updateCall[1] // second arg is the data body (first is cartId)
    expect(payload.shipping_address).toMatchObject({
      first_name: "John",
      last_name: "Doe",
      address_1: "123 Main St",
      address_2: "",
      company: "Acme",
      postal_code: "10001",
      city: "New York",
      country_code: "us",
      province: "NY",
      phone: "5551234567",
    })
  })

  it("uses shipping address as billing when same_as_billing is 'on'", async () => {
    const fd = makeFormData(shippingFields({ same_as_billing: "on" }))
    await setAddresses(null, fd)

    const payload = mockSdk.store.cart.update.mock.calls[0][1]
    expect(payload.billing_address).toEqual(payload.shipping_address)
  })

  it("parses separate billing address when same_as_billing is not set", async () => {
    const fd = makeFormData({
      ...shippingFields(),
      "billing_address.first_name": "Jane",
      "billing_address.last_name": "Smith",
      "billing_address.address_1": "456 Oak Ave",
      "billing_address.company": "",
      "billing_address.postal_code": "90210",
      "billing_address.city": "Beverly Hills",
      "billing_address.country_code": "us",
      "billing_address.province": "CA",
      "billing_address.phone": "5559876543",
    })
    await setAddresses(null, fd)

    const payload = mockSdk.store.cart.update.mock.calls[0][1]
    expect(payload.billing_address).toMatchObject({
      first_name: "Jane",
      last_name: "Smith",
      city: "Beverly Hills",
      country_code: "us",
    })
    expect(payload.billing_address).not.toEqual(payload.shipping_address)
  })

  it("includes email in the update payload", async () => {
    const fd = makeFormData(shippingFields({ same_as_billing: "on" }))
    await setAddresses(null, fd)

    const payload = mockSdk.store.cart.update.mock.calls[0][1]
    expect(payload.email).toBe("john@example.com")
  })

  it("redirects to delivery step with correct country code after success", async () => {
    const fd = makeFormData(shippingFields({ same_as_billing: "on" }))
    await setAddresses(null, fd)
    expect(mockRedirect).toHaveBeenCalledWith("/us/checkout?step=delivery")
  })

  it("returns error string when updateCart throws", async () => {
    mockSdk.store.cart.update.mockRejectedValue(new Error("Cart update failed"))
    const fd = makeFormData(shippingFields({ same_as_billing: "on" }))
    const result = await setAddresses(null, fd)
    expect(result).toBe("Cart update failed")
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("defaults missing address fields to empty string", async () => {
    // Only provide partial fields — missing fields should default to ""
    const fd = makeFormData({
      "shipping_address.first_name": "John",
      "shipping_address.country_code": "us",
      same_as_billing: "on",
      email: "john@example.com",
    })
    await setAddresses(null, fd)

    const payload = mockSdk.store.cart.update.mock.calls[0][1]
    expect(payload.shipping_address.last_name).toBe("")
    expect(payload.shipping_address.city).toBe("")
    expect(payload.shipping_address.postal_code).toBe("")
  })
})
