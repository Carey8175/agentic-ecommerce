/**
 * Tests for ProfileEmail component
 * src/modules/account/components/profile-email/index.tsx
 *
 * Email updates are not supported by Medusa's StoreUpdateCustomer API.
 * The component is a plain read-only display — no form, no edit button.
 */
import React from "react"
import { render, screen } from "@testing-library/react"
import ProfileEmail from "@modules/account/components/profile-email"

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

  it("renders the wrapper with the correct test id", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    expect(screen.getByTestId("account-email-editor")).toBeInTheDocument()
  })

  it("shows the Email label in uppercase style", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    expect(screen.getByText("Email")).toBeInTheDocument()
  })

  it("does not render any input field", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("does not render any form element", () => {
    const { container } = render(<ProfileEmail customer={fakeCustomer} />)
    expect(container.querySelector("form")).toBeNull()
  })

  it("does not render any button", () => {
    render(<ProfileEmail customer={fakeCustomer} />)
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
