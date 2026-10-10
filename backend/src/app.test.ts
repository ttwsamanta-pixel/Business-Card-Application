import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

async function register(email = "owner@example.com") {
  const res = await request(app).post("/api/auth/register").send({ name: "Owner User", email, password: "Password123!" });
  return { token: res.body.data.token, user: res.body.data.user };
}

describe("digital business card API", () => {
  it("registers, authenticates, and returns current user", async () => {
    const { token } = await register("auth@example.com");
    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe("auth@example.com");
  });

  it("lists all 25 templates", async () => {
    const res = await request(app).get("/api/templates");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(25);
  });

  it("creates cards, protects ownership, and only exposes published cards", async () => {
    const owner = await register("cards-owner@example.com");
    const stranger = await register("cards-stranger@example.com");
    const created = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ templateId: "signature-classic", fullName: "Asha Rao", email: "asha@example.com", socialLinks: [] });
    expect(created.status).toBe(201);

    const forbidden = await request(app).get(`/api/cards/${created.body.data.id}`).set("Authorization", `Bearer ${stranger.token}`);
    expect(forbidden.status).toBe(404);

    const hidden = await request(app).get(`/api/public/cards/${created.body.data.slug}`);
    expect(hidden.status).toBe(404);

    const published = await request(app).post(`/api/cards/${created.body.data.id}/publish`).set("Authorization", `Bearer ${owner.token}`);
    expect(published.status).toBe(200);

    const publicCard = await request(app).get(`/api/public/cards/${created.body.data.slug}`);
    expect(publicCard.status).toBe(200);
  });

  it("generates QR and vCard for published public cards", async () => {
    const owner = await register("qr@example.com");
    const created = await request(app)
      .post("/api/cards")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ templateId: "midnight-cyan", fullName: "QR Tester", phone: "+1555123456", socialLinks: [] });
    await request(app).post(`/api/cards/${created.body.data.id}/publish`).set("Authorization", `Bearer ${owner.token}`);

    const qr = await request(app).get(`/api/public/cards/${created.body.data.slug}/qr.svg`);
    expect(qr.status).toBe(200);
    expect(qr.text || qr.body.toString()).toContain("<svg");

    const vcard = await request(app).get(`/api/public/cards/${created.body.data.slug}/vcard.vcf`);
    expect(vcard.status).toBe(200);
    expect(vcard.text).toContain("BEGIN:VCARD");
  });
});
