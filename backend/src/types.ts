export type Role = "user" | "admin";
export type CardStatus = "draft" | "published";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: "active" | "disabled";
  profileImageUrl?: string;
  createdAt: string;
};

export type SocialLink = {
  id?: string;
  platform: string;
  url: string;
};

export type BusinessCard = {
  content?: { id: string; type: string; enabled: boolean; background: boolean; values: Record<string, string | boolean>; items: { id: string; values: Record<string, string | boolean> }[] }[];
  id: string;
  userId: string;
  templateId: string;
  slug: string;
  status: CardStatus;
  fullName: string;
  designation?: string;
  company?: string;
  bio?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  mapsUrl?: string;
  profileImageUrl?: string;
  logoUrl?: string;
  theme?: Record<string, string>;
  socialLinks: SocialLink[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = Pick<User, "id" | "name" | "email" | "role" | "status" | "profileImageUrl">;

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
