import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "./app.js";
import { store } from "./store.js";
import { signUserToken } from "./middleware/auth.js";

async function account(role: "user" | "admin", suffix: string) {
  const user = await store.createUser({
    name: "Permission Test",
    email: `${suffix}@permissions.test`,
    passwordHash: "test",
    role,
  });
  return { user, auth: { Authorization: `Bearer ${signUserToken(user.id)}` } };
}
describe("menu permissions and account management", () => {
  it("persists permissions and enforces revocation using an existing session", async () => {
    const admin = await account("admin", "owner"),
      member = await account("user", "member");
    expect((await request(app).get("/api/cards").set(member.auth)).status).toBe(
      200,
    );
    const save = await request(app)
      .put(`/api/admin/users/${member.user.id}/permissions`)
      .set(admin.auth)
      .send({ permissions: ["dashboard", "users", "master:social"] });
    expect(save.status).toBe(200);
    expect(save.body.data.permissions).toEqual(["dashboard"]);
    expect(
      (await request(app).get("/api/auth/me").set(member.auth)).body.data.user
        .permissions,
    ).toEqual(["dashboard"]);
    for (const path of [
      "/api/CARDS",
      "/api/cards",
      "/api/admin/users",
      "/api/management/analytics",
    ])
      expect((await request(app).get(path).set(member.auth)).status).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/management/folders")
          .set(member.auth)
          .send({ name: "Denied" })
      ).status,
    ).toBe(403);
    expect(
      (await request(app).get("/api/management").set(member.auth)).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .put(`/api/admin/users/${admin.user.id}/permissions`)
          .set(admin.auth)
          .send({ permissions: [] })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(`/api/admin/users/${member.user.id}/permissions`)
          .set(admin.auth)
          .send({ permissions: ["unknown"] })
      ).status,
    ).toBe(422);
    await store.setPermissions(member.user.id, ["cards"]);
    expect((await request(app).get("/api/cards").set(member.auth)).status).toBe(
      200,
    );
  });
  it("restricts administrators by menu and edits users without resetting passwords", async () => {
    const admin = await account("admin", "editor"),
      limited = await account("admin", "limited"),
      member = await account("user", "editable");
    await store.setPermissions(limited.user.id, [
      "templates",
      "master:contact",
    ]);
    expect(
      (await request(app).get("/api/admin/users").set(limited.auth)).status,
    ).toBe(403);
    expect(
      (await request(app).get("/api/admin/templates").set(limited.auth)).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post("/api/masters")
          .set(limited.auth)
          .send({ category: "social" })
      ).status,
    ).toBe(403);
    const input = {
      name: "Updated Person",
      email: "updated@permissions.test",
      role: "admin",
      status: "active",
    };
    expect(
      (
        await request(app)
          .patch(`/api/admin/users/${member.user.id}`)
          .set(admin.auth)
          .send(input)
      ).status,
    ).toBe(200);
    expect(await store.findUserById(member.user.id)).toMatchObject({
      ...input,
      passwordHash: "test",
    });
    expect(
      (
        await request(app)
          .patch(`/api/admin/users/${admin.user.id}`)
          .set(admin.auth)
          .send({ ...input, email: admin.user.email, role: "user" })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch(`/api/admin/users/${member.user.id}`)
          .set(admin.auth)
          .send({ ...input, email: admin.user.email })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .delete(`/api/admin/users/${member.user.id}`)
          .set(admin.auth)
      ).status,
    ).toBe(200);
    expect(
      (await request(app).get("/api/auth/me").set(member.auth)).status,
    ).toBe(401);
  });
  it("filters disabled templates while preserving existing cards", async () => {
    const admin = await account("admin", "templates");
    const body = {
      templateId: "soft-pastel",
      fullName: "Existing Card",
      socialLinks: [],
    };
    const created = await request(app)
      .post("/api/cards")
      .set(admin.auth)
      .send(body);
    expect(created.status).toBe(201);
    try {
      expect(
        (
          await request(app)
            .patch("/api/admin/templates/soft-pastel")
            .set(admin.auth)
            .send({ active: false })
        ).status,
      ).toBe(200);
      expect(
        (await request(app).get("/api/templates")).body.data.some(
          (t: { id: string }) => t.id === "soft-pastel",
        ),
      ).toBe(false);
      expect(
        (await request(app).post("/api/cards").set(admin.auth).send(body))
          .status,
      ).toBe(422);
      expect(
        (
          await request(app)
            .put(`/api/cards/${created.body.data.id}`)
            .set(admin.auth)
            .send({ ...body, fullName: "Still Editable" })
        ).status,
      ).toBe(200);
      expect(
        (
          await request(app).get("/api/admin/templates").set(admin.auth)
        ).body.data.find((t: { id: string }) => t.id === "soft-pastel").active,
      ).toBe(false);
    } finally {
      await store.setTemplateActive("soft-pastel", true);
    }
  });
});
