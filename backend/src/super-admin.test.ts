import request from "supertest";
import { it, expect } from "vitest";
import { store } from "./store.js";
import { app } from "./app.js";
import { signUserToken } from "./middleware/auth.js";

it("allows only designated Super Admin to see and update all owners cards", async () => {
  const root = await store.createUser({
    name: "Super Admin",
    email: "admin@example.com",
    passwordHash: "test",
    role: "admin",
  });
  const admin = await store.createUser({
    name: "Other Admin",
    email: "other-admin@example.test",
    passwordHash: "test",
    role: "admin",
  });
  const member = await store.createUser({
    name: "Owner",
    email: "card-owner@example.test",
    passwordHash: "test",
  });
  const auth = (id: string) => ({
    Authorization: `Bearer ${signUserToken(id)}`,
  });
  const first = await store.createCard(member.id, { fullName: "Member Card" }),
    second = await store.createCard(admin.id, { fullName: "Admin Card" });
  await store.addLead(first.id, "lead", { name: "Lead Person" });
  expect(
    (await request(app).get("/api/auth/me").set(auth(root.id))).body.data.user
      .isSuperAdmin,
  ).toBe(true);
  const list = await request(app).get("/api/management").set(auth(root.id));
  expect(list.body.data.cards).toHaveLength(2);
  expect(
    (await request(app).get("/api/management?scope=own").set(auth(root.id)))
      .body.data.cards,
  ).toHaveLength(0);
  expect(
    (await request(app).get("/api/admin/cards").set(auth(admin.id))).body.data,
  ).toHaveLength(1);
  expect(
    list.body.data.cards.find((c: any) => c.id === first.id),
  ).toMatchObject({ ownerName: "Owner", ownedByMe: false });
  for (const card of [first, second]) {
    expect(
      (await request(app).get(`/api/cards/${card.id}`).set(auth(root.id)))
        .status,
    ).toBe(200);
    const saved = await request(app)
      .put(`/api/cards/${card.id}`)
      .set(auth(root.id))
      .send({ fullName: "Edited by Super Admin", userId: root.id });
    expect(saved.status).toBe(200);
    expect(saved.body.data.userId).toBe(card.userId);
    expect(
      (
        await request(app)
          .post(`/api/cards/${card.id}/publish`)
          .set(auth(root.id))
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/api/cards/${card.id}/qr.svg`)
          .set(auth(root.id))
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/api/management/analytics?cardId=${card.id}`)
          .set(auth(root.id))
      ).status,
    ).toBe(200);
  }
  expect(
    (await request(app).get(`/api/cards/${first.id}/leads`).set(auth(root.id)))
      .body.data,
  ).toHaveLength(1);
  for (const actor of [admin, member]) {
    const other = actor.id === admin.id ? first : second;
    expect(
      (await request(app).get("/api/management").set(auth(actor.id))).body.data
        .cards,
    ).toHaveLength(1);
    expect(
      (await request(app).get(`/api/cards/${other.id}`).set(auth(actor.id)))
        .status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put(`/api/cards/${other.id}`)
          .set(auth(actor.id))
          .send({ fullName: "Denied" })
      ).status,
    ).toBe(404);
    expect((await request(app).post(`/api/cards/${other.id}/duplicate`).set(auth(actor.id))).status).toBe(404);
    expect((await request(app).delete(`/api/cards/${other.id}`).set(auth(actor.id))).status).toBe(404);
    expect((await request(app).put('/api/management/folders').set(auth(actor.id)).send({cardIds:[other.id],folderId:null})).status).toBe(404);
  }
  const duplicate = await request(app).post(`/api/cards/${first.id}/duplicate`).set(auth(root.id));
  expect(duplicate.status).toBe(201);
  expect(duplicate.body.data).toMatchObject({userId:member.id,status:'draft',fullName:'Edited by Super Admin Copy'});
  expect(duplicate.body.data.slug).not.toBe(first.slug);
  expect((await store.getCardForUser(member.id,first.id))?.status).toBe('published');
  const folder = await request(app).post('/api/management/folders').set(auth(member.id)).send({name:'Member folder'});
  const otherFolder = await request(app).post('/api/management/folders').set(auth(admin.id)).send({name:'Admin folder'});
  const ids=[first.id,duplicate.body.data.id];
  expect((await request(app).put('/api/management/folders').set(auth(root.id)).send({cardIds:ids,folderId:folder.body.data.id})).status).toBe(200);
  expect((await store.folderMembers(member.id)).filter(m=>m.folderId===folder.body.data.id)).toHaveLength(2);
  expect((await request(app).put('/api/management/folders').set(auth(root.id)).send({cardIds:ids,folderId:otherFolder.body.data.id})).status).toBe(404);
  expect((await request(app).put('/api/management/folders').set(auth(root.id)).send({cardIds:[first.id,second.id],folderId:folder.body.data.id})).status).toBe(422);
  expect((await store.folderMembers(member.id)).filter(m=>m.folderId===folder.body.data.id)).toHaveLength(2);
  expect((await request(app).put('/api/management/folders').set(auth(root.id)).send({cardIds:[first.id,second.id],folderId:null})).status).toBe(200);
  expect((await request(app).delete(`/api/cards/${duplicate.body.data.id}`).set(auth(root.id))).status).toBe(200);
  expect(
    (await request(app).delete(`/api/cards/${first.id}`).set(auth(root.id)))
      .status,
  ).toBe(200);
  expect(await store.getCardById(first.id)).toBeUndefined();
  expect(
    (
      await request(app)
        .patch(`/api/admin/users/${root.id}/role`)
        .set(auth(admin.id))
        .send({ role: "user" })
    ).status,
  ).toBe(403);
  await store.editUser(root.id, {
    name: "Renamed",
    email: "renamed@example.test",
    role: "admin",
    status: "active",
  });
  expect(
    (await request(app).get("/api/auth/me").set(auth(root.id))).body.data.user
      .isSuperAdmin,
  ).toBe(true);
});
