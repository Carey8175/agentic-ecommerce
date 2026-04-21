import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, MedusaError } from "@medusajs/framework/utils"

/**
 * POST /store/customers/me/password
 *
 * Changes a customer's password. Requires a valid customer JWT.
 * Verifies the old password before applying the change.
 *
 * Body: { old_password: string, new_password: string }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const { old_password, new_password } = req.body as {
    old_password?: string
    new_password?: string
  }

  if (!old_password || !new_password) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "old_password and new_password are required"
    )
  }

  const authService = req.scope.resolve(Modules.AUTH)
  const customerService = req.scope.resolve(Modules.CUSTOMER)

  // Get the customer to find their email
  const customer = await customerService.retrieveCustomer(customerId)

  if (!customer?.email) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Customer not found")
  }

  // Verify old password via authenticate
  const authResult = await authService.authenticate("emailpass", {
    url: req.url,
    headers: req.headers as Record<string, string>,
    query: {},
    body: { email: customer.email, password: old_password },
    authScope: "store",
  } as any)

  if (!authResult.success) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Current password is incorrect"
    )
  }

  // authResult.authIdentity is the auth identity that authenticated
  const authIdentity = authResult.authIdentity as any

  if (!authIdentity?.id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Auth identity not found"
    )
  }

  // Update the password using the auth identity's own ID as entity_id
  await authService.updateProvider("emailpass", {
    entity_id: authIdentity.id,
    password: new_password,
  } as any)

  res.status(200).json({ success: true })
}
