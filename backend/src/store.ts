import { randomUUID, createHash } from "crypto";
import mysql from "mysql2/promise";
import { config } from "./config.js";
import { templates } from "./templates.js";
import type { BusinessCard, PublicUser, Role, SocialLink, User } from "./types.js";
import { uniqueSlug } from "./utils/slug.js";
import { defaultMasters, type MasterItem } from './masters.js';

export interface Store {
  listPresets(userId:string):Promise<DesignPreset[]>;
  savePreset(userId:string,preset:DesignPreset):Promise<void>;
  deletePreset(userId:string,id:string):Promise<void>;
  addVisit(cardId:string,location?:{latitude:number;longitude:number;accuracy:number}):Promise<void>;
  listVisits(cardId:string):Promise<unknown[]>;
  listMasters(): Promise<MasterItem[]>;
  saveMaster(item:MasterItem): Promise<void>;
  addLead(cardId: string, sectionId: string, answers: Record<string,string>): Promise<void>;
  listLeads(cardId: string): Promise<unknown[]>;
  createUser(input: { name: string; email: string; passwordHash: string; role?: Role; status?: "active" | "disabled" }): Promise<PublicUser>;
  findUserByEmail(email: string): Promise<User | undefined>;
  findUserById(id: string): Promise<User | undefined>;
  listUsers(): Promise<PublicUser[]>;
  updateUserProfile(id: string, input: { name: string; profileImageUrl?: string }): Promise<PublicUser | undefined>;
  setUserPassword(id: string, passwordHash: string): Promise<boolean>;
  setUserStatus(id: string, status: "active" | "disabled"): Promise<PublicUser | undefined>;
  setUserRole(id: string, role: Role): Promise<PublicUser | undefined>;
  deleteUser(id: string): Promise<boolean>;
  createPasswordReset(userId: string, token: string, expiresAt: Date): Promise<void>;
  consumePasswordReset(token: string, passwordHash: string): Promise<boolean>;
  createCard(userId: string, data: Partial<BusinessCard>): Promise<BusinessCard>;
  listCards(userId: string): Promise<BusinessCard[]>;
  getCardForUser(userId: string, id: string): Promise<BusinessCard | undefined>;
  getPublicCard(slug: string): Promise<BusinessCard | undefined>;
  updateCard(userId: string, id: string, data: Partial<BusinessCard>): Promise<BusinessCard | undefined>;
  deleteCard(userId: string, id: string): Promise<boolean>;
  duplicateCard(userId: string, id: string): Promise<BusinessCard | undefined>;
  listAllCards(): Promise<BusinessCard[]>;
  setTemplateActive(id: string, active: boolean): Promise<void>;
}

function publicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, profileImageUrl: user.profileImageUrl };
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sqlValues(values: unknown[]) {
  return values.map((value) => value === undefined ? null : value) as any[];
}

export type DesignPreset={id:string;name:string;kind:string;settings:Record<string,string>};
export class MemoryStore implements Store {
  private presets=new Map<string,DesignPreset[]>();
  private visits:{cardId:string;createdAt:string;latitude?:number;longitude?:number;accuracy?:number}[]=[];
  async listPresets(userId:string){return this.presets.get(userId)||[];}
  async savePreset(userId:string,preset:DesignPreset){this.presets.set(userId,[...(this.presets.get(userId)||[]).filter(p=>p.id!==preset.id),preset]);}
  async deletePreset(userId:string,id:string){this.presets.set(userId,(this.presets.get(userId)||[]).filter(p=>p.id!==id));}
  async addVisit(cardId:string,location?:{latitude:number;longitude:number;accuracy:number}){this.visits.push({cardId,createdAt:new Date().toISOString(),...location});}
  async listVisits(cardId:string):Promise<unknown[]>{return this.visits.filter(v=>v.cardId===cardId);}
  private masters = new Map(defaultMasters.map(item=>[item.id,{...item}]));
  async listMasters() {return [...this.masters.values()].sort((a,b)=>a.sortOrder-b.sortOrder || a.label.localeCompare(b.label));}
  async saveMaster(item:MasterItem) {this.masters.set(item.id,{...item});}
  private leads: {id:string;cardId:string;sectionId:string;answers:Record<string,string>;createdAt:string}[] = [];
  async addLead(cardId:string,sectionId:string,answers:Record<string,string>) { this.leads.push({id:randomUUID(),cardId,sectionId,answers,createdAt:new Date().toISOString()}); }
  async listLeads(cardId:string): Promise<unknown[]> { return this.leads.filter(lead=>lead.cardId===cardId); }
  private users = new Map<string, User>();
  private cards = new Map<string, BusinessCard>();
  private resets = new Map<string, { userId: string; expiresAt: Date; used: boolean }>();

