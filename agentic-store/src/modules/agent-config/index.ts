import AgentConfigModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const AGENT_CONFIG_MODULE = "agentConfig"

export default Module(AGENT_CONFIG_MODULE, {
  service: AgentConfigModuleService,
})
