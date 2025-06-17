import Section from "@/components/Section";
import type { Repo } from "@/components/RepoCard";
import ThesisCard from "@/components/ThesisCard";
import ReposGrid from "@/components/ReposGrid";
import ReactMarkdown from "react-markdown";

const backend = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

type Profile = {
  about: string;
  email: string;
};

type Thesis = {
  title: string;
  summary?: string;
  abstract?: string;
  assets?: string[];
};

async function fetchRepos(): Promise<Repo[]> {
  const res = await fetch(`${backend}/api/repos`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to fetch repos");
  return res.json();
}

async function fetchThesis(): Promise<Thesis | null> {
  const res = await fetch(`${backend}/api/thesis`, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  return res.json();
}

async function fetchProfile(): Promise<Profile | null> {
  const res = await fetch(`${backend}/api/profile`, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  return res.json();
}

export default async function Home() {
  const [repos, thesis, profile] = await Promise.all([
    fetchRepos(),
    fetchThesis(),
    fetchProfile(),
  ]);

  return (
    <>
      <main className="pt-20">
        <Section id="about">
          <h2 className="font-bold text-2xl mb-4">About Me</h2>
          {profile?.about && (
            <ReactMarkdown className="prose dark:prose-invert max-w-none text-muted-foreground">
              {profile.about}
            </ReactMarkdown>
          )}
        </Section>

        <Section id="projects">
          <h2 className="font-bold text-2xl mb-4">Projects</h2>
          <ReposGrid initialRepos={repos} />
        </Section>

        {thesis && (
          <Section id="thesis">
            <h2 className="font-bold text-2xl mb-4">Bachelor&apos;s Thesis</h2>
            <ThesisCard thesis={thesis} />
          </Section>
        )}

        <Section id="contact">
          <h2 className="font-bold text-2xl mb-4">Contact</h2>
          {profile?.email && <p>Email: <a href={`mailto:${profile.email}`}>{profile.email}</a></p>}
        </Section>
      </main>
    </>
  );
}
