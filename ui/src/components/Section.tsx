import { ReactNode } from "react";

interface Props {
  id: string;
  children: ReactNode;
}

export default function Section({ id, children }: Props) {
  return (
    <section id={id} className="scroll-mt-20 py-16 max-w-4xl mx-auto px-4">
      {children}
    </section>
  );
} 