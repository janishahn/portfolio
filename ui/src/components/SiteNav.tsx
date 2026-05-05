import { ArrowUpRight } from "@phosphor-icons/react"
import { Link } from "react-router-dom"

export default function SiteNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-ink/10 bg-porcelain/86 backdrop-blur-xl shadow-[0_1px_0_rgba(60,49,40,0.04)]">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link
          to="/"
          className="font-serif-display text-[0.78rem] font-semibold uppercase text-ink transition-opacity hover:opacity-65"
        >
          Janis Hahn
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          <a className="nav-link" href="/#about">
            About
          </a>
          <a className="nav-link" href="/#projects">
            Projects
          </a>
          <Link
            className="nav-link"
            to="/thesis"
            onClick={() => window.scrollTo({ left: 0, top: 0, behavior: "auto" })}
          >
            Thesis
          </Link>
          <a className="nav-link" href="/#contact">
            Contact
          </a>
        </div>
        <a
          className="group inline-flex h-9 items-center gap-2 rounded-full border border-ink/15 bg-porcelain/70 px-4 text-[0.68rem] font-semibold uppercase text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition duration-300 hover:-translate-y-px hover:border-ink/35 hover:bg-ink hover:text-porcelain active:translate-y-0"
          href="/#contact"
        >
          Contact
          <ArrowUpRight
            aria-hidden="true"
            className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            weight="bold"
          />
        </a>
      </div>
    </nav>
  )
}
