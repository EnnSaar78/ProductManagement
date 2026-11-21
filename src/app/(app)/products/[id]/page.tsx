import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge, Card, Field, LinkButton, PageHeader, Score } from "@/components/ui";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CanvasGrid } from "@/components/CanvasGrid";
import { SourceForm } from "@/components/SourceForm";
import { SourceList } from "@/components/SourceList";
import { PlansTab } from "@/components/product/PlansTab";
import { PainGainTab } from "@/components/product/PainGainTab";
import { SwotTab } from "@/components/product/SwotTab";
import { MessagesTab } from "@/components/product/MessagesTab";
import { KpisTab } from "@/components/product/KpisTab";
import { deleteProduct, saveInsight } from "@/lib/actions/content";
import { getProductFull } from "@/lib/queries";
import { canEdit, requireUser } from "@/lib/auth";

const TABS = ["overview", "plans", "canvas", "paingain", "swot", "messages", "kpis", "insight", "sources"] as const;
type Tab = (typeof TABS)[number];

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const editable = canEdit(user);
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? "") ? (rawTab as Tab) : "overview";
  const full = (await getProductFull(id));
  if (!full) notFound();
  const { product, company, market, category, plans, addons, archetypes, canvas, painGain, swot, messages, kpis, insight, sources, srcMap } = full;
  const t = await getTranslations("products");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const path = `/products/${id}`;
  const headline = messages.find((m) => m.kind === "headline");
  const counts: Record<Tab, number | null> = {
    overview: null,
    plans: plans.length + addons.length,
    canvas: canvas.length,
    paingain: painGain.length,
    swot: swot.length,
    messages: messages.length,
    kpis: kpis.length,
    insight: insight ? 1 : 0,
    sources: sources.length,
  };

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={`${company.name} · ${market.name} · ${category.code} ${locale === "en" ? category.nameEn : category.nameEt} · ${t(`statuses.${product.status}`)}`}
        actions={
          editable ? (
            <>
              <LinkButton href={`${path}/edit`} secondary>{tc("edit")}</LinkButton>
              {user.role === "admin" && (
                <form action={deleteProduct.bind(null, id)}>
                  <ConfirmButton message={tc("confirmDelete")} className="btn-secondary text-red-700">{tc("delete")}</ConfirmButton>
                </form>
              )}
            </>
          ) : undefined
        }
      />
      {headline && <p className="mb-4 text-lg font-medium">„{headline.text}“</p>}
      <nav className="mb-4 flex flex-wrap gap-1 border-b border-[var(--border)]">
        {TABS.map((x) => (
          <Link key={x} href={`${path}?tab=${x}`} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === x ? "border-[var(--accent)] font-medium text-[var(--accent)]" : "border-transparent hover:border-[var(--border)]"}`}>
            {t(`tabs.${x}`)}
            {counts[x] !== null && <span className="muted ml-1 text-xs">{counts[x]}</span>}
          </Link>
        ))}
      </nav>
      {!editable && <p className="muted mb-3 text-xs">{tc("readOnly")}</p>}

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={t("summary")}>
            <p className="whitespace-pre-wrap text-sm">{product.summary ?? tc("none")}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><dt className="muted text-xs">{t("brand")}</dt><dd>{product.brand ?? tc("none")}</dd></div>
              <div><dt className="muted text-xs">{t("launchDate")}</dt><dd>{product.launchDate ?? tc("none")}</dd></div>
              <div><dt className="muted text-xs">{t("pricingModel")}</dt><dd>{t(`pricingModels.${product.pricingModel}`)}</dd></div>
              <div><dt className="muted text-xs">{t("url")}</dt><dd>{product.url ? <a className="text-[var(--accent)] underline break-all" href={product.url} target="_blank" rel="noreferrer">{product.url}</a> : tc("none")}</dd></div>
            </dl>
            <div className="mt-3">
              <div className="muted text-xs">{t("archetypes")}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {archetypes.length === 0 ? tc("none") : archetypes.map((a) => <Badge key={a.id}>{locale === "en" ? a.nameEn : a.nameEt}</Badge>)}
              </div>
            </div>
          </Card>
          <Card title={t("targetCustomer")}><p className="whitespace-pre-wrap text-sm">{product.targetCustomer ?? tc("none")}</p></Card>
          <Card title={t("components")}><p className="whitespace-pre-wrap text-sm">{product.components ?? tc("none")}</p></Card>
          <Card title={t("addonsSummary")}><p className="whitespace-pre-wrap text-sm">{product.addonsSummary ?? tc("none")}</p></Card>
          <Card title={t("priceNotes")}><p className="whitespace-pre-wrap text-sm">{product.priceNotes ?? tc("none")}</p></Card>
          <Card title={t("slaNotes")}><p className="whitespace-pre-wrap text-sm">{product.slaNotes ?? tc("none")}</p></Card>
          <Card title={t("channel")}><p className="whitespace-pre-wrap text-sm">{product.channel ?? tc("none")}</p></Card>
          <Card title={t("technology")}><p className="whitespace-pre-wrap text-sm">{product.technology ?? tc("none")}</p></Card>
          <Card title={t("partners")}><p className="whitespace-pre-wrap text-sm">{product.partners ?? tc("none")}</p></Card>
          <Card title={tc("notes")}><p className="whitespace-pre-wrap text-sm">{product.notes ?? tc("none")}</p></Card>
        </div>
      )}
      {tab === "plans" && <PlansTab productId={id} plans={plans} addons={addons} currency={market.currency} editable={editable} />}
      {tab === "canvas" && <CanvasGrid items={canvas} target={{ productId: id }} path={path} sources={sources} srcMap={srcMap} editable={editable} />}
      {tab === "paingain" && <PainGainTab productId={id} items={painGain} sources={sources} srcMap={srcMap} editable={editable} />}
      {tab === "swot" && <SwotTab productId={id} items={swot} sources={sources} srcMap={srcMap} editable={editable} />}
      {tab === "messages" && <MessagesTab productId={id} items={messages} sources={sources} srcMap={srcMap} editable={editable} />}
      {tab === "kpis" && <KpisTab productId={id} items={kpis} sources={sources} srcMap={srcMap} editable={editable} />}
      {tab === "insight" && (
        <Card>
          <p className="muted mb-3 text-xs">{t("insight.hint")}</p>
          {insight && (
            <div className="mb-4 rounded bg-[var(--bg)] p-3 text-sm">
              <div className="flex items-center gap-2"><span className="muted text-xs">{t("insight.relevance")}</span> <Score value={insight.relevance} /></div>
              {insight.hypothesis && <p className="mt-2"><span className="muted text-xs">{t("insight.hypothesis")}:</span> {insight.hypothesis}</p>}
              {insight.nextStep && <p className="mt-1"><span className="muted text-xs">{t("insight.nextStep")}:</span> {insight.nextStep}</p>}
              {insight.owner && <p className="mt-1"><span className="muted text-xs">{t("insight.owner")}:</span> {insight.owner}</p>}
              <p className="muted mt-2 text-xs">{insight.updatedAt.slice(0, 10)}</p>
            </div>
          )}
          {editable && (
            <form action={saveInsight.bind(null, id)} className="grid gap-2 md:grid-cols-2">
              <Field label={t("insight.relevance")}><input name="relevance" type="number" min={1} max={5} defaultValue={insight?.relevance ?? 3} /></Field>
              <Field label={t("insight.owner")}><input name="owner" defaultValue={insight?.owner ?? ""} /></Field>
              <Field label={t("insight.hypothesis")} className="md:col-span-2"><textarea name="hypothesis" rows={3} defaultValue={insight?.hypothesis ?? ""} /></Field>
              <Field label={t("insight.nextStep")} className="md:col-span-2"><textarea name="nextStep" rows={2} defaultValue={insight?.nextStep ?? ""} /></Field>
              <div><button className="btn">{tc("save")}</button></div>
            </form>
          )}
        </Card>
      )}
      {tab === "sources" && (
        <Card>
          <SourceList sources={sources} editable={editable} redirectTo={`${path}?tab=sources`} />
          {editable && (<div className="mt-3 border-t border-[var(--border)] pt-3"><SourceForm productId={id} redirectTo={`${path}?tab=sources`} /></div>)}
        </Card>
      )}
    </>
  );
}