  async createUser(input: { name: string; email: string; passwordHash: string; role?: Role; status?: "active" | "disabled" }) {
    if ([...this.users.values()].some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error("Email already registered");
    }
    const user: User = {
      id: randomUUID(),
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role || "user",
      status: input.status || "active",
      profileImageUrl: "",
      createdAt: new Date().toISOString()
    };
    this.users.set(user.id, user);
    return publicUser(user);
  }

  async findUserByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email.toLowerCase());
  }

  async findUserById(id: string) {
    return this.users.get(id);
  }

  async listUsers() {
    return [...this.users.values()].map(publicUser);
  }

  async updateUserProfile(id: string, input: { name: string; profileImageUrl?: string }) {
    const user = this.users.get(id);
    if (!user) return undefined;
    user.name = input.name;
    user.profileImageUrl = input.profileImageUrl || "";
    return publicUser(user);
  }

  async setUserPassword(id: string, passwordHash: string) {
    const user = this.users.get(id);
    if (!user) return false;
    user.passwordHash = passwordHash;
    return true;
  }

  async setUserStatus(id: string, status: "active" | "disabled") {
    const user = this.users.get(id);
    if (!user) return undefined;
    user.status = status;
    return publicUser(user);
  }

  async setUserRole(id: string, role: Role) {
    const user = this.users.get(id);
    if (!user) return undefined;
    user.role = role;
    return publicUser(user);
  }

  async deleteUser(id: string) {
    return this.users.delete(id);
  }

  async createPasswordReset(userId: string, token: string, expiresAt: Date) {
    this.resets.set(tokenHash(token), { userId, expiresAt, used: false });
  }

  async consumePasswordReset(token: string, passwordHash: string) {
    const reset = this.resets.get(tokenHash(token));
    if (!reset || reset.used || reset.expiresAt < new Date()) return false;
    const user = this.users.get(reset.userId);
    if (!user) return false;
    user.passwordHash = passwordHash;
    reset.used = true;
    return true;
  }

  async createCard(userId: string, data: Partial<BusinessCard>) {
    const now = new Date().toISOString();
    const card: BusinessCard = {
      id: randomUUID(),
      userId,
      templateId: data.templateId || "signature-classic",
      slug: data.slug || uniqueSlug(data.fullName || "business-card"),
      status: data.status || "draft",
      fullName: data.fullName || "Untitled Card",
      designation: data.designation || "",
      company: data.company || "",
      bio: data.bio || "",
      email: data.email || "",
      phone: data.phone || "",
      whatsapp: data.whatsapp || "",
      website: data.website || "",
      address: data.address || "",
      mapsUrl: data.mapsUrl || "",
      profileImageUrl: data.profileImageUrl || "",
      logoUrl: data.logoUrl || "",
      theme: data.theme || {},
      content: data.content,
      socialLinks: data.socialLinks || [],
      publishedAt: data.status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now
    };
    this.cards.set(card.id, card);
    return card;
  }

  async listCards(userId: string) {
    return [...this.cards.values()].filter((card) => card.userId === userId);
  }

  async getCardForUser(userId: string, id: string) {
    const card = this.cards.get(id);
    return card?.userId === userId ? card : undefined;
  }

  async getPublicCard(slug: string) {
    return [...this.cards.values()].find((card) => card.slug === slug && card.status === "published");
  }

  async updateCard(userId: string, id: string, data: Partial<BusinessCard>) {
    const card = await this.getCardForUser(userId, id);
    if (!card) return undefined;
    const next = { ...card, ...data, socialLinks: data.socialLinks ?? card.socialLinks, updatedAt: new Date().toISOString() };
    if (data.status === "published" && card.status !== "published") next.publishedAt = new Date().toISOString();
    this.cards.set(id, next);
    return next;
  }

  async deleteCard(userId: string, id: string) {
    const card = await this.getCardForUser(userId, id);
    if (!card) return false;
    return this.cards.delete(id);
  }

  async duplicateCard(userId: string, id: string) {
    const card = await this.getCardForUser(userId, id);
    if (!card) return undefined;
    return this.createCard(userId, {
      ...card,
      fullName: `${card.fullName} Copy`,
      slug: uniqueSlug(`${card.slug}-copy`),
      status: "draft",
      socialLinks: card.socialLinks.map((link) => ({ ...link, id: randomUUID() }))
    });
  }

  async listAllCards() {
    return [...this.cards.values()];
  }

  async setTemplateActive(id: string, active: boolean) {
    const template = templates.find((item) => item.id === id);
    if (template) template.active = active;
  }
}

