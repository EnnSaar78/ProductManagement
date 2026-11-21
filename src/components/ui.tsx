import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="muted mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {title && <h2 className="mb-3 text-sm font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="muted py-3 text-sm">{text}</p>;
}

export function OriginBadge({ origin, labels }: { origin: "source" | "manual"; labels: { source: string; manual: string } }) {
  return <span className={`badge ${origin === "source" ? "badge-source" : "badge-manual"}`}>{origin === "source" ? labels.source : labels.manual}</span>;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge badge-neutral">{children}</span>;
}

export function SourceLink({ source }: { source?: { id: string; title: string; url: string | null } | null }) {
  if (!source) return null;
  return source.url ? (
    <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] underline">
      {source.title}
    </a>
  ) : (
    <span className="text-xs">{source.title}</span>
  );
}

export function LinkButton({ href, children, secondary }: { href: string; children: ReactNode; secondary?: boolean }) {
  return (
    <Link href={href} className={secondary ? "btn-secondary" : "btn"}>
      {children}
    </Link>
  );
}

export function Score({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`inline-block h-2.5 w-2.5 rounded-sm ${i < value ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
      ))}
    </span>
  );
}

export function SourceSelect({ name, sources, noneLabel, label }: { name: string; sources: { id: string; title: string }[]; noneLabel: string; label: string }) {
  return (
    <Field label={label}>
      <select name={name} defaultValue="">
        <option value="">{noneLabel}</option>
        {sources.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>
    </Field>
  );
}
