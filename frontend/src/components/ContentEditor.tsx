"use client";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Minus, Plus, Trash2, Upload } from "lucide-react";
import { api, uploadImage } from "@/lib/api";
import {
  item,
  makeSection,
  sectionNames,
  type ContentSection,
  type Values,
} from "@/lib/card-content";
import type { CardProfile } from "@/lib/templates";

export function Switch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="editor-switch">
      <input
        type="checkbox"
        role="switch"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`ref-toggle ${value ? "on" : ""}`}>
        <i />
      </span>
      {label}
    </label>
  );
}
export function PhotoUpload({
  label,
  value,
  onChange,
  onBusy,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const latest = useRef(onChange);
  latest.current = onChange;
  return (
    <div className="editor-upload">
      <span>{label}</span>
      <div className="upload-row">
        {value ? <img src={value} alt={label} /> : null}
        <button
          type="button"
          aria-label={`Upload ${label}`}
          title={`Upload ${label}`}
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <Upload size={18} />
        </button>
        {value ? (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            disabled={busy}
            onClick={() => onChange("")}
          >
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>
      <input
        ref={input}
        type="file"
        aria-label={`${label} file`}
        hidden
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setError("");
          setBusy(true);
          onBusy(true);
          try {
            const result = await uploadImage(file);
            latest.current(result.publicUrl);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
            onBusy(false);
          }
        }}
      />
      {busy ? <small role="status">Uploading...</small> : null}
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
function GalleryUpload({
  remaining,
  onAppend,
  onBusy,
}: {
  remaining: number;
  onAppend: (photos: ContentSection["items"]) => void;
  onBusy: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef(onAppend);
  latest.current = onAppend;
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  return (
    <div className="editor-gallery-upload">
      <button
        type="button"
        className="outline-action"
        disabled={uploading || remaining <= 0}
        onClick={() => input.current?.click()}
      >
        <Plus size={15} /> Add Photos
      </button>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        aria-label="Gallery photos"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = "";
          if (!files.length) return;
          setError("");
          if (files.length > remaining) {
            setError(`You can add ${remaining} more photos (100 per section).`);
            return;
          }
          setUploading(true);
          onBusy(true);
          const photos: ContentSection["items"] = [];
          const errors: string[] = [];
          try {
            for (let index = 0; index < files.length; index++) {
              const file = files[index];
              setProgress(`Uploading ${index + 1} of ${files.length}...`);
              try {
                if (
                  ![
                    "image/png",
                    "image/jpeg",
                    "image/webp",
                    "image/gif",
                  ].includes(file.type)
                )
                  throw new Error("Choose a PNG, JPEG, WebP or GIF image.");
                const uploaded = await uploadImage(file);
                photos.push(item({ url: uploaded.publicUrl, alt: "" }));
              } catch (err) {
                errors.push(
                  `${file.name}: ${err instanceof Error ? err.message : "Upload failed"}`,
                );
              }
            }
            if (photos.length) latest.current(photos);
            setProgress(`${photos.length} of ${files.length} photos added.`);
            setError(errors.join(" "));
          } finally {
            setUploading(false);
            onBusy(false);
          }
        }}
      />
      {progress ? <p role="status">{progress}</p> : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type Field = {
  key: string;
  label: string;
  kind?: "text" | "textarea" | "toggle" | "photo" | "select";
  options?: string[];
};
const f = (
  key: string,
  label: string,
  kind: Field["kind"] = "text",
  options?: string[],
): Field => ({ key, label, kind, options });
function Fields({
  fields,
  values,
  change,
  onBusy,
}: {
  fields: Field[];
  values: Values;
  change: (patch: Values) => void;
  onBusy: (busy: boolean) => void;
}) {
  return (
    <>
      {fields.map((field) =>
        field.kind === "toggle" ? (
          <Switch
            key={field.key}
            label={field.label}
            value={values[field.key] === true}
            onChange={(value) => change({ [field.key]: value })}
          />
        ) : field.kind === "photo" ? (
          <PhotoUpload
            key={field.key}
            label={field.label}
            value={String(values[field.key] || "")}
            onChange={(value) => change({ [field.key]: value })}
            onBusy={onBusy}
          />
        ) : (
          <label className="field" key={field.key}>
            {field.label}
            {field.kind === "select" ? (
              <select
                className="select"
                aria-label={field.label}
                value={String(values[field.key] || field.options?.[0] || "")}
                onChange={(e) => change({ [field.key]: e.target.value })}
              >
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : field.kind === "textarea" ? (
              <textarea
                className="textarea"
                aria-label={field.label}
                value={String(values[field.key] || "")}
                onChange={(e) => change({ [field.key]: e.target.value })}
              />
            ) : (
              <input
                className="input"
                aria-label={field.label}
                value={String(values[field.key] || "")}
                onChange={(e) => change({ [field.key]: e.target.value })}
              />
            )}
          </label>
        ),
      )}
    </>
  );
}
const heading = [
  f("showTitle", "Title, Description", "toggle"),
  f("title", "Title"),
  f("description", "Description", "textarea"),
];
const sectionFields: Record<string, Field[]> = {
  text: [f("title", "Title"), f("description", "Description", "textarea")],
  contact: [
    f("title", "Title"),
    f("icon", "Contact Icon", "toggle"),
    f("iconUrl", "Contact icon", "photo"),
    f("floating", "Floating button", "toggle"),
    f("button", "Button Text"),
    f("saveLink", "Save e-business card link into contacts", "toggle"),
  ],
  images: [
    ...heading,
    f("layout", "View Type", "select", ["List", "Grid 1", "Grid 2"]),
  ],
  social: heading,
  links: heading,
  appointment: heading,
  lead: [
    f("name", "Form Name"),
    f("mode", "Type", "select", ["Inline", "Overlay"]),
    f("dismiss", "Allow to dismiss form", "toggle"),
    f("size", "Size", "select", ["Popup", "Full Screen"]),
    f("trigger", "Show Form", "select", [
      "On Click",
      "After Delay",
      "On Scroll",
    ]),
    f("delay", "Delay Time (seconds)"),
    f(
      "once",
      "Don't show this form multiple times to the same visitor",
      "toggle",
    ),
    f("header", "Header Image", "toggle"),
    f("headerUrl", "Header image", "photo"),
    ...heading,
    f("footer", "Footer description", "textarea"),
    f("consent", "Consent label"),
    f("termsUrl", "Terms and Conditions URL"),
    f("privacyUrl", "Privacy Policy URL"),
    f("supportEmail", "Support Email"),
    f("button", "Button Label"),
    f("completion", "Completion Message", "select", ["Toast", "Popup"]),
    f("message", "Completion description", "textarea"),
  ],
};
const linkFields = [
  f("url", "URL"),
  f("icon", "Icon", "photo"),
  f("title", "Title"),
  f("showSubtitle", "Subtitle", "toggle"),
  f("subtitle", "Subtitle text"),
];
function rowFields(type: string, values: Values): Field[] {
  if (type === "profile")
    return [
      f("type", "Type", "select", ["Mobile", "Email", "WhatsApp", "Website"]),
      f("value", "Value"),
    ];
  if (type === "social")
    return [
      f("platform", "Platform", "select", [
        "Facebook",
        "Instagram",
        "LinkedIn",
        "Twitter",
        "YouTube",
        "TikTok",
        "Skype",
        "Behance",
        "Snapchat",
      ]),
      ...linkFields,
    ];
  if (type === "links") return linkFields;
  if (type === "appointment")
    return [f("url", "URL"), f("title", "Button Label")];
  if (type === "images")
    return [f("url", "Photo", "photo"), f("alt", "Image description")];
  if (type === "lead")
    return [
      f("label", "Label/Question"),
      f("type", "Type", "select", ["One-Line", "Multi-Line", "Email", "Phone"]),
      f("required", "Required", "toggle"),
      f("error", "Error Message"),
    ];
  if (type === "contact")
    return [
      f("type", "Contact Type", "select", ["Phone", "Email", "Address"]),
      f("label", "Label"),
      ...(values.type === "Address"
        ? [
            f("line1", "Address Line 1"),
            f("line2", "Address Line 2"),
            f("city", "City"),
            f("state", "State"),
            f("country", "Country"),
            f("zip", "Zipcode"),
            f("direction", "Action Button", "toggle"),
            f("button", "Action Button Text"),
            f("url", "Google Map URL"),
          ]
        : [f("value", values.type === "Email" ? "Email" : "Number")]),
    ];
  return [];
}
function newValues(type: string): Values {
  return type === "profile"
    ? { type: "Mobile", value: "" }
    : type === "contact"
      ? { type: "Phone", label: "Call Us", value: "" }
      : type === "lead"
        ? {
            label: "Your Name",
            type: "One-Line",
            required: false,
            error: "This field is required",
          }
        : type === "social"
          ? {
              platform: "Facebook",
              url: "",
              title: "Facebook",
              showSubtitle: false,
            }
          : { url: "", title: "", showSubtitle: false };
}
function move<T>(items: T[], index: number, delta: number) {
  const copy = [...items];
  const target = index + delta;
  if (target < 0 || target >= copy.length) return items;
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

export function ContentEditor({
  card,
  change,
  onBusy,
}: {
  card: CardProfile;
  change: (patch: Partial<CardProfile>) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState("text");
  const [notice, setNotice] = useState("");
  const sections = card.content || [];
  const update = (id: string, patch: Partial<ContentSection>) =>
    change({
      content: sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  return (
    <>
      {sections.map((section, index) => {
        const updateValues = (patch: Values) =>
          update(section.id, { values: { ...section.values, ...patch } });
        return (
          <section
            className="ref-component"
            key={section.id}
            data-section={section.type}
          >
            <div className="ref-component-head">
              <strong>{sectionNames[section.type]}</strong>
              <div className="editor-section-actions">
                <button
                  title="Move section up"
                  aria-label={`Move ${sectionNames[section.type]} up`}
                  disabled={index === 0}
                  onClick={() => change({ content: move(sections, index, -1) })}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  title="Move section down"
                  aria-label={`Move ${sectionNames[section.type]} down`}
                  disabled={index === sections.length - 1}
                  onClick={() => change({ content: move(sections, index, 1) })}
                >
                  <ArrowDown size={15} />
                </button>
                <Switch
                  label={`Enable ${sectionNames[section.type]}`}
                  value={section.enabled}
                  onChange={(enabled) => update(section.id, { enabled })}
                />
                <button
                  aria-label={`${closed[section.id] ? "Expand" : "Collapse"} ${sectionNames[section.type]}`}
                  aria-expanded={!closed[section.id]}
                  onClick={() =>
                    setClosed({ ...closed, [section.id]: !closed[section.id] })
                  }
                >
                  {closed[section.id] ? (
                    <Plus size={18} />
                  ) : (
                    <Minus size={18} />
                  )}
                </button>
              </div>
            </div>
            {!closed[section.id] ? (
              <div className="ref-body">
                {section.type === "profile" ? (
                  <>
                    <div className="media-grid">
                      <div>
                        <Switch
                          label="Profile Photo"
                          value={section.values.photo === true}
                          onChange={(photo) => updateValues({ photo })}
                        />
                        <PhotoUpload
                          label="Profile photo"
                          value={card.profileImageUrl || ""}
                          onChange={(profileImageUrl) =>
                            change({ profileImageUrl })
                          }
                          onBusy={onBusy}
                        />
                      </div>
                      <div>
                        <Switch
                          label="Brand Logo"
                          value={section.values.logo === true}
                          onChange={(logo) => updateValues({ logo })}
                        />
                        <PhotoUpload
                          label="Brand logo"
                          value={card.logoUrl || ""}
                          onChange={(logoUrl) => change({ logoUrl })}
                          onBusy={onBusy}
                        />
                      </div>
                    </div>
                    <Fields
                      fields={[
                        f("fullName", "Name"),
                        f("designation", "Heading"),
                        f("company", "Sub Heading"),
                      ]}
                      values={{
                        fullName: card.fullName,
                        designation: card.designation || "",
                        company: card.company || "",
                      }}
                      change={(patch) => change(patch as Partial<CardProfile>)}
                      onBusy={onBusy}
                    />
                    <Switch
                      label="Profile Connect Icons"
                      value={section.values.connect === true}
                      onChange={(connect) => updateValues({ connect })}
                    />
                  </>
                ) : (
                  <Fields
                    fields={sectionFields[section.type] || []}
                    values={section.values}
                    change={updateValues}
                    onBusy={onBusy}
                  />
                )}
                {section.items.map((row, rowIndex) => (
                  <div className="ref-panel editor-item" key={row.id}>
                    <div className="editor-item-actions">
                      <button
                        title="Move item up"
                        aria-label="Move item up"
                        disabled={!rowIndex}
                        onClick={() =>
                          update(section.id, {
                            items: move(section.items, rowIndex, -1),
                          })
                        }
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        title="Move item down"
                        aria-label="Move item down"
                        disabled={rowIndex === section.items.length - 1}
                        onClick={() =>
                          update(section.id, {
                            items: move(section.items, rowIndex, 1),
                          })
                        }
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        title="Delete item"
                        aria-label="Delete item"
                        onClick={() =>
                          update(section.id, {
                            items: section.items.filter((i) => i.id !== row.id),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <Fields
                      fields={rowFields(section.type, row.values)}
                      values={row.values}
                      change={(patch) =>
                        update(section.id, {
                          items: section.items.map((i) =>
                            i.id === row.id
                              ? { ...i, values: { ...i.values, ...patch } }
                              : i,
                          ),
                        })
                      }
                      onBusy={onBusy}
                    />
                  </div>
                ))}
                {section.type === "images" ? (
                  <GalleryUpload
                    remaining={100 - section.items.length}
                    onBusy={onBusy}
                    onAppend={(photos) =>
                      update(section.id, {
                        enabled: true,
                        items: [...section.items, ...photos],
                      })
                    }
                  />
                ) : section.type !== "text" ? (
                  <button
                    className="outline-action"
                    onClick={() =>
                      update(section.id, {
                        items: [
                          ...section.items,
                          item(newValues(section.type)),
                        ],
                      })
                    }
                  >
                    <Plus size={15} />
                    {section.type === "lead" ? "Add Field" : "Add More"}
                  </button>
                ) : null}
                {section.type === "lead" ? (
                  <>
                    <div className="editor-template-actions">
                      {card.id ? (
                        <button
                          className="outline-action"
                          onClick={async () => {
                            try {
                              const rows = await api<unknown[]>(
                                `/cards/${card.id}/leads`,
                              );
                              const url = URL.createObjectURL(
                                new Blob([JSON.stringify(rows, null, 2)], {
                                  type: "application/json",
                                }),
                              );
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = "collected-contacts.json";
                              a.click();
                              setTimeout(() => URL.revokeObjectURL(url), 1000);
                              setNotice(
                                `${rows.length} collected contacts exported.`,
                              );
                            } catch (e) {
                              setNotice(
                                e instanceof Error
                                  ? e.message
                                  : "Export failed",
                              );
                            }
                          }}
                        >
                          Export collected contacts
                        </button>
                      ) : null}
                      <button
                        className="outline-action"
                        onClick={() => {
                          try {
                            localStorage.setItem(
                              "ttw-lead-template",
                              JSON.stringify(section),
                            );
                            setNotice("Form template saved in this browser.");
                          } catch {
                            setNotice("Unable to save the form template.");
                          }
                        }}
                      >
                        Save As Template
                      </button>
                      <button
                        className="outline-action"
                        onClick={() => {
                          try {
                            const template = JSON.parse(
                              localStorage.getItem("ttw-lead-template") ||
                                "null",
                            );
                            if (
                              !template?.values ||
                              !Array.isArray(template.items)
                            )
                              throw Error();
                            update(section.id, {
                              values: template.values,
                              items: template.items.map(
                                (i: { values: Values }) => item(i.values),
                              ),
                            });
                            setNotice("Form template loaded.");
                          } catch {
                            setNotice(
                              "No saved form template is available in this browser.",
                            );
                          }
                        }}
                      >
                        Use Form Template
                      </button>
                    </div>
                    <p className="muted">
                      API, SMS, email notifications and CRM integrations are not
                      connected.
                    </p>
                    {notice ? <p role="status">{notice}</p> : null}
                  </>
                ) : null}
                {section.type !== "profile" ? (
                  <div className="component-foot">
                    <Switch
                      label="Card Background"
                      value={section.background}
                      onChange={(background) =>
                        update(section.id, { background })
                      }
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        );
      })}
      <div className="add-component-row">
        {adding ? (
          <>
            <select
              aria-label="Component type"
              className="select"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
            >
              {Object.entries(sectionNames)
                .filter(([key]) => key !== "profile")
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </select>
            <button
              className="btn"
              onClick={() => {
                change({ content: [...sections, makeSection(newType, card)] });
                setAdding(false);
              }}
            >
              Add
            </button>
          </>
        ) : (
          <button className="btn" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add Component
          </button>
        )}
      </div>
    </>
  );
}
