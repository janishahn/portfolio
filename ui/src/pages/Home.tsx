import {
  ArrowRight,
  ArrowUpRight,
  Code,
  EnvelopeSimple,
  Info,
  Star,
  X,
} from "@phosphor-icons/react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Link } from "react-router-dom"
import useSWR, { preload } from "swr"
import SiteNav from "@/components/SiteNav"
import { getBackendUrl } from "@/lib/backend"

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Profile = {
  name?: string
  about?: string
  email?: string
}

type Repo = {
  name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  updated_at: string
}

type RepoDetail = Repo & {
  readme_summary?: string
  readme_summary_model: string
}

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

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const projectMosaicClass = (index: number) => {
  if (index === 0 || index === 1) {
    return "lg:col-span-3 lg:row-span-2"
  }
  if (index === 4 || index === 5) {
    return "lg:col-span-3"
  }
  return "lg:col-span-2"
}

const repoDetailUrl = (backend: string, repoName: string) =>
  `${backend}/api/repos/${encodeURIComponent(repoName)}`

const resolveAsset = (backend: string, asset: string) =>
  asset.startsWith("http") ? asset : `${backend}${asset}`

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

function ProjectDialog({
  backend,
  repo,
  onClose,
}: {
  backend: string
  repo: Repo | null
  onClose: () => void
}) {
  const repoName = repo?.name ?? null
  const { data: repoDetail, error, isLoading } = useSWR<RepoDetail>(
    repoName ? repoDetailUrl(backend, repoName) : null,
    fetcher,
  )
  const displayRepo = repoDetail ?? repo

  useEffect(() => {
    if (!repoName) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose, repoName])

  if (!repoName || !displayRepo) {
    return null
  }

  return (
    <div
      className="project-dialog-backdrop fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-4 py-4 backdrop-blur-md sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <section
        aria-modal="true"
        className="project-dialog-panel max-h-[88dvh] w-full max-w-3xl overflow-auto rounded-[1.4rem] border border-porcelain/25 bg-porcelain p-5 text-ink shadow-[0_28px_90px_rgba(38,31,25,0.28)] sm:p-8"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-7 flex items-start justify-between gap-5">
          <div>
            <p className="mb-2 text-[0.66rem] font-semibold uppercase text-moss">
              Projects
            </p>
            <h2 className="text-3xl font-semibold sm:text-5xl">
              {displayRepo.name.replace(/[-_]/g, " ")}
            </h2>
          </div>
          <button
            aria-label="Close project details"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-ink/10 bg-ink text-porcelain transition duration-300 hover:-translate-y-px hover:bg-moss active:translate-y-0"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" className="size-4" weight="bold" />
          </button>
        </div>

        {isLoading && !repoDetail && (
          <div className="project-detail-loading space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              {displayRepo.language && (
                <span className="inline-flex items-center gap-2 text-xs uppercase text-ink/55">
                  <Code aria-hidden="true" className="size-4" weight="bold" />
                  {displayRepo.language}
                </span>
              )}
              <span className="text-xs uppercase text-ink/55">
                {formatUpdatedAt(displayRepo.updated_at)}
              </span>
            </div>
            <SkeletonBlock className="h-4 w-11/12" />
            <SkeletonBlock className="h-4 w-10/12" />
            <SkeletonBlock className="h-4 w-8/12" />
            <SkeletonBlock className="h-4 w-9/12" />
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-rust/25 bg-rust/10 p-4 text-sm text-rust">
            Unable to load this repository right now.
          </p>
        )}

        {repoDetail && (
          <div className="project-dialog-content space-y-7">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase text-ink/55">
              {repoDetail.language && (
                <span className="inline-flex items-center gap-2">
                  <Code aria-hidden="true" className="size-4" weight="bold" />
                  {repoDetail.language}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <Star aria-hidden="true" className="size-4" weight="bold" />
                {repoDetail.stargazers_count}
              </span>
              <span>{formatUpdatedAt(repoDetail.updated_at)}</span>
            </div>

            {repoDetail.readme_summary ? (
              <article className="markdown-body repo-summary max-w-none text-[0.98rem] leading-7 text-ink/78">
                <ReactMarkdown>{repoDetail.readme_summary}</ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm italic text-ink/58">
                No README available for this repository.
              </p>
            )}

            <div className="!mt-9 flex items-center justify-between gap-4 border-t border-ink/10 pt-5">
              <a
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-moss"
                href={repoDetail.html_url}
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub
                <ArrowUpRight aria-hidden="true" className="size-4" weight="bold" />
              </a>
              <span
                aria-label={`Summary generated using ${repoDetail.readme_summary_model}`}
                className="group relative inline-flex items-center gap-2 text-xs text-ink/45"
                tabIndex={0}
              >
                <span
                  className="pointer-events-none absolute bottom-full right-0 mb-3 w-max max-w-[17rem] rounded-full border border-ink/10 bg-ink px-3 py-1.5 text-[0.7rem] font-medium normal-case text-porcelain opacity-0 shadow-[0_14px_35px_rgba(48,40,32,0.18)] transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100"
                  role="tooltip"
                >
                  Summary generated with {repoDetail.readme_summary_model}
                </span>
                <Info aria-hidden="true" className="size-4" weight="bold" />
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default function HomePage() {
  const backend = getBackendUrl()
  const rootRef = useRef<HTMLElement>(null)
  const [activeRepo, setActiveRepo] = useState<Repo | null>(null)
  const {
    data: profile,
    error: profileError,
    isLoading: profileLoading,
  } = useSWR<Profile>(`${backend}/api/profile`, fetcher)
  const {
    data: repos,
    error: reposError,
    isLoading: reposLoading,
  } = useSWR<Repo[]>(`${backend}/api/repos`, fetcher, {
    refreshInterval: 1000 * 60 * 10,
  })
  const {
    data: thesis,
    error: thesisError,
    isLoading: thesisLoading,
  } = useSWR<Thesis>(`${backend}/api/thesis`, fetcher)

  const images = useMemo(
    () =>
      (thesis?.assets ?? []).filter((asset) => {
        const ext = asset.split(".").pop()?.toLowerCase()
        return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext ?? "")
      }),
    [thesis?.assets],
  )

  const warmRepoDetail = (repoName: string) => {
    void preload(repoDetailUrl(backend, repoName), fetcher)
  }

  const openRepo = (repo: Repo) => {
    warmRepoDetail(repo.name)
    setActiveRepo(repo)
  }

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
          { autoAlpha: 0.36, scale: 0.88 },
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

      return undefined
    },
    {
      dependencies: [repos?.length, images.length, thesis?.title],
      revertOnUpdate: true,
      scope: rootRef,
    },
  )

  return (
    <main ref={rootRef} className="site-shell min-h-[100dvh] overflow-x-hidden">
      <SiteNav />

      <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-8 md:pb-24 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_74%_34%,rgba(83,100,93,0.18),transparent_28%),radial-gradient(circle_at_12%_84%,rgba(148,93,63,0.16),transparent_25%)]" />
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="max-w-[72rem]">
            <p className="mb-8 text-[0.7rem] font-semibold uppercase text-moss">
              Portfolio
            </p>
            <h1 className="max-w-[72rem] text-7xl font-semibold leading-[0.85] text-ink sm:text-8xl lg:text-9xl xl:text-[10rem]">
              {profile?.name ?? "Janis Hahn"}
            </h1>
            <div className="mt-10 flex flex-wrap gap-3">
              <a className="button-dark" href="#projects">
                Projects
                <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
              </a>
              <a className="button-light" href="#contact">
                Contact
                <EnvelopeSimple aria-hidden="true" className="size-4" weight="bold" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="mx-auto grid w-full max-w-[1440px] grid-flow-dense gap-4 px-5 py-24 sm:px-8 md:py-36 lg:grid-cols-6 lg:px-12"
      >
        <article className="gsap-reveal bento-panel lg:col-span-3">
          <h2 className="section-heading">About Me</h2>
          {profileLoading && (
            <div className="mt-8 space-y-3">
              <SkeletonBlock className="h-4 w-11/12" />
              <SkeletonBlock className="h-4 w-10/12" />
              <SkeletonBlock className="h-4 w-8/12" />
            </div>
          )}
          {profileError && (
            <p className="mt-8 rounded-xl border border-rust/25 bg-rust/10 p-4 text-sm text-rust">
              Unable to load the profile right now.
            </p>
          )}
          {profile?.about && (
            <div className="mt-8 max-w-[63ch] text-xl leading-8 text-ink/74">
              <ReactMarkdown>{profile.about}</ReactMarkdown>
            </div>
          )}
        </article>

        <article className="gsap-reveal bento-panel overflow-hidden lg:col-span-3">
          <div className="flex h-full flex-col justify-between">
            <div>
              <h2 className="section-heading">Projects</h2>
              <div className="mt-8 space-y-4">
                {reposLoading &&
                  [0, 1, 2].map((item) => (
                    <SkeletonBlock key={item} className="h-10 w-full" />
                  ))}
                {reposError && (
                  <p className="rounded-xl border border-rust/25 bg-rust/10 p-4 text-sm text-rust">
                    Unable to load projects right now.
                  </p>
                )}
                {repos?.slice(0, 4).map((repo) => (
                  <button
                    key={repo.name}
                    className="group flex w-full items-center justify-between gap-4 border-b border-ink/10 pb-4 text-left transition duration-300 hover:border-ink/30"
                    type="button"
                    onFocus={() => warmRepoDetail(repo.name)}
                    onPointerEnter={() => warmRepoDetail(repo.name)}
                    onClick={() => openRepo(repo)}
                  >
                    <span>
                      <span className="block text-lg font-semibold text-ink">
                        {repo.name}
                      </span>
                      <span className="text-xs uppercase text-ink/44">
                        {repo.language ?? formatUpdatedAt(repo.updated_at)}
                      </span>
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-moss transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                      weight="bold"
                    />
                  </button>
                ))}
              </div>
            </div>
            <a className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-moss" href="#projects">
              Projects
              <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
            </a>
          </div>
        </article>

        <article className="gsap-reveal bento-panel lg:col-span-4">
          <h2 className="section-heading">Bachelor&apos;s Thesis</h2>
          {thesisLoading && (
            <div className="mt-8 space-y-3">
              <SkeletonBlock className="h-4 w-11/12" />
              <SkeletonBlock className="h-4 w-9/12" />
              <SkeletonBlock className="h-4 w-10/12" />
            </div>
          )}
          {thesisError && (
            <p className="mt-8 rounded-xl border border-rust/25 bg-rust/10 p-4 text-sm text-rust">
              Unable to load thesis details right now.
            </p>
          )}
          {thesis && (
            <div className="mt-8 flex h-[calc(100%-4rem)] flex-col justify-between gap-8">
              <div>
                <h3 className="text-2xl font-semibold leading-tight">
                  {thesis.title}
                </h3>
                {thesis.summary && (
                  <p className="mt-5 line-clamp-6 text-sm leading-6 text-ink/63">
                    {thesis.summary}
                  </p>
                )}
              </div>
              <Link className="button-dark w-fit" to="/thesis">
                Read more
                <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
              </Link>
            </div>
          )}
        </article>

        <article className="gsap-reveal bento-panel p-0 lg:col-span-2">
          <div className="aspect-[246/335] overflow-hidden rounded-[1.1rem] bg-paper">
            <img
              alt=""
              className="h-full w-full object-cover grayscale-[12%] saturate-[0.8] transition duration-700 hover:scale-[1.025]"
              src="/media/headshot2.png"
            />
          </div>
        </article>
      </section>

      <section id="projects" className="mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8 md:py-36 lg:px-12">
        <div className="gsap-reveal mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h2 className="chapter-title">Projects</h2>
        </div>

        {reposLoading && (
          <div className="grid gap-4 lg:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <SkeletonBlock key={item} className="h-64 rounded-[1.1rem] lg:col-span-2" />
            ))}
          </div>
        )}

        {reposError && (
          <p className="rounded-xl border border-rust/25 bg-rust/10 p-4 text-sm text-rust">
            Unable to load projects right now.
          </p>
        )}

        {repos && repos.length === 0 && (
          <p className="rounded-xl border border-ink/10 p-4 text-sm text-ink/60">
            No projects available right now.
          </p>
        )}

        {repos && repos.length > 0 && (
          <div className="grid-flow-dense grid gap-4 lg:auto-rows-[13rem] lg:grid-cols-6">
            {repos.map((repo, index) => (
              <article
                key={repo.name}
                className={`gsap-reveal group relative overflow-hidden rounded-[1.1rem] border border-ink/10 bg-porcelain p-6 shadow-[0_18px_55px_rgba(54,45,37,0.08)] transition duration-500 hover:-translate-y-1 hover:border-moss/40 hover:shadow-[0_24px_70px_rgba(54,45,37,0.13)] ${projectMosaicClass(index)}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_12%,rgba(83,100,93,0.12),transparent_38%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                <button
                  aria-label={`View ${repo.name} details`}
                  className="absolute inset-0 z-10 cursor-pointer"
                  type="button"
                  onFocus={() => warmRepoDetail(repo.name)}
                  onPointerEnter={() => warmRepoDetail(repo.name)}
                  onClick={() => openRepo(repo)}
                />
                <div className="pointer-events-none relative z-20 flex h-full flex-col justify-between gap-8">
                  <div className="flex items-start justify-between gap-5">
                    <div className="min-w-0 text-left">
                      <h3 className="text-2xl font-semibold text-ink [overflow-wrap:anywhere] sm:text-3xl">
                        {repo.name}
                      </h3>
                      {repo.description && (
                        <p className="mt-4 max-w-[42ch] text-sm leading-6 text-ink/62">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <a
                      aria-label={`${repo.name} on GitHub`}
                      className="pointer-events-auto relative z-30 grid size-10 shrink-0 place-items-center rounded-full border border-ink/10 bg-porcelain text-ink transition duration-300 hover:-translate-y-px hover:bg-ink hover:text-porcelain active:translate-y-0"
                      href={repo.html_url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ArrowUpRight aria-hidden="true" className="size-4" weight="bold" />
                    </a>
                  </div>

                  <div className="relative flex w-full items-end justify-between gap-4 text-left">
                    <span className="flex flex-wrap items-center gap-3 text-[0.68rem] font-semibold uppercase text-ink/45">
                      {repo.language && <span>{repo.language}</span>}
                      <span>{formatUpdatedAt(repo.updated_at)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-moss">
                      <Star aria-hidden="true" className="size-4" weight="bold" />
                      {repo.stargazers_count}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="thesis-scroll relative bg-ink px-5 py-24 text-porcelain sm:px-8 md:py-36 lg:px-12">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <div className="max-w-xl">
              <h2 className="chapter-title text-porcelain">Bachelor&apos;s Thesis</h2>
              {thesis?.title && (
                <p className="mt-7 text-2xl font-semibold leading-tight text-porcelain/90">
                  {thesis.title}
                </p>
              )}
              {thesis?.summary && (
                <p className="mt-7 text-base leading-7 text-porcelain/62">
                  {thesis.summary}
                </p>
              )}
              <Link className="button-cream mt-8 w-fit" to="/thesis">
                Read more
                <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
              </Link>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {images.map((asset, index) => (
              <figure
                key={asset}
                className={`gsap-image group overflow-hidden rounded-[1.1rem] border border-porcelain/14 bg-porcelain/6 p-3 ${index === 0 ? "md:col-span-2" : ""}`}
              >
                <img
                  alt=""
                  className="h-auto w-full rounded-[max(0px,calc(1.1rem-0.75rem))] object-contain transition duration-700 group-hover:scale-[1.025]"
                  src={resolveAsset(backend, asset)}
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <footer
        id="contact"
        className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-24 sm:px-8 md:grid-cols-[1fr_auto] md:py-32 lg:px-12"
      >
        <div className="gsap-reveal">
          <h2 className="chapter-title">Contact</h2>
        </div>
        {profile?.email && (
          <a className="button-dark self-end" href={`mailto:${profile.email}`}>
            {profile.email}
            <EnvelopeSimple aria-hidden="true" className="size-4" weight="bold" />
          </a>
        )}
      </footer>

      <ProjectDialog
        backend={backend}
        repo={activeRepo}
        onClose={() => setActiveRepo(null)}
      />
    </main>
  )
}
