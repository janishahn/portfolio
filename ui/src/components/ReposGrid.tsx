import useSWR from "swr"
import RepoCard from "./RepoCard"
import type { Repo } from "./RepoCard"
import RepoModal from "./RepoModal"
import { useState } from "react"
import { getBackendUrl } from "@/lib/backend"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ReposGrid() {
  const backend = getBackendUrl()
  const { data: repos } = useSWR<Repo[]>(`${backend}/api/repos`, fetcher, {
    refreshInterval: 1000 * 60 * 10,
  })

  const [activeRepo, setActiveRepo] = useState<Repo | null>(null)

  const openRepo = async (name: string) => {
    const detail = await fetch(`${backend}/api/repos/${name}`).then((r) => r.json())
    setActiveRepo(detail)
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {repos?.map((repo: Repo) => (
          <RepoCard key={repo.name} repo={repo} onClick={() => openRepo(repo.name)} />
        ))}
      </div>
      <RepoModal repo={activeRepo} onClose={() => setActiveRepo(null)} />
    </>
  )
}
