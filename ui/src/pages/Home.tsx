import ReactMarkdown from "react-markdown"
import Section from "@/components/Section"
import ThesisCard from "@/components/ThesisCard"
import ReposGrid from "@/components/ReposGrid"
import { getBackendUrl } from "@/lib/backend"
import useSWR from "swr"

type Profile = {
  about: string
  email: string
}

type Thesis = {
  title: string
  summary?: string
  abstract?: string
  assets?: string[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HomePage() {
  const backend = getBackendUrl()
  const { data: profile } = useSWR<Profile>(`${backend}/api/profile`, fetcher)
  const { data: thesis } = useSWR<Thesis>(`${backend}/api/thesis`, fetcher)

  return (
    <main className="pt-20">
      <Section id="about">
        <h2 className="font-bold text-2xl mb-4">About Me</h2>
        {profile?.about && (
          <div className="prose dark:prose-invert max-w-none text-muted-foreground">
            <ReactMarkdown>{profile.about}</ReactMarkdown>
          </div>
        )}
      </Section>

      <Section id="projects">
        <h2 className="font-bold text-2xl mb-4">Projects</h2>
        <ReposGrid />
      </Section>

      {thesis && (
        <Section id="thesis">
          <h2 className="font-bold text-2xl mb-4">Bachelor&apos;s Thesis</h2>
          <ThesisCard thesis={thesis} />
        </Section>
      )}

      <Section id="contact">
        <h2 className="font-bold text-2xl mb-4">Contact</h2>
        {profile?.email && (
          <p>
            Email: <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
        )}
      </Section>
    </main>
  )
}
