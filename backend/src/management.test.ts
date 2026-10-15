import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "./app.js";
describe("card lists, folders and measured analytics", () => {
  it("keeps folders private, moves cards, and retains cards when a folder is deleted", async () => {
    const a = (
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Folder Owner",
          email: "folders@example.test",
          password: "Password123!",
        })
    ).body.data;
    const b = (
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Other Owner",
          email: "other-folders@example.test",
          password: "Password123!",
        })
    ).body.data;
    const auth = { Authorization: `Bearer ${a.token}` },
      other = { Authorization: `Bearer ${b.token}` };
    const card = (
      await request(app)
        .post("/api/cards")
        .set(auth)
        .send({
          templateId: "signature-classic",
          fullName: "Original Name",
          socialLinks: [],
        })
    ).body.data;
    expect(
      (await request(app).get(`/api/cards/${card.id}/qr.svg`).set(auth)).status,
    ).toBe(200);
    expect(
      (await request(app).get(`/api/public/cards/${card.slug}`)).status,
    ).toBe(404);
    const f = await request(app)
      .post("/api/management/folders")
      .set(auth)
      .send({ name: "My Clients" });
    expect(f.status).toBe(201);
    const id = f.body.data.id;
    expect(
      (
        await request(app)
          .post("/api/management/folders")
          .set(auth)
          .send({ name: "My Clients" })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .put("/api/management/folders")
          .set(other)
          .send({ cardIds: [card.id], folderId: id })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(`/api/management/folders/${id}`)
          .set(other)
          .send({ name: "Hijack" })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get(`/api/management/analytics?folderId=${id}`)
          .set(other)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put("/api/management/folders")
          .set(auth)
          .send({ cardIds: [card.id], folderId: id })
      ).status,
    ).toBe(200);
    let data = (await request(app).get("/api/management").set(auth)).body.data;
    expect(data.cards[0]).toMatchObject({
      fullName: "Original Name",
      scans: 0,
      folderId: id,
    });
    expect(data.folders[0].count).toBe(1);
    expect(data.total).toBe(0);
    await request(app)
      .put(`/api/management/folders/${id}`)
      .set(auth)
      .send({ name: "Renamed" });
    expect(
      (await request(app).get("/api/management").set(auth)).body.data.folders[0]
        .name,
    ).toBe("Renamed");
    await request(app).delete(`/api/management/folders/${id}`).set(auth);
    data = (await request(app).get("/api/management").set(auth)).body.data;
    expect(data.cards).toHaveLength(1);
    expect(data.cards[0].folderId).toBe("");
    expect(data.folders).toHaveLength(0);
  });
  it("counts real views, unique visitors, clicks, contact downloads and submissions with date filters", async () => {
    const owner = (
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Metrics Owner",
          email: "metrics@example.test",
          password: "Password123!",
        })
    ).body.data;
    const auth = { Authorization: `Bearer ${owner.token}` };
    const card = (
      await request(app)
        .post("/api/cards")
        .set(auth)
        .send({
          templateId: "signature-classic",
          fullName: "Measured Card",
          socialLinks: [],
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
        })
    ).body.data;
    await request(app).post(`/api/cards/${card.id}/publish`).set(auth);
    const guest = request.agent(app),
      url = `/api/public/cards/${card.slug}`;
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
    await guest.post(`${url}/visits`).set("User-Agent", ua).send({});
    await guest.post(`${url}/visits`).set("User-Agent", ua).send({});
    await guest
      .post(`${url}/events`)
      .send({ kind: "link", url: "https://example.com/contact" });
    await guest.get(`${url}/vcard.vcf`);
    await guest.post(`${url}/leads`).send({ sectionId: "lead", answers: {} });
    const response = await request(app)
      .get(`/api/management/analytics?cardId=${card.id}`)
      .set(auth);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      total: 2,
      unique: 1,
      clicks: 1,
      contacts: 1,
      forms: 1,
    });
    expect(response.body.data.links).toEqual([
      { url: "https://example.com/contact", total: 1 },
    ]);
    expect(response.body.data.devices[0].label).toBe("iPhone");
    expect(response.body.data.timeline[0].total).toBe(2);
    expect(
      (
        await request(app)
          .get(
            `/api/management/analytics?cardId=${card.id}&from=2099-01-01T00:00:00.000Z`,
          )
          .set(auth)
      ).body.data.total,
    ).toBe(0);
    expect(
      (
        await request(app)
          .get(`/api/management/analytics?cardId=${card.id}&tz=invalid`)
          .set(auth)
      ).status,
    ).toBe(422);
    expect(
      (await request(app).get(`/api/management/analytics?cardId=${card.id}`))
        .status,
    ).toBe(401);
    const summary = (await request(app).get("/api/management").set(auth)).body
      .data;
    expect(summary.total).toBe(2);
    expect(summary.cards[0].scans).toBe(2);
    expect(
      (
        await request(app)
          .put(`/api/management/cards/${card.id}/campaign`)
          .set(auth)
          .send({ start: "2025-03-02", end: "2025-02-28" })
      ).status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .put(`/api/management/cards/${card.id}/campaign`)
          .set(auth)
          .send({ start: "", end: "2000-01-01" })
      ).status,
    ).toBe(200);
    expect((await guest.get(url)).status).toBe(404);
    expect((await guest.get(`${url}/vcard.vcf`)).status).toBe(404);
    expect(
      (
        await request(app)
          .put(`/api/management/cards/${card.id}/campaign`)
          .set(auth)
          .send({ start: "", end: "" })
      ).status,
    ).toBe(200);
    expect((await guest.get(url)).status).toBe(200);
  });
});
