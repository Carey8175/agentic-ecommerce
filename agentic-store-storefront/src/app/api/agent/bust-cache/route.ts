import { revalidateTag } from "next/cache";

export async function GET() {
  revalidateTag("orders");
  return new Response("Orders cache busted", { status: 200 });
}