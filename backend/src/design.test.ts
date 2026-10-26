import request from "supertest";
import { describe, it, expect } from "vitest";
import sharp from "sharp";
import jsQR from "jsqr";
import { app } from "./app.js";
import { qrPngDataUrl, qrSvg } from "./utils/qr.js";
import { store } from "./store.js";
const decode = jsQR as unknown as (
  data: Uint8ClampedArray,
  width: number,
  height: number,
) => { data: string } | null;
describe("card design and access", () => {
  it("exports square QR codes without an outer frame and keeps them scannable", async () => {
    const url = "https://qr.travel2globe.com/card/readable-card";
    expect(await qrSvg(url)).not.toContain('stroke-width="6"');
    const png = await qrPngDataUrl(url, {}, 640);
    const { data, info } = await sharp(Buffer.from(png.split(",")[1], "base64"))
      .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let x = 0; x < info.width; x++) {
      const offset = (12 * info.width + x) * 4;
      expect([...data.subarray(offset, offset + 4)]).toEqual([255, 255, 255, 255]);
    }
    expect(decode(new Uint8ClampedArray(data), info.width, info.height)?.data).toBe(url);
  });
  it("renames saved URLs, rejects duplicates and invalid slugs, and preserves ownership", async () => {
    const registered = await request(app).post("/api/auth/register").send({
      name: "URL Editor", email: "url-editor@example.test", password: "Password123!",
    });
    const auth = { Authorization: `Bearer ${registered.body.data.token}` };
    const created = await request(app).post("/api/cards").set(auth).send({ templateId: "signature-classic", fullName: "Asha Rao", slug: "url-original" });
    const c = created.body.data;
    await request(app).post(`/api/cards/${c.id}/publish`).set(auth);
    const updated = await request(app).put(`/api/cards/${c.id}`).set(auth).send({ slug: "url-renamed" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.userId).toBe(c.userId);
    expect((await request(app).get("/api/public/cards/url-original")).status).toBe(404);
    expect((await request(app).get("/api/public/cards/url-renamed")).body.data.id).toBe(c.id);
    const qr = await request(app).get(`/api/cards/${c.id}/qr.png`).set(auth);
    const { data, info } = await sharp(qr.body).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(decode(new Uint8ClampedArray(data), info.width, info.height)?.data).toContain("/card/url-renamed");
    const other = await request(app).post("/api/cards").set(auth).send({ templateId: "signature-classic", fullName: "Another Card", slug: "url-taken" });
    expect((await request(app).put(`/api/cards/${c.id}`).set(auth).send({ slug: "url-taken" })).status).toBe(409);
    expect((await request(app).post("/api/cards").set(auth).send({ templateId: "signature-classic", fullName: "Duplicate URL", slug: "url-taken" })).status).toBe(409);
    for (const slug of ["", "ab", "../bad", "Bad URL", "x".repeat(161)])
      expect((await request(app).put(`/api/cards/${c.id}`).set(auth).send({ slug })).status).toBe(422);
    expect((await request(app).get(`/api/cards/${c.id}`).set(auth)).body.data.slug).toBe("url-renamed");
    expect(other.status).toBe(201);
  });
  it("preserves manual font sizes when saving and publishing cards", async () => {
    const owner = await request(app).post("/api/auth/register").send({
      name: "Font Editor",
      email: "font-editor@example.test",
      password: "Password123!",
    });
    const auth = { Authorization: `Bearer ${owner.body.data.token}` };
    const created = await request(app).post("/api/cards").set(auth).send({
      templateId: "signature-classic",
      fullName: "Readable Card",
    });
    expect(created.status).toBe(201);
    const card = created.body.data;
    const theme = {
      nameFontSize: "32",
      profileFontSize: "17",
      headingFontSize: "23",
      bodyFontSize: "18",
    };
    const saved = await request(app)
      .put(`/api/cards/${card.id}`)
      .set(auth)
      .send({ theme });
    expect(saved.status).toBe(200);
    expect(saved.body.data.theme).toMatchObject(theme);
    expect(
      (await request(app).get(`/api/cards/${card.id}`).set(auth)).body.data
        .theme,
    ).toMatchObject(theme);
    await request(app).post(`/api/cards/${card.id}/publish`).set(auth);
    expect(
      (await request(app).get(`/api/public/cards/${card.slug}`)).body.data
        .theme,
    ).toMatchObject(theme);
  });
  it("enforces passcodes on content, contact downloads and leads and invalidates old access", async () => {
    const owner = await request(app).post("/api/auth/register").send({
      name: "Design Owner",
      email: "design-owner@example.test",
      password: "Password123!",
    });
    const auth = { Authorization: `Bearer ${owner.body.data.token}` };
    const created = await request(app)
      .post("/api/cards")
      .set(auth)
      .send({
        templateId: "signature-classic",
        fullName: "Private Name",
        theme: {
          passcodeEnabled: "true",
          passcode: "Secret123",
          passcodeMinutes: "1",
          passcodeHeading: "Members only",
        },
        content: [
          {
            id: "lead",
            type: "lead",
            enabled: true,
            background: true,
            values: {},
            items: [],
          },
        ],
        socialLinks: [],
      });
    expect(created.status).toBe(201);
    const c = created.body.data;
    expect(c.theme.passcode).toBeUndefined();
    expect(c.theme.passcodeHash).toBeUndefined();
    expect(c.theme.hasPasscode).toBe("true");
    expect(
      (await store.getCardForUser(owner.body.data.user.id, c.id))?.theme
        ?.passcodeHash,
    ).toMatch(/^\$2/);
    await request(app).post(`/api/cards/${c.id}/publish`).set(auth);
    const base = `/api/public/cards/${c.slug}`;
    const locked = await request(app).get(base);
    expect(locked.body.data).toMatchObject({
      locked: true,
      heading: "Members only",
    });
    expect(locked.text).not.toContain("Private Name");
    expect((await request(app).get(`${base}/vcard.vcf`)).status).toBe(403);
    expect(
      (
        await request(app)
          .post(`${base}/leads`)
          .send({ sectionId: "lead", answers: {} })
      ).status,
    ).toBe(403);
    expect(
      (await request(app).post(`${base}/unlock`).send({ passcode: "wrong" }))
        .status,
    ).toBe(403);
    const unlocked = await request(app)
      .post(`${base}/unlock`)
      .send({ passcode: "Secret123" });
    expect(unlocked.status).toBe(200);
    const cookie = unlocked.headers["set-cookie"];
    expect(String(cookie)).toContain("HttpOnly");
    expect(
      (await request(app).get(base).set("Cookie", cookie)).body.data.fullName,
    ).toBe("Private Name");
    expect(
      (await request(app).get(`${base}/vcard.vcf`).set("Cookie", cookie))
        .status,
    ).toBe(200);
    await request(app)
      .put(`/api/cards/${c.id}`)
      .set(auth)
      .send({ theme: { ...c.theme, passcode: "Replacement123" } });
    expect(
      (await request(app).get(base).set("Cookie", cookie)).body.data.locked,
    ).toBe(true);
    const invalid = await request(app)
      .put(`/api/cards/${c.id}`)
      .set(auth)
      .send({
        theme: {
          passcodeEnabled: "true",
          passcode: "123",
          passcodeHash: "forged",
        },
      });
    expect(invalid.status).toBe(422);
  });
  it("stores private presets, rejects anonymous edits and protects location consent", async () => {
    const a = await request(app).post("/api/auth/register").send({
      name: "Styles Owner",
      email: "styles-owner@example.test",
      password: "Password123!",
    });
    const auth = { Authorization: `Bearer ${a.body.data.token}` };
    expect(
      (await request(app).post("/api/design/presets").send({})).status,
    ).toBe(401);
    const saved = await request(app)
      .post("/api/design/presets")
      .set(auth)
      .send({
        name: "Test style",
        kind: "style",
        settings: {
          accent: "#123456",
          passcode: "never-copy",
          passcodeHash: "no",
        },
      });
    expect(saved.status).toBe(201);
    expect(saved.body.data.settings).toEqual({ accent: "#123456" });
    expect(
      (await request(app).get("/api/design/presets").set(auth)).body.data,
    ).toHaveLength(1);
    const card = await request(app)
      .post("/api/cards")
      .set(auth)
      .send({
        templateId: "signature-classic",
        fullName: "Location Test",
        theme: { preciseLocation: "true" },
        socialLinks: [],
      });
    const c = card.body.data;
    await request(app).post(`/api/cards/${c.id}/publish`).set(auth);
    const location = { latitude: 22.5, longitude: 88.3, accuracy: 50 };
    expect(
      (
        await request(app)
          .post(`/api/public/cards/${c.slug}/visits`)
          .send({ location })
      ).status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .post(`/api/public/cards/${c.slug}/visits`)
          .send({ location, consent: true })
      ).status,
    ).toBe(200);
    expect(
      (await request(app).get(`/api/cards/${c.id}/visits`).set(auth)).body.data,
    ).toHaveLength(1);
    expect((await request(app).get(`/api/cards/${c.id}/visits`)).status).toBe(
      401,
    );
  });
  it("decodes customized QR exports for every supported outer shape and module style", async () => {
    const url = "https://qr.travel2globe.com/card/test-business-card";
    for (const shape of [
      "square",
      "rounded",
      "circle",
      "heart",
      "hexagon",
      "diamond",
      "shield",
    ])
      for (const module of ["square", "rounded", "dots"]) {
        const encoded = await qrPngDataUrl(
          url,
          {
            qrShape: shape,
            qrModule: module,
            qrEyeShape: "rounded",
            qrForeground: "#123456",
            qrGradient: "true",
            qrGradientEnd: "#314060",
            qrSticker: "pill",
            qrCaption: "Scan me",
            qr3d: "true",
          },
          800,
        );
        const { data, info } = await sharp(
          Buffer.from(encoded.split(",")[1], "base64"),
        )
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        expect(
          decode(new Uint8ClampedArray(data), info.width, info.height)?.data,
          `${shape}/${module}`,
        ).toBe(url);
      }
  }, 30000);
});
