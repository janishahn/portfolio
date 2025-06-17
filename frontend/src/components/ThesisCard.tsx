import Link from "next/link";

interface Props {
  thesis: {
    title: string;
    summary?: string;
  };
}

export default function ThesisCard({ thesis }: Props) {
  return (
    <Link href="/thesis" className="block border rounded-lg p-6 hover:shadow transition backdrop-blur-md bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/15 dark:hover:bg-white/8">
      <h3 className="font-semibold text-xl mb-2">{thesis.title}</h3>
      {thesis.summary && (
        <p className="text-sm text-muted-foreground line-clamp-6">{thesis.summary}</p>
      )}
      <span className="mt-4 inline-block text-sm text-primary">Read more →</span>
    </Link>
  );
} 