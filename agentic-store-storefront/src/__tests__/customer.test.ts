/**
 * Tests for src/lib/data/customer.ts
 * Covers: updatePassword, updateCustomer
 */

// Mock the sdk module before importing anything that uses it
jest.mock("@lib/config", () => ({
  sdk: {
    auth: {
      login: jest.fn(),
      updateProvider: jest.fn(),
    },
    store: {
      customer: {
        update: jest.fn(),
      },
    },
  },
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ authorization: "Bearer test-token" }),
  getCacheTag: jest.fn().mockResolvedValue("customers-abc123"),
  getCacheOptions: jest.fn().mockResolvedValue({ tags: ["customers-abc123"] }),
  getCartId: jest.fn().mockResolvedValue("cart_01"),
  setAuthToken: jest.fn().mockResolvedValue(undefined),
  removeAuthToken: jest.fn().mockResolvedValue(undefined),
  removeCartId: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}))

jest.mock("@lib/util/medusa-error", () => jest.fn((e: Error) => { throw e }))

import { sdk } from "@lib/config"
import { updatePassword, updateCustomer } from "@lib/data/customer"
import { revalidateTag } from "next/cache"

const mockSdk = sdk as jest.Mocked<typeof sdk>

// ─── updatePassword ───────────────────────────────────────────────────────────

describe("updatePassword", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns success when old password is correct and update succeeds", async () => {
    mockSdk.auth.login.mockResolvedValue("fresh-token-abc")
    mockSdk.auth.updateProvider.mockResolvedValue(undefined)

    const result = await updatePassword("user@test.com", "oldpass", "newpass")

    expect(result).toEqual({ success: true, error: null })
    expect(mockSdk.auth.login).toHaveBeenCalledWith("customer", "emailpass", {
      email: "user@test.com",
      password: "oldpass",
    })
    expect(mockSdk.auth.updateProvider).toHaveBeenCalledWith(
      "customer",
      "emailpass",
      { password: "newpass" },
      "fresh-token-abc"
    )
  })

  it("returns error when login returns a non-string token (wrong password)", async () => {
    mockSdk.auth.login.mockResolvedValue({ token: "object-not-string" } as any)

    const result = await updatePassword("user@test.com", "wrongpass", "newpass")

    expect(result).toEqual({ success: false, error: "Current password is incorrect" })
    expect(mockSdk.auth.updateProvider).not.toHaveBeenCalled()
  })

  it("returns error when login returns null", async () => {
    mockSdk.auth.login.mockResolvedValue(null as any)

    const result = await updatePassword("user@test.com", "wrongpass", "newpass")

    expect(result).toEqual({ success: false, error: "Current password is incorrect" })
  })

  it("returns error message when login throws", async () => {
    mockSdk.auth.login.mockRejectedValue(new Error("Invalid credentials"))

    const result = await updatePassword("user@test.com", "badpass", "newpass")

    expect(result).toEqual({ success: false, error: "Invalid credentials" })
  })

  it("returns error message when updateProvider throws", async () => {
    mockSdk.auth.login.mockResolvedValue("fresh-token")
    mockSdk.auth.updateProvider.mockRejectedValue(new Error("Update failed"))

    const result = await updatePassword("user@test.com", "oldpass", "newpass")

    expect(result).toEqual({ success: false, error: "Update failed" })
  })

  it("returns generic error message when error has no message", async () => {
    mockSdk.auth.login.mockRejectedValue({})

    const result = await updatePassword("user@test.com", "oldpass", "newpass")

    expect(result).toEqual({ success: false, error: "Failed to update password" })
  })
})

// ─── updateCustomer ───────────────────────────────────────────────────────────

describe("updateCustomer", () => {
  beforeEach(() => jest.clearAllMocks())

  it("calls sdk.store.customer.update with correct body and auth headers", async () => {
    const fakeCustomer = { id: "cus_01", first_name: "Jane", last_name: "Doe" }
    mockSdk.store.customer.update.mockResolvedValue({ customer: fakeCustomer } as any)

    const body = { first_name: "Jane", last_name: "Doe" }
    const result = await updateCustomer(body)

    expect(mockSdk.store.customer.update).toHaveBeenCalledWith(
      body,
      {},
      { authorization: "Bearer test-token" }
    )
    expect(result).toEqual(fakeCustomer)
  })

  it("revalidates the customer cache tag after update", async () => {
    mockSdk.store.customer.update.mockResolvedValue({ customer: { id: "cus_01" } } as any)

    await updateCustomer({ first_name: "Jane" })

    expect(revalidateTag).toHaveBeenCalledWith("customers-abc123")
  })

  it("throws when sdk update fails", async () => {
    mockSdk.store.customer.update.mockRejectedValue(new Error("Server error"))

    await expect(updateCustomer({ first_name: "Jane" })).rejects.toThrow("Server error")
  })
})
