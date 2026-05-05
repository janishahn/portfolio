import {
  ArrowLeft,
  ArrowRight,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  FilePdf,
} from "@phosphor-icons/react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import useSWR from "swr"
import SiteNav from "@/components/SiteNav"
import { getBackendUrl } from "@/lib/backend"

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Thesis = {
  title: string
  summary?: string
  abstract?: string
  assets?: string[]
}

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json()
}

const resolveAsset = (backend: string, asset: string) =>
  asset.startsWith("http") ? asset : `${backend}${asset}`

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export default function ThesisPage() {
  const backend = getBackendUrl()
  const rootRef = useRef<HTMLElement>(null)
  const [activeImage, setActiveImage] = useState(0)
  const {
    data: thesis,
    error,
    isLoading,
  } = useSWR<Thesis>(`${backend}/api/thesis`, fetcher)

  const images = useMemo(
    () =>
      (thesis?.assets ?? []).filter((asset) => {
        const ext = asset.split(".").pop()?.toLowerCase()
        return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext ?? "")
      }),
    [thesis?.assets],
  )
  const pdfs = useMemo(
    () =>
      (thesis?.assets ?? []).filter((asset) =>
        asset.toLowerCase().endsWith(".pdf"),
      ),
    [thesis?.assets],
  )

  const currentImage = images[activeImage] ?? images[0]

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0, behavior: "auto" })
  }, [])

  useGSAP(
    () => {
      const revealItems = gsap.utils.toArray<HTMLElement>(".gsap-reveal")
      revealItems.forEach((item) => {
        gsap.fromTo(
          item,
          { y: 42 },
          {
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 84%",
            },
            y: 0,
          },
        )
      })

      const imageItems = gsap.utils.toArray<HTMLElement>(".gsap-image")
      imageItems.forEach((item) => {
        gsap.fromTo(
          item,
          { autoAlpha: 0.35, scale: 0.88 },
          {
            autoAlpha: 1,
            ease: "none",
            scale: 1,
            scrollTrigger: {
              end: "top 58%",
              scrub: true,
              start: "top 96%",
              trigger: item,
            },
          },
        )
      })
    },
    {
      dependencies: [images.length, thesis?.title],
      revertOnUpdate: true,
      scope: rootRef,
    },
  )

  return (
    <main ref={rootRef} className="site-shell min-h-[100dvh] overflow-x-hidden">
      <SiteNav />

      <section className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 pb-20 pt-28 sm:px-8 md:pb-28 lg:grid-cols-[0.82fr_1.18fr] lg:px-12">
        <div className="lg:col-span-2">
          <Link
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-moss transition hover:text-ink"
            to="/"
          >
            <ArrowLeft aria-hidden="true" className="size-4" weight="bold" />
            Portfolio
          </Link>

          {isLoading && (
            <div className="space-y-4">
              <SkeletonBlock className="h-16 w-11/12" />
              <SkeletonBlock className="h-16 w-9/12" />
              <SkeletonBlock className="h-4 w-10/12" />
              <SkeletonBlock className="h-4 w-8/12" />
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-rust/25 bg-rust/10 p-4 text-sm text-rust">
              Unable to load thesis details right now.
            </p>
          )}

          {thesis && (
            <>
              <p className="mb-7 text-[0.7rem] font-semibold uppercase text-moss">
                Bachelor&apos;s Thesis
              </p>
              <h1 className="max-w-[72rem] text-5xl font-semibold leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
                {thesis.title}
              </h1>
              {thesis.summary && (
                <p className="mt-9 max-w-2xl text-lg leading-8 text-ink/64">
                  {thesis.summary}
                </p>
              )}
            </>
          )}
        </div>

        {currentImage && (
          <div className="overflow-hidden rounded-[1.2rem] border border-ink/10 bg-porcelain p-3 shadow-[0_30px_80px_rgba(54,45,37,0.13)] lg:col-span-2">
            <img
              alt=""
              className="aspect-[4/3] w-full rounded-[max(0px,calc(1.2rem-0.75rem))] object-contain"
              src={resolveAsset(backend, currentImage)}
            />
          </div>
        )}
      </section>

      {thesis?.abstract && (
        <section className="bg-ink px-5 py-24 text-porcelain sm:px-8 md:py-36 lg:px-12">
          <div className="mx-auto grid w-full max-w-[1440px] gap-12 lg:grid-cols-[0.35fr_1fr]">
            <h2 className="gsap-reveal section-heading text-porcelain">Abstract</h2>
            <p className="gsap-reveal text-xl leading-9 text-porcelain/72 md:text-2xl md:leading-10">
              {thesis.abstract}
            </p>
          </div>
        </section>
      )}

      {images.length > 0 && (
        <section className="mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8 md:py-36 lg:px-12">
          <div className="gsap-reveal mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 className="chapter-title">Sample plots from the thesis</h2>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Previous thesis plot"
                className="icon-button"
                type="button"
                onClick={() =>
                  setActiveImage((value) =>
                    value === 0 ? images.length - 1 : value - 1,
                  )
                }
              >
                <CaretLeft aria-hidden="true" className="size-5" weight="bold" />
              </button>
              <button
                aria-label="Next thesis plot"
                className="icon-button"
                type="button"
                onClick={() =>
                  setActiveImage((value) =>
                    value === images.length - 1 ? 0 : value + 1,
                  )
                }
              >
                <CaretRight aria-hidden="true" className="size-5" weight="bold" />
              </button>
            </div>
          </div>

          {currentImage && (
            <figure className="gsap-image overflow-hidden rounded-[1.2rem] border border-ink/10 bg-porcelain p-3 shadow-[0_22px_70px_rgba(54,45,37,0.1)]">
              <img
                alt=""
                className="aspect-[16/10] w-full rounded-[max(0px,calc(1.2rem-0.75rem))] object-contain"
                src={resolveAsset(backend, currentImage)}
              />
            </figure>
          )}

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
            {images.map((asset, index) => (
              <button
                key={asset}
                aria-label={`Show thesis plot ${index + 1}`}
                className={`h-24 min-w-36 overflow-hidden rounded-xl border bg-porcelain p-1 transition duration-300 ${
                  index === activeImage
                    ? "border-moss shadow-[0_12px_34px_rgba(83,100,93,0.18)]"
                    : "border-ink/10 opacity-65 hover:opacity-100"
                }`}
                type="button"
                onClick={() => setActiveImage(index)}
              >
                <img
                  alt=""
                  className="h-full w-full rounded-[max(0px,calc(0.75rem-0.25rem))] object-contain"
                  src={resolveAsset(backend, asset)}
                />
              </button>
            ))}
          </div>

        </section>
      )}

      {pdfs.map((asset) => (
        <section
          key={asset}
          className="mx-auto w-full max-w-[1440px] px-5 pb-24 sm:px-8 md:pb-36 lg:px-12"
        >
          <div className="gsap-reveal mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <h2 className="chapter-title">Full Thesis</h2>
            <a
              className="button-dark w-fit"
              download
              href={resolveAsset(backend, asset)}
              rel="noopener noreferrer"
              target="_blank"
            >
              Download PDF
              <DownloadSimple aria-hidden="true" className="size-4" weight="bold" />
            </a>
          </div>
          <div className="gsap-image overflow-hidden rounded-[1.2rem] border border-ink/10 bg-porcelain p-2 shadow-[0_22px_70px_rgba(54,45,37,0.1)]">
            <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3 text-sm font-semibold text-ink/64">
              <FilePdf aria-hidden="true" className="size-5 text-moss" weight="bold" />
              {asset.split("/").pop()}
            </div>
            <iframe
              className="h-[80dvh] w-full bg-white"
              src={`${resolveAsset(backend, asset)}#toolbar=0&navpanes=0&scrollbar=0`}
              title={asset}
            />
          </div>
        </section>
      ))}

      <footer className="border-t border-ink/10 px-5 py-10 text-center text-[0.7rem] font-semibold uppercase text-ink/45 sm:px-8">
        Janis Hahn
        <ArrowRight aria-hidden="true" className="mx-3 inline size-3 text-moss" weight="bold" />
        Portfolio
      </footer>
    </main>
  )
}
