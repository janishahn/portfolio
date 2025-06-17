"use client";

import { Repo } from "./RepoCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import Link from "next/link";
import { ExternalLink, Info } from "lucide-react";
import { useEffect } from "react";

interface Props {
  repo: Repo | null;
  onClose: () => void;
}

// Simple markdown renderer for bullet points and basic formatting
function renderMarkdown(text: string): string {
  // Convert bullet points (- or *) to list items
  const withListItems = text.replace(/^\s*[\*-]\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap any consecutive <li> blocks into a single <ul>
  const withLists = withListItems.replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, '<ul>$1</ul>');
  
  return withLists
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Use negative lookahead to avoid treating list bullets (already removed) as italics
    .replace(/\*(?!\s)(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

export default function RepoModal({ repo, onClose }: Props) {
  useEffect(() => {
    if (repo) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [repo]);

  const summary = repo?.readme_summary ?? "";
  const modelName = process.env.NEXT_PUBLIC_SUMMARY_MODEL ?? "google/gemma-3-27b-it:free";

  return (
    <Dialog open={Boolean(repo)} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-auto sm:max-w-3xl">
        {repo && (
          <>
            <Link
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-12 top-4 text-muted-foreground hover:text-primary"
            >
              <ExternalLink size={18} />
            </Link>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold capitalize">
                {repo.name.replace(/[-_]/g, " ")}
              </DialogTitle>
            </DialogHeader>
            {summary ? (
              <>
                <article 
                  className="prose prose-sm max-w-none [&>ul]:list-disc [&>ul]:pl-6 [&>li]:mb-1"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
                />
                <div className="absolute bottom-4 right-4">
                  <Tooltip content={`Summary generated using ${modelName}`}> 
                    <Info size={16} className="text-muted-foreground hover:text-primary cursor-pointer" />
                  </Tooltip>
                </div>
              </>
            ) : (
              <p className="text-sm italic">No README available for this repository.</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 