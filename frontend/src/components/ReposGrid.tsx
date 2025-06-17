"use client";

import useSWR from "swr";
import RepoCard, { Repo } from "./RepoCard";
import dynamic from "next/dynamic";
import { useState } from "react";
import { getBackendUrl } from "@/lib/backend";

const backend = getBackendUrl();

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const RepoModal = dynamic(() => import("./RepoModal"), { ssr: false });

interface Props {
  initialRepos: Repo[];
}

export default function ReposGrid({ initialRepos }: Props) {
  const { data: repos } = useSWR<Repo[]>(`${backend}/api/repos`, fetcher, {
    fallbackData: initialRepos,
    refreshInterval: 1000 * 60 * 10, // 10 min background
  });

  const [activeRepo, setActiveRepo] = useState<Repo | null>(null);

  const openRepo = async (name: string) => {
    const detail = await fetch(`${backend}/api/repos/${name}`).then((r) => r.json());
    setActiveRepo(detail);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {repos?.map((repo: Repo) => (
          <RepoCard key={repo.name} repo={repo} onClick={() => openRepo(repo.name)} />
        ))}
      </div>
      <RepoModal repo={activeRepo} onClose={() => setActiveRepo(null)} />
    </>
  );
} 