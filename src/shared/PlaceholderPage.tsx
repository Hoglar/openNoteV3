import type { ReactNode } from 'react';

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
};

export function PlaceholderPage({ eyebrow, title, children }: PlaceholderPageProps) {
  return (
    <section className="content-page">
      <div className="page-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="content-card">{children}</div>
    </section>
  );
}
