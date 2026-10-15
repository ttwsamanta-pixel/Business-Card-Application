import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

async function register(email = "owner@example.com") {
  const res = await request(app).post("/api/auth/register").send({ name: "Owner User", email, password: "Password123!" });
  return { token: res.body.data.token, user: res.body.data.user };
}

describe("digital business card API", () => {
  it('persists editor sections, media and toggles across save, publish and duplicate', async()=>{
    const owner=await register('content-owner@example.com');
    const auth={Authorization:`Bearer ${owner.token}`};
    const upload=await request(app).post('/api/uploads').set(auth).attach('file',Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aE9sAAAAASUVORK5CYII=','base64'),{filename:'photo.png',contentType:'image/png'});
    expect(upload.status).toBe(201);
    const image=await request(app).get(new URL(upload.body.data.publicUrl).pathname);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toContain('image/png');
    const content=[{id:'profile',type:'profile',enabled:false,background:true,values:{photo:false,logo:true},items:[]},{id:'contact',type:'contact',enabled:true,background:false,values:{title:'Reach us',saveLink:true},items:[{id:'phone',values:{type:'Phone',label:'Office',value:'+1555000000'}}]},{id:'images',type:'images',enabled:true,background:true,values:{layout:'Grid 1'},items:[{id:'image',values:{url:upload.body.data.publicUrl,alt:'Uploaded photo'}}]}];
    const created=await request(app).post('/api/cards').set(auth).send({templateId:'signature-classic',fullName:'Content Test',content,socialLinks:[]});
    expect(created.status).toBe(201);
    const id=created.body.data.id;
    content.reverse();content[0].background=false;
    expect((await request(app).put(`/api/cards/${id}`).set(auth).send({content})).status).toBe(200);
    expect((await request(app).get(`/api/cards/${id}`).set(auth)).body.data.content).toEqual(content);
    await request(app).post(`/api/cards/${id}/publish`).set(auth);
    expect((await request(app).get(`/api/public/cards/${created.body.data.slug}`)).body.data.content).toEqual(content);
    expect((await request(app).post(`/api/cards/${id}/duplicate`).set(auth)).body.data.content).toEqual(content);
    const vcard=await request(app).get(`/api/public/cards/${created.body.data.slug}/vcard.vcf`);
    expect(vcard.text).toContain('+1555000000');
    expect(vcard.text).toContain(`/card/${created.body.data.slug}`);
  });

  it('validates lead responses and restricts collected contacts to the card owner', async()=>{
    const owner=await register('lead-owner@example.com');const other=await register('lead-other@example.com');
    const auth={Authorization:`Bearer ${owner.token}`};
    const content=[{id:'lead',type:'lead',enabled:true,background:true,values:{consent:'I agree'},items:[{id:'email',values:{type:'Email',label:'Your Email',required:true,error:'Email is required'}}]}];
    const created=await request(app).post('/api/cards').set(auth).send({templateId:'signature-classic',fullName:'Lead Test',content,socialLinks:[]});
    const {id,slug}=created.body.data;
    const path=`/api/public/cards/${slug}/leads`;
    expect((await request(app).post(path).send({sectionId:'lead',answers:{email:'test@example.com'},consent:true})).status).toBe(404);
    await request(app).post(`/api/cards/${id}/publish`).set(auth);
    expect((await request(app).post(path).send({sectionId:'lead',answers:{},consent:true})).status).toBe(422);
    expect((await request(app).post(path).send({sectionId:'lead',answers:{email:'invalid'},consent:true})).status).toBe(422);
    expect((await request(app).post(path).send({sectionId:'lead',answers:{email:'test@example.com'},consent:false})).status).toBe(422);
    expect((await request(app).post(path).send({sectionId:'lead',answers:{email:'test@example.com'},consent:true})).status).toBe(201);
    expect((await request(app).get(`/api/cards/${id}/leads`).set(auth)).body.data).toHaveLength(1);
    expect((await request(app).get(`/api/cards/${id}/leads`).set({Authorization:`Bearer ${other.token}`})).status).toBe(404);
  });
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