export class MySqlStore extends MemoryStore {
  async listPresets(userId:string):Promise<DesignPreset[]>{const [rows]=await this.pool.execute<mysql.RowDataPacket[]>('SELECT id,name,kind,settings FROM design_presets WHERE user_id=?',[userId]);return rows.map(r=>({id:r.id,name:r.name,kind:r.kind,settings:typeof r.settings==='string'?JSON.parse(r.settings):r.settings}));}
  async savePreset(userId:string,p:DesignPreset){await this.pool.execute('INSERT INTO design_presets (id,user_id,name,kind,settings) VALUES (?,?,?,?,?)',[p.id,userId,p.name,p.kind,JSON.stringify(p.settings)]);}
  async deletePreset(userId:string,id:string){await this.pool.execute('DELETE FROM design_presets WHERE id=? AND user_id=?',[id,userId]);}
  async addVisit(cardId:string,l?:{latitude:number;longitude:number;accuracy:number}){await this.pool.execute('INSERT INTO card_visits (id,card_id,latitude,longitude,accuracy) VALUES (?,?,?,?,?)',[randomUUID(),cardId,l?.latitude??null,l?.longitude??null,l?.accuracy??null]);}
  async listVisits(cardId:string){const [rows]=await this.pool.execute<mysql.RowDataPacket[]>('SELECT latitude,longitude,accuracy,created_at AS createdAt FROM card_visits WHERE card_id=? ORDER BY created_at DESC LIMIT 1000',[cardId]);return rows;}
  async listMasters():Promise<MasterItem[]> {
    const [rows]=await this.pool.query<mysql.RowDataPacket[]>('SELECT * FROM master_options ORDER BY sort_order,label');
    return rows.map(row=>({id:row.id,category:row.category,value:row.value,label:row.label,subtitle:row.subtitle,iconKey:row.icon_key,iconUrl:row.icon_url,active:Boolean(row.active),sortOrder:row.sort_order}));
  }
  async saveMaster(item:MasterItem) {
    await this.pool.execute('INSERT INTO master_options (id,category,value,label,subtitle,icon_key,icon_url,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE value=VALUES(value),label=VALUES(label),subtitle=VALUES(subtitle),icon_key=VALUES(icon_key),icon_url=VALUES(icon_url),active=VALUES(active),sort_order=VALUES(sort_order)',[item.id,item.category,item.value,item.label,item.subtitle,item.iconKey,item.iconUrl,item.active,item.sortOrder]);
  }
  async addLead(cardId:string,sectionId:string,answers:Record<string,string>) { await this.pool.execute('INSERT INTO card_leads (id,card_id,section_id,answers) VALUES (?,?,?,?)',[randomUUID(),cardId,sectionId,JSON.stringify(answers)]); }
  async listLeads(cardId:string) { const [rows]=await this.pool.execute<mysql.RowDataPacket[]>('SELECT id,section_id,answers,created_at FROM card_leads WHERE card_id=? ORDER BY created_at DESC',[cardId]); return rows; }
  private pool = mysql.createPool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    ssl: config.DB_SSL ? {} : undefined,
    connectionLimit: 10
  });

  async createUser(input: { name: string; email: string; passwordHash: string; role?: Role; status?: "active" | "disabled" }) {
    const id = randomUUID();
    await this.pool.execute(
      "INSERT INTO users (id, name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)",
      [id, input.name, input.email.toLowerCase(), input.passwordHash, input.role || "user", input.status || "active"]
    );
    const user = await this.findUserById(id);
    return publicUser(user!);
  }

  async findUserByEmail(email: string) {
    const [rows] = await this.pool.execute<mysql.RowDataPacket[]>("SELECT * FROM users WHERE email = ? LIMIT 1", [email.toLowerCase()]);
    return rows[0] ? this.rowToUser(rows[0]) : undefined;
  }

  async findUserById(id: string) {
    const [rows] = await this.pool.execute<mysql.RowDataPacket[]>("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
    return rows[0] ? this.rowToUser(rows[0]) : undefined;
  }

  async listUsers() {
    const [rows] = await this.pool.execute<mysql.RowDataPacket[]>("SELECT * FROM users ORDER BY created_at DESC");
    return rows.map((row) => publicUser(this.rowToUser(row)));
  }

  async updateUserProfile(id: string, input: { name: string; profileImageUrl?: string }) {
    await this.pool.execute("UPDATE users SET name = ?, profile_image_url = ? WHERE id = ?", [input.name, input.profileImageUrl || null, id]);
    const user = await this.findUserById(id);
    return user ? publicUser(user) : undefined;
  }

  async setUserPassword(id: string, passwordHash: string) {
    const [result] = await this.pool.execute<mysql.ResultSetHeader>("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, id]);
    return result.affectedRows > 0;
  }

  async setUserStatus(id: string, status: "active" | "disabled") {
    await this.pool.execute("UPDATE users SET status = ? WHERE id = ?", [status, id]);
    const user = await this.findUserById(id);
    return user ? publicUser(user) : undefined;
  }

  async setUserRole(id: string, role: Role) {
    await this.pool.execute("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    const user = await this.findUserById(id);
    return user ? publicUser(user) : undefined;
  }

  async deleteUser(id: string) {
    const [result] = await this.pool.execute<mysql.ResultSetHeader>("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  async createPasswordReset(userId: string, token: string, expiresAt: Date) {
    await this.pool.execute("INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)", [randomUUID(), userId, tokenHash(token), expiresAt]);
  }

  async consumePasswordReset(token: string, passwordHash: string) {
    const hash = tokenHash(token);
    const [rows] = await this.pool.execute<mysql.RowDataPacket[]>("SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1", [hash]);
    if (!rows[0]) return false;
    await this.pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [passwordHash, rows[0].user_id]);
    await this.pool.execute("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [rows[0].id]);
    return true;
  }

  async createCard(userId: string, data: Partial<BusinessCard>) {
    const card = await super.createCard(userId, data);
    await this.pool.execute(
      "INSERT INTO business_cards (id,user_id,template_id,slug,status,full_name,designation,company,bio,email,phone,whatsapp,website,address,maps_url,profile_image_url,logo_url,theme,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      sqlValues([card.id,userId,card.templateId,card.slug,card.status,card.fullName,card.designation,card.company,card.bio,card.email,card.phone,card.whatsapp,card.website,card.address,card.mapsUrl,card.profileImageUrl,card.logoUrl,JSON.stringify(card.theme),card.publishedAt ? new Date(card.publishedAt) : null])
    );
    await this.replaceSocials(card.id, card.socialLinks);
    await this.replaceContent(card.id, card.content);
    return card;
  }

  async listCards(userId: string) {
    const [rows] = await this.pool.execute<mysql.RowDataPacket[]>("SELECT * FROM business_cards WHERE user_id = ? ORDER BY updated_at DESC", [userId]);
    return Promise.all(rows.map((row) => this.rowToCard(row)));
  }

  async getCardForUser(userId: string, id: string) {
    const [rows] = await this.pool.execute<mysql.RowDataPacket[]>("SELECT * FROM business_cards WHERE id = ? AND user_id = ? LIMIT 1", [id, userId]);
    return rows[0] ? this.rowToCard(rows[0]) : undefined;
  }

  async getPublicCard(slug: string) {
    const [rows] = await this.pool.execute<mysql.RowDataPacket[]>("SELECT * FROM business_cards WHERE slug = ? AND status = 'published' LIMIT 1", [slug]);
    return rows[0] ? this.rowToCard(rows[0]) : undefined;
  }

  async updateCard(userId: string, id: string, data: Partial<BusinessCard>) {
    const existing = await this.getCardForUser(userId, id);
    if (!existing) return undefined;
    const card = { ...existing, ...data, socialLinks: data.socialLinks ?? existing.socialLinks, updatedAt: new Date().toISOString() };
    if (data.status === "published" && existing.status !== "published") card.publishedAt = new Date().toISOString();
    await this.pool.execute(
      "UPDATE business_cards SET template_id=?, slug=?, status=?, full_name=?, designation=?, company=?, bio=?, email=?, phone=?, whatsapp=?, website=?, address=?, maps_url=?, profile_image_url=?, logo_url=?, theme=?, published_at=? WHERE id=? AND user_id=?",
      sqlValues([card.templateId,card.slug,card.status,card.fullName,card.designation,card.company,card.bio,card.email,card.phone,card.whatsapp,card.website,card.address,card.mapsUrl,card.profileImageUrl,card.logoUrl,JSON.stringify(card.theme),card.publishedAt ? new Date(card.publishedAt) : null,id,userId])
    );
    await this.replaceSocials(id, card.socialLinks);
    await this.replaceContent(id, card.content);
    return card;
  }

  async deleteCard(userId: string, id: string) {
    const [result] = await this.pool.execute<mysql.ResultSetHeader>("DELETE FROM business_cards WHERE id = ? AND user_id = ?", [id, userId]);
    return result.affectedRows > 0;
  }

  async duplicateCard(userId: string, id: string) {
    const card = await this.getCardForUser(userId, id);
    if (!card) return undefined;
    return this.createCard(userId, { ...card, fullName: `${card.fullName} Copy`, slug: uniqueSlug(`${card.slug}-copy`), status: "draft" });
  }

  async listAllCards() {
    const [rows] = await this.pool.execute<mysql.RowDataPacket[]>("SELECT * FROM business_cards ORDER BY updated_at DESC");
    return Promise.all(rows.map((row) => this.rowToCard(row)));
  }

  async setTemplateActive(id: string, active: boolean) {
    await this.pool.execute("UPDATE card_templates SET is_active = ? WHERE id = ?", [active, id]);
  }

  private rowToUser(row: mysql.RowDataPacket): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      status: row.status,
      profileImageUrl: row.profile_image_url || "",
      createdAt: row.created_at?.toISOString?.() || row.created_at
    };
  }

  private async rowToCard(row: mysql.RowDataPacket): Promise<BusinessCard> {
    const [contentRows] = await this.pool.execute<mysql.RowDataPacket[]>('SELECT content FROM card_content WHERE card_id = ?', [row.id]);
    const content = contentRows[0]?.content;
    const [links] = await this.pool.execute<mysql.RowDataPacket[]>("SELECT id, platform, url FROM card_social_links WHERE card_id = ? ORDER BY sort_order ASC", [row.id]);
    return {
      id: row.id,
      userId: row.user_id,
      content: typeof content === 'string' ? JSON.parse(content) : content || undefined,
      templateId: row.template_id,
      slug: row.slug,
      status: row.status,
      fullName: row.full_name,
      designation: row.designation || "",
      company: row.company || "",
      bio: row.bio || "",
      email: row.email || "",
      phone: row.phone || "",
      whatsapp: row.whatsapp || "",
      website: row.website || "",
      address: row.address || "",
      mapsUrl: row.maps_url || "",
      profileImageUrl: row.profile_image_url || "",
      logoUrl: row.logo_url || "",
      theme: typeof row.theme === "string" ? JSON.parse(row.theme || "{}") : row.theme || {},
      socialLinks: links as SocialLink[],
      publishedAt: row.published_at?.toISOString?.(),
      createdAt: row.created_at?.toISOString?.() || row.created_at,
      updatedAt: row.updated_at?.toISOString?.() || row.updated_at
    };
  }

  private async replaceSocials(cardId: string, links: SocialLink[]) {
    await this.pool.execute("DELETE FROM card_social_links WHERE card_id = ?", [cardId]);
    for (const [index, link] of links.entries()) {
      await this.pool.execute("INSERT INTO card_social_links (id, card_id, platform, url, sort_order) VALUES (?, ?, ?, ?, ?)", [link.id || randomUUID(), cardId, link.platform, link.url, index]);
    }
  }

  private async replaceContent(cardId: string, content: BusinessCard['content']) {
    if (content) await this.pool.execute('INSERT INTO card_content (card_id, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = VALUES(content)', [cardId, JSON.stringify(content)]);
  }
}

export const store: Store = config.NODE_ENV === "test" ? new MemoryStore() : new MySqlStore();
