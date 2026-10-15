import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";
import { store } from './store.js';

async function register(email = "owner@example.com") {
  const res = await request(app).post("/api/auth/register").send({ name: "Owner User", email, password: "Password123!" });
  return { token: res.body.data.token, user: res.body.data.user };
}

describe("digital business card API", () => {
  it('marks API responses and errors as non-indexable',async()=>{
    for(const path of ['/health','/api/templates','/api/cards','/missing-page']) {
      const response=await request(app).get(path);
      expect(response.headers['x-robots-tag']).toBe('noindex, nofollow, noarchive');
    }
  });
  it('restricts masters to administrators and preserves saved master selections',async()=>{
    const admin=await register('master-admin@example.com');await store.setUserRole(admin.user.id,'admin');
    const user=await register('master-user@example.com');
    const adminAuth={Authorization:`Bearer ${admin.token}`};const userAuth={Authorization:`Bearer ${user.token}`};
    expect((await request(app).get('/api/masters')).status).toBe(401);
    const catalog=await request(app).get('/api/masters').set(userAuth);
    expect(catalog.body.data.groups).toHaveLength(12);
    const draft={category:'social',value:'URL',label:'Custom Social',subtitle:'Follow our updates',iconKey:'instagram',iconUrl:'https://example.com/logo.png',active:true,sortOrder:4};
    expect((await request(app).post('/api/masters').set(userAuth).send(draft)).status).toBe(403);
    expect((await request(app).post('/api/masters').set(adminAuth).send({...draft,value:'Unsupported'})).status).toBe(422);
    const created=await request(app).post('/api/masters').set(adminAuth).send(draft);expect(created.status).toBe(201);
    const entry=created.body.data;
    const content=[{id:'social',type:'social',enabled:true,background:true,values:{title:'Social Links'},items:[{id:'row',values:{masterId:entry.id,url:'https://example.com/profile'}}]}];
    const card=await request(app).post('/api/cards').set(userAuth).send({templateId:'signature-classic',fullName:'Master Test',content,socialLinks:[]});
    expect(card.status).toBe(201);
    const values=card.body.data.content[0].items[0].values;
    expect(values).toMatchObject({title:draft.label,subtitle:draft.subtitle,icon:draft.iconUrl,url:'https://example.com/profile'});
    expect((await request(app).put(`/api/masters/${entry.id}`).set(userAuth).send({...entry,active:false})).status).toBe(403);
    expect((await request(app).put(`/api/masters/${entry.id}`).set(adminAuth).send({...entry,active:false})).status).toBe(200);
    const saved=await request(app).put(`/api/cards/${card.body.data.id}`).set(userAuth).send({content:card.body.data.content});
    expect(saved.body.data.content[0].items[0].values).toEqual(values);
    expect((await request(app).get('/api/masters').set(userAuth)).body.data.items.find((item:{id:string})=>item.id===entry.id).active).toBe(false);
  });
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
    const updated=await request(app).put(`/api/cards/${id}`).set(auth).send({content});
    expect(updated.status).toBe(200);
    const savedContent=updated.body.data.content;
    expect(savedContent.map((section:{id:string})=>section.id)).toEqual(content.map(section=>section.id));
    expect(savedContent.find((section:{id:string})=>section.id==='contact').items[0].values.value).toBe('+1555000000');
    expect((await request(app).get(`/api/cards/${id}`).set(auth)).body.data.content).toEqual(savedContent);
    await request(app).post(`/api/cards/${id}/publish`).set(auth);
    expect((await request(app).get(`/api/public/cards/${created.body.data.slug}`)).body.data.content).toEqual(savedContent);
    expect((await request(app).post(`/api/cards/${id}/duplicate`).set(auth)).body.data.content).toEqual(savedContent);
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
