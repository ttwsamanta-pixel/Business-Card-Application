"use client";
import { useEffect, useState } from "react";
import { Download, Globe, Mail, Phone } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { MasterIcon } from "./MasterIcon";
import { api, publicApiAsset } from "@/lib/api";
import { safeLink, type ContentSection } from "@/lib/card-content";
import { templateFor, type CardProfile } from "@/lib/templates";

function LeadForm({
  section,
  card,
  publicMode,
}: {
  section: ContentSection;
  card: CardProfile;
  publicMode: boolean;
}) {
  const v = section.values;
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const storageKey = `ttw-form-${card.id}-${section.id}`;
  useEffect(() => {
    if (!publicMode || v.mode !== "Overlay") return;
    try {
      if (v.once && localStorage.getItem(storageKey)) return;
    } catch {}
    const show = () => setOpen(true);
    if (v.trigger === "After Delay") {
      const timer = setTimeout(
        show,
        Math.max(1, Math.min(600, Number(v.delay) || 1)) * 1000,
      );
      return () => clearTimeout(timer);
    }
    if (v.trigger === "On Scroll") {
      window.addEventListener("scroll", show, { once: true });
      return () => window.removeEventListener("scroll", show);
    }
  }, [publicMode, v.mode, v.once, v.trigger, v.delay, storageKey]);
  const content = (
    <form
      className="lead-public-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!publicMode) {
          setError("Publish and open the card to submit this form.");
          return;
        }
        setBusy(true);
        setError("");
        const data = new FormData(e.currentTarget);
        try {
          await api(`/public/cards/${card.slug}/leads`, {
            method: "POST",
            body: JSON.stringify({
              sectionId: section.id,
              consent: data.get("consent") === "on",
              answers: Object.fromEntries(
                section.items.map((i) => [i.id, String(data.get(i.id) || "")]),
              ),
            }),
          });
          setDone(true);
          try {
            localStorage.setItem(storageKey, "submitted");
          } catch {}
        } catch (err) {
          setError(err instanceof Error ? err.message : "Submission failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      {v.header && v.headerUrl ? (
        <img className="lead-header-image" src={String(v.headerUrl)} alt="" />
      ) : null}
      {v.showTitle ? (
        <>
          <h4>{String(v.title || "")}</h4>
          <p>{String(v.description || "")}</p>
        </>
      ) : null}
      {section.items.map((field) => (
        <label className="field" key={field.id}>
          {String(field.values.label || "")}
          {field.values.type === "Multi-Line" ? (
            <textarea
              className="textarea"
              name={field.id}
              required={field.values.required === true}
            />
          ) : (
            <input
              className="input"
              name={field.id}
              type={
                field.values.type === "Email"
                  ? "email"
                  : field.values.type === "Phone"
                    ? "tel"
                    : "text"
              }
              required={field.values.required === true}
            />
          )}
        </label>
      ))}
      {v.footer ? <p>{String(v.footer)}</p> : null}
      {v.consent ? (
        <label>
          <input type="checkbox" name="consent" required />
          {String(v.consent)}
        </label>
      ) : null}
      <div>
        {safeLink(String(v.termsUrl || "")) ? (
          <a
            href={safeLink(String(v.termsUrl))}
            target="_blank"
            rel="noreferrer"
          >
            Terms
          </a>
        ) : null}{" "}
        {safeLink(String(v.privacyUrl || "")) ? (
          <a
            href={safeLink(String(v.privacyUrl))}
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>
        ) : null}
      </div>
      {v.supportEmail ? (
        <a href={`mailto:${String(v.supportEmail)}`}>
          {String(v.supportEmail)}
        </a>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
      <button className="btn" disabled={busy}>
        {busy ? "Submitting..." : String(v.button || "Submit")}
      </button>
    </form>
  );
  const completion = (
    <div role="status">
      <p>{String(v.message || "Thank you for your response.")}</p>
    </div>
  );
  if (done)
    return v.completion === "Popup" && publicMode ? (
      <div className="lead-overlay">
        <div
          className="lead-popup"
          role="dialog"
          aria-modal="true"
          aria-label="Response submitted"
        >
          {completion}
          <button
            className="btn"
            onClick={() => {
              setOpen(false);
              setDone(false);
            }}
          >
            Close
          </button>
        </div>
      </div>
    ) : (
      completion
    );
  if (v.mode === "Overlay")
    return (
      <>
        <button className="btn" onClick={() => setOpen(true)}>
          {String(v.name || "Contact us")}
        </button>
        {open ? (
          <div className={publicMode ? "lead-overlay" : "lead-preview-overlay"}>
            <div
              className={`lead-popup ${v.size === "Full Screen" ? "full-screen" : ""}`}
              role="dialog"
              aria-modal={publicMode}
              aria-label={String(v.name || "Contact form")}
            >
              {v.dismiss ? (
                <button
                  className="btn secondary"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              ) : null}
              {content}
            </div>
          </div>
        ) : null}
      </>
    );
  return content;
}

export function ContentSections({
  card,
  compact,
  publicMode,
}: {
  card: CardProfile;
  compact: boolean;
  publicMode: boolean;
}) {
  const template = templateFor(card.templateId);
  return (
    <>
      {card.content
        ?.filter((s) => s.enabled)
        .map((section) => {
          const v = section.values;
          const heading =
            v.showTitle !== false ? (
              <>
                <h4>{String(v.title || "")}</h4>
                {v.description ? <p>{String(v.description)}</p> : null}
              </>
            ) : null;
          if (section.type === "profile") {
            const cover = ["cover", "wave"].includes(template.layout);
            return (
              <div key={section.id}>
                <div
                  className={
                    cover
                      ? "cover-hero"
                      : template.layout === "split"
                        ? "split-hero"
                        : "profile-hero"
                  }
                >
                  {v.photo && card.profileImageUrl ? (
                    <img
                      src={card.profileImageUrl}
                      alt={card.fullName}
                      className={
                        cover
                          ? "cover-image"
                          : template.layout === "split"
                            ? "split-avatar"
                            : "avatar"
                      }
                    />
                  ) : null}
                  <div
                    className={
                      cover
                        ? "cover-copy"
                        : template.layout === "split"
                          ? "split-copy"
                          : ""
                    }
                  >
                    {v.logo && card.logoUrl ? (
                      <img
                        className="card-brand-logo"
                        src={card.logoUrl}
                        alt={card.company || "Brand logo"}
                      />
                    ) : null}
                    <h3>{card.fullName}</h3>
                    <p>{card.designation}</p>
                    <strong>{card.company}</strong>
                  </div>
                </div>
                {v.connect ? (
                  <div className="quick-actions">
                    {section.items
                      .filter((i) => i.values.value)
                      .map((i) => {
                        const value = String(i.values.value);
                        const type = i.values.type;
                        const href =
                          type === "Mobile"
                            ? `tel:${value}`
                            : type === "Email"
                              ? `mailto:${value}`
                              : type === "WhatsApp"
                                ? `https://wa.me/${value.replace(/\D/g, "")}`
                                : safeLink(value);
                        return href ? (
                          <a key={i.id} href={href} aria-label={String(type)}>
                            <MasterIcon
                              small
                              name={String(
                                i.values.iconKey ||
                                  (
                                    {
                                      Mobile: "phone",
                                      Email: "mail",
                                      WhatsApp: "whatsapp",
                                    } as Record<string, string>
                                  )[String(type)] ||
                                  "globe",
                              )}
                              url={String(i.values.icon || "")}
                            />
                          </a>
                        ) : null;
                      })}
                  </div>
                ) : null}
              </div>
            );
          }
          return (
            <section
              key={section.id}
              data-content-type={section.type}
              className={`info-card ${section.type === "social" ? "social-section" : ""} ${section.background ? "" : "transparent-section"}`}
            >
              {section.type === "lead" ? (
                !compact ? (
                  <LeadForm
                    section={section}
                    card={card}
                    publicMode={publicMode}
                  />
                ) : (
                  <h4>{String(v.name || "Contact form")}</h4>
                )
              ) : null}
              {section.type === "text" ? (
                <>
                  <h4>{String(v.title || "")}</h4>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {String(v.description || "")}
                  </p>
                </>
              ) : null}
              {section.type === "contact" ? (
                <>
                  {v.icon && v.iconUrl ? (
                    <img
                      className="card-brand-logo"
                      src={String(v.iconUrl)}
                      alt="Contact"
                    />
                  ) : null}
                  <h4>{String(v.title || "Contact Us")}</h4>
                  {section.items.map((i) => {
                    const x = i.values;
                    return (
                      <div key={i.id}>
                        <div className="contact-master-label">
                          <MasterIcon
                            small
                            name={String(
                              x.iconKey ||
                                (
                                  {
                                    Phone: "phone",
                                    Email: "mail",
                                    Address: "map",
                                  } as Record<string, string>
                                )[String(x.type)] ||
                                "globe",
                            )}
                            url={String(x.icon || "")}
                          />
                          <strong>{String(x.label || "")}</strong>
                        </div>
                        {x.type === "Address" ? (
                          <>
                            <p>
                              {String(
                                  x.value ??
                                  [
                                    "line1",
                                    "line2",
                                    "city",
                                    "state",
                                    "country",
                                    "zip",
                                  ]
                                    .map((key) => x[key])
                                    .filter(Boolean)
                                    .join(", "),
                              )}
                            </p>
                            {x.direction && safeLink(String(x.url || "")) ? (
                              <a href={safeLink(String(x.url))}>
                                {String(x.button || "Direction")}
                              </a>
                            ) : null}
                          </>
                        ) : (
                          <p>
                            <a
                              href={
                                x.type === "Website"
                                  ? safeLink(String(x.value || ""))
                                  : x.type === "WhatsApp"
                                    ? `https://wa.me/${String(x.value || "").replace(/\D/g, "")}`
                                    : `${x.type === "Email" ? "mailto" : "tel"}:${String(x.value || "")}`
                              }
                            >
                              {String(x.value || "")}
                            </a>
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {v.floating && card.slug && publicMode ? (
                    <a
                      className="btn card-contact-button"
                      href={publicApiAsset(
                        `/api/public/cards/${card.slug}/vcard.vcf`,
                      )}
                    >
                      <Download size={15} />
                      {String(v.button || "Add to Contact")}
                    </a>
                  ) : v.floating && !compact ? (
                    <span className="btn">
                      {String(v.button || "Add to Contact")}
                    </span>
                  ) : null}
                </>
              ) : null}
              {section.type === "images" ? (
                <>
                  {heading}
                  <div
                    className={`content-gallery gallery-${v.layout === "Grid 1" ? "two" : v.layout === "Grid 2" ? "three" : "list"}`}
                  >
                    {section.items
                      .filter((i) => i.values.url)
                      .map((i) => (
                        <img
                          key={i.id}
                          src={String(i.values.url)}
                          alt={String(i.values.alt || "")}
                        />
                      ))}
                  </div>
                </>
              ) : null}
              {["social", "links", "appointment"].includes(section.type) ? (
                <>
                  {heading}
                  {section.items.map((i) => {
                    const x = i.values;
                    const href = safeLink(String(x.url || ""));
                    return href ? (
                      <a
                        key={i.id}
                        className={
                          section.type === "social"
                            ? "social-link-row"
                            : "link-row"
                        }
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {section.type === "social" ? (
                          <MasterIcon
                            name={String(x.iconKey || x.platform || "globe")}
                            url={String(x.icon || "")}
                          />
                        ) : x.icon ? (
                          <img
                            className="link-icon"
                            src={String(x.icon)}
                            alt=""
                          />
                        ) : null}
                        <span>
                          {String(x.title || x.platform || x.url)}
                          {x.showSubtitle !== false ? (
                            <small>
                              {String(
                                x.subtitle ||
                                  (section.type === "social"
                                    ? `Follow us on ${x.platform || x.title}`
                                    : ""),
                              )}
                            </small>
                          ) : null}
                        </span>
                        {section.type === "social" ? (
                          <ChevronRight size={20} />
                        ) : null}
                      </a>
                    ) : null;
                  })}
                </>
              ) : null}
            </section>
          );
        })}
    </>
  );
}
