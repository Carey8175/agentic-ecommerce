import { Metadata } from "next"
import AiAssistantSettings from "@modules/account/components/ai-assistant-settings"

export const metadata: Metadata = {
  title: "AI Assistant Settings",
  description: "Manage your AI shopping assistant preferences.",
}

export default function AiAssistantPage() {
  return <AiAssistantSettings />
}
