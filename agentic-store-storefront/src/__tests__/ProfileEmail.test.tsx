/**
 * Tests for ProfileEmail component
 * src/modules/account/components/profile-email/index.tsx
 *
 * Email updates are disabled because Medusa's StoreUpdateCustomer API does not
 * support changing email. The component shows the current email as read-only
 * with a message directing users to contact support.
 */
import React from "react"
import { render, screen } from "@testing-library/react"
import ProfileEmail from "@modules/account/components/profile-email"

jest.mock("@modules/account/components/account-info", () => {
  const MockAccountInfo = ({ children, label, currentInfo }: any) => (
    <div>
      <span data-testid="account-info-label">{label}</span>
      <span data-testid="current-info">{currentInfo}</span>
      {children}
    </div>
  )
  MockAccountInfo.displayName = "MockAccountInfo"
  return MockAccountInfo
})

const fakeCustomer = {
  id: "cus_01",
  email: "user@test.com",
  first_name: "John",
  last_name: "Doe",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
} as any

describe("ProfileEmail", () => {
  it("displays the customer's current email", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    expect(screen.getByTestId("current-info")).toHaveTextContent("user@test.com")
  })

  it("renders the email input with the customer's email as default value", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    const input = screen.getByTestId("email-input") as HTMLInputElement
    expect(input.value).toBe("user@test.com")
  })

  it("renders the email input as disabled", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    const input = screen.getByTestId("email-input")
    expect(input).toBeDisabled()
  })

  it("shows the cannot-change message", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    expect(
      screen.getByText(/email address cannot be changed/i)
    ).toBeInTheDocument()
  })

  it("does not render a submit button (no form action)", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()
  })

  it("renders with the label 'Email'", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    expect(screen.getByTestId("account-info-label")).toHaveTextContent("Email")
  })
})
