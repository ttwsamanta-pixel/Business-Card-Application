"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Save,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { CardRenderer } from "@/components/CardRenderer";
import { ContentEditor } from "@/components/ContentEditor";
import { DesignEditor } from '@/components/DesignEditor';
import { QrEditor, QrPreview } from '@/components/QrEditor';
import { MasterProvider } from "@/lib/masters";
import { endpoints, publicCardUrl } from "@/lib/api";
import { initialContent } from "@/lib/card-content";
import { emptyCard, templates, type CardProfile } from "@/lib/templates";

export default function EditorPage() {
  return (
    <MasterProvider>
      <Editor />
    </MasterProvider>
  );
}
function Editor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<CardProfile>(emptyCard);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const loaded =
          params.id === "new"
            ? {
                ...emptyCard,
                templateId:
                  new URLSearchParams(location.search).get("template") ||
                  emptyCard.templateId,
              }
            : await endpoints.card(params.id);
        if (active)
          setCard({
            ...loaded,
            content: loaded.content || initialContent(loaded),
          });
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Unable to load card");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [params.id]);
  const change = (patch: Partial<CardProfile>) => {
    setCard((current) => ({ ...current, ...patch }));
    setMessage("");
  };
  const busy = (value: boolean) =>
    setUploads((count) => count + (value ? 1 : -1));
  const save = async (publish = false) => {
    if (saving || uploads) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = card.id
        ? await endpoints.updateCard(card.id, card)
        : await endpoints.createCard(card);
      setCard(saved);
      const result = publish ? await endpoints.publishCard(saved.id!) : saved;
      setCard(result);
      setMessage(publish ? "Card published." : "Draft saved.");
      if (params.id === "new") router.replace(`/editor/${saved.id}`);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };
  const url = card.slug ? publicCardUrl(card.slug) : "";
  return (
    <main className="dashboard-layout maker-dashboard">
      <AppNav />
      <section className="main maker-main">
        <div className="maker-hero">
          <h1>Digital Business Card</h1>
        </div>
        {error ? (
          <div role="alert" className="error">
            {error}
          </div>
        ) : null}
        {message ? (
          <div role="status" className="success">
            {message}
          </div>
        ) : null}
        {loading ? (
          <p>Loading card...</p>
        ) : (
          <div className="maker-shell">
            <div className="maker-center">
              <div className="maker-title-row">
                <h2>Digital Business Card Maker</h2>
              </div>
              <div className="maker-steps">
                {["Content", "Design / Settings", "QR Code"].map(
                  (label, index) => (
                    <button
                      key={label}
                      className={step === index + 1 ? "active" : ""}
                      onClick={() => setStep(index + 1)}
                      disabled={uploads > 0 || saving}
                    >
                      <span>{index + 1}</span>
                      {label}
                      <ChevronRight size={16} />
                    </button>
                  ),
                )}
              </div>
              <fieldset className="maker-form" disabled={uploads > 0 || saving}>
                {step === 1 ? (
                  <>
                    <div className="page-url-block">
                      <label>Your Page URL</label>
                      <div>
                        <span>{publicCardUrl("")}</span>
                        <input
                          className="input"
                          aria-label="Page URL"
                          value={card.slug || ""}
                          placeholder="Assigned when saved"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="template-block">
                      <h3>Page Template</h3>
                      <div className="template-carousel">
                        <button
                          className="template-nav"
                          aria-label="Previous templates"
                          onClick={() =>
                            scroller.current?.scrollBy({
                              left: -280,
                              behavior: "smooth",
                            })
                          }
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <div className="template-picker" ref={scroller}>
                          {templates.map((template) => (
                            <button
                              key={template.id}
                              className={
                                card.templateId === template.id ? "active" : ""
                              }
                              aria-pressed={card.templateId === template.id}
                              onClick={() =>
                                change({ templateId: template.id })
                              }
                            >
                              <CardRenderer
                                compact
                                card={{ ...card, templateId: template.id }}
                              />
                              <span>{template.name}</span>
                            </button>
                          ))}
                        </div>
                        <button
                          className="template-nav"
                          aria-label="Next templates"
                          onClick={() =>
                            scroller.current?.scrollBy({
                              left: 280,
                              behavior: "smooth",
                            })
                          }
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                    <ContentEditor card={card} change={change} onBusy={busy} />
                  </>
                ) : null}
                {step===2?<DesignEditor theme={card.theme||{}} change={patch=>change({theme:{...card.theme,...patch}})} onBusy={busy}/>:null}
                {step===3?<QrEditor card={card} change={patch=>change({theme:{...card.theme,...patch}})} onBusy={busy} onSave={()=>save()}/>:null}
              </fieldset>
              <div className="maker-footer">
                <button
                  className="btn secondary"
                  disabled={step === 1 || uploads > 0 || saving}
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
                {step < 3 ? (
                  <button
                    className="btn"
                    disabled={uploads > 0 || saving}
                    onClick={() => setStep(step + 1)}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="btn"
                    disabled={saving || uploads > 0}
                    onClick={() => save(true)}
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Publish"}
                  </button>
                )}
              </div>
            </div>
            <aside className="maker-preview">
              <div className="maker-url">
                <span>{url || "Unsaved card"}</span>
                <button
                  title="Copy card URL"
                  aria-label="Copy card URL"
                  disabled={!url}
                  onClick={() =>
                    navigator.clipboard
                      .writeText(url)
                      .then(() => setMessage("Link copied."))
                      .catch(() => setError("Unable to copy link."))
                  }
                >
                  <Copy size={15} />
                </button>
                {card.status === "published" ? (
                  <a
                    title="Open card"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={15} />
                  </a>
                ) : null}
              </div>
              <div className="maker-preview-actions">
                <button
                  className="btn"
                  disabled={saving || uploads > 0}
                  onClick={() => save()}
                >
                  {uploads ? "Uploading..." : saving ? "Saving..." : "Save"}
                </button>
              </div>
              {step===3?<QrPreview card={card}/>:<CardRenderer card={card} />}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
