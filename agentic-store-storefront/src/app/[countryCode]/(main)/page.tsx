import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import RandomProducts from "@modules/home/components/random-products"
import HeroChat from "@modules/ai-chat/components/hero-chat"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Byteshop",
  description: "Curated products, delivered to you.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!region) {
    return null
  }

  return (
    <>
      <HeroChat />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <RandomProducts region={region} countryCode={countryCode} />
          {collections && collections.length > 0 && (
            <FeaturedProducts collections={collections} region={region} />
          )}
        </ul>
      </div>
    </>
  )
}
