export type Role = "user" | "admin";
export type CardStatus = "draft" | "published";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: "active" | "disabled";
  createdAt: string;
};

export type SocialLink = {
  id?: string;
  platform: string;
  url: string;
};

export type BusinessCard = {
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

export type PublicUser = Pick<User, "id" | "name" | "email" | "role" | "status">;

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
