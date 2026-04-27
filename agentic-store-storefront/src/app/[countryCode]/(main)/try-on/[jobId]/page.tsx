import TryOnDetailClient from "@modules/try-on/templates/tryon-detail-client"

export default async function TryOnDetailPage({ params }: { params: Promise<{ jobId: string; countryCode: string }> }) {
  const { jobId, countryCode } = await params
  return <TryOnDetailClient jobId={jobId} countryCode={countryCode} />
}
