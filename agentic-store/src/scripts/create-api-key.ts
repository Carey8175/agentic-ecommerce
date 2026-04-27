import { IApiKeyModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"

export default async function createApiKey({ container }: ExecArgs) {
  const apiKeyService: IApiKeyModuleService = container.resolve(Modules.API_KEY)
  const key = await apiKeyService.createApiKeys({
    title: "Agent Service Secret Key",
    type: "secret",
    created_by: "user_01KP2RPXA3MTDXXSW4G2H8DGSD",
  })
  console.log("Created secret key:", key.token)
}
