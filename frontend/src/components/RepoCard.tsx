import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export interface Repo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  cover_url?: string; // optional from backend media
  readme_summary?: string; // optional summary from backend
}

interface Props {
  repo: Repo;
  onClick?: () => void;
}

export default function RepoCard({ repo, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col backdrop-blur-md bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/15 dark:hover:bg-white/8"
    >
      <CardHeader className="pb-2 flex-row items-start gap-2">
        <CardTitle className="text-lg flex-1">{repo.name}</CardTitle>
        <Link
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-primary"
        >
          <ExternalLink size={16} />
        </Link>
        <span className="text-xs text-muted-foreground">
          {new Date(repo.updated_at).toLocaleDateString()}
        </span>
      </CardHeader>
      {repo.cover_url && (
        <Image
          src={repo.cover_url}
          alt={repo.name}
          width={640}
          height={360}
          sizes="(max-width: 640px) 100vw, 50vw"
          className="w-full h-40 object-cover"
        />
      )}
      <CardContent className="pt-2 flex-1">
        <CardDescription className="line-clamp-3">
          {repo.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="gap-4 text-xs">
        {repo.language && (
          <span className="px-2 py-0.5 bg-white/20 dark:bg-white/10 rounded backdrop-blur-sm">
            {repo.language}
          </span>
        )}
        <span className="px-2 py-0.5 bg-white/20 dark:bg-white/10 rounded backdrop-blur-sm">
          ⭐ {repo.stargazers_count}
        </span>
      </CardFooter>
    </Card>
  );
} 