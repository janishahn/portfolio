import Section from "@/components/Section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel } from "@/components/ui/carousel"
import { getBackendUrl } from "@/lib/backend"
import useSWR from "swr"

type Thesis = {
  title: string
  abstract?: string
  assets?: string[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ThesisPage() {
  const backend = getBackendUrl()
  const { data: thesis } = useSWR<Thesis>(`${backend}/api/thesis`, fetcher)
  const resolveAsset = (asset: string) =>
    asset.startsWith("http") ? asset : `${backend}${asset}`

  const images = (thesis?.assets ?? []).filter((asset) => {
    const ext = asset.split(".").pop()?.toLowerCase()
    return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext ?? "")
  })
  const pdfs = (thesis?.assets ?? []).filter((asset) =>
    asset.toLowerCase().endsWith(".pdf")
  )

  if (!thesis) {
    return null
  }

  return (
    <main className="pt-20">
      <Section id="thesis-page">
        <div className="space-y-12">
          <h1 className="font-bold text-3xl mb-6">{thesis.title}</h1>

          {thesis.abstract && (
            <Card className="backdrop-blur-md bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 shadow-md">
              <CardHeader>
                <CardTitle>Abstract</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {thesis.abstract}
                </p>
              </CardContent>
            </Card>
          )}

          {images.length > 0 && (
            <div className="flex flex-col items-center gap-4">
              <Carousel className="max-w-3xl">
                {images.map((asset, idx) => (
                  <img
                    key={idx}
                    src={resolveAsset(asset)}
                    alt={asset}
                    className="w-full h-auto rounded shadow object-contain"
                  />
                ))}
              </Carousel>
              <p className="text-sm text-muted-foreground text-center">
                Sample plots from the thesis
              </p>
            </div>
          )}

          {pdfs.map((asset, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <iframe
                src={`${resolveAsset(asset)}#toolbar=0&navpanes=0&scrollbar=0`}
                title={asset}
                className="w-full max-w-5xl h-[80vh] rounded border shadow"
              />
              <a
                href={resolveAsset(asset)}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline"
              >
                Download PDF
              </a>
            </div>
          ))}
        </div>
      </Section>
    </main>
  )
}
