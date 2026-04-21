/**
 * Tests for ProfilePassword component
 * src/modules/account/components/profile-password/index.tsx
 */
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ProfilePassword from "@modules/account/components/profile-password"

// Mock updatePassword server action
jest.mock("@lib/data/customer", () => ({
  updatePassword: jest.fn(),
}))

// Mock AccountInfo — renders children + a save button so form submission works
jest.mock("@modules/account/components/account-info", () => {
  const MockAccountInfo = ({ children, isSuccess, isError, errorMessage, label }: any) => (
    <div>
      <span data-testid="account-info-label">{label}</span>
      {isSuccess && <span data-testid="success-message">{label} updated succesfully</span>}
      {isError && <span data-testid="error-message">{errorMessage}</span>}
      {children}
      <button type="submit" data-testid="save-button">Save changes</button>
    </div>
  )
  MockAccountInfo.displayName = "MockAccountInfo"
  return MockAccountInfo
})

import { updatePassword } from "@lib/data/customer"
const mockUpdatePassword = updatePassword as jest.Mock

const fakeCustomer = {
  id: "cus_01",
  email: "user@test.com",
  first_name: "John",
  last_name: "Doe",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as any

describe("ProfilePassword", () => {
  beforeEach(() => jest.clearAllMocks())

  it("renders all three password fields", () => {
    render(<ProfilePassword customer={fakeCustomer} />)
    expect(screen.getByTestId("old-password-input")).toBeInTheDocument()
    expect(screen.getByTestId("new-password-input")).toBeInTheDocument()
    expect(screen.getByTestId("confirm-password-input")).toBeInTheDocument()
  })

  it("all password inputs are of type password", () => {
    render(<ProfilePassword customer={fakeCustomer} />)
    const passwordInputs = document.querySelectorAll('input[type="password"]')
    expect(passwordInputs.length).toBe(3)
  })

  it("shows error when new passwords do not match", async () => {
    render(<ProfilePassword customer={fakeCustomer} />)

    await userEvent.type(screen.getByTestId("old-password-input"), "oldpass")
    await userEvent.type(screen.getByTestId("new-password-input"), "newpass1")
    await userEvent.type(screen.getByTestId("confirm-password-input"), "newpass2")
    fireEvent.click(screen.getByTestId("save-button"))

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "New passwords do not match"
      )
    })
    expect(mockUpdatePassword).not.toHaveBeenCalled()
  })

  it("calls updatePassword with correct args when passwords match", async () => {
    mockUpdatePassword.mockResolvedValue({ success: true, error: null })
    render(<ProfilePassword customer={fakeCustomer} />)

    await userEvent.type(screen.getByTestId("old-password-input"), "oldpass")
    await userEvent.type(screen.getByTestId("new-password-input"), "newpass")
    await userEvent.type(screen.getByTestId("confirm-password-input"), "newpass")
    fireEvent.click(screen.getByTestId("save-button"))

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith(
        "user@test.com",
        "oldpass",
        "newpass"
      )
    })
  })

  it("shows success state when update succeeds", async () => {
    mockUpdatePassword.mockResolvedValue({ success: true, error: null })
    render(<ProfilePassword customer={fakeCustomer} />)

    await userEvent.type(screen.getByTestId("old-password-input"), "oldpass")
    await userEvent.type(screen.getByTestId("new-password-input"), "newpass")
    await userEvent.type(screen.getByTestId("confirm-password-input"), "newpass")
    fireEvent.click(screen.getByTestId("save-button"))

    await waitFor(() => {
      expect(screen.getByTestId("success-message")).toBeInTheDocument()
    })
  })

  it("shows error message returned from updatePassword on failure", async () => {
    mockUpdatePassword.mockResolvedValue({
      success: false,
      error: "Current password is incorrect",
    })
    render(<ProfilePassword customer={fakeCustomer} />)

    await userEvent.type(screen.getByTestId("old-password-input"), "wrongpass")
    await userEvent.type(screen.getByTestId("new-password-input"), "newpass")
    await userEvent.type(screen.getByTestId("confirm-password-input"), "newpass")
    fireEvent.click(screen.getByTestId("save-button"))

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Current password is incorrect"
      )
    })
  })
})
