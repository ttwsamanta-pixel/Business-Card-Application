import { z } from "zod";

const url = z.string().url().optional().or(z.literal(""));
const optionalText = z.string().trim().max(500).optional().or(z.literal(""));

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().email().max(190),
  password: z.string().min(8).max(128),
});

export const adminCreateUserSchema = registerSchema.extend({
  role: z.enum(["user", "admin"]).default("user"),
  status: z.enum(["active", "disabled"]).default("active"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  profileImageUrl: url,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const socialLinkSchema = z.object({
  id: z.string().optional(),
  platform: z.string().trim().min(1).max(80),
  url: z.string().url().max(500),
});

export const cardSchema = z.object({
  content: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        type: z.enum([
          "profile",
          "text",
          "contact",
          "images",
          "social",
          "links",
          "appointment",
          "lead",
        ]),
        enabled: z.boolean(),
        background: z.boolean(),
        values: z.record(z.union([z.string().max(5000), z.boolean()])),
        items: z
          .array(
            z.object({
              id: z.string().min(1).max(80),
              values: z.record(z.union([z.string().max(5000), z.boolean()])),
            }),
          )
          .max(100),
      }),
    )
    .max(40)
    .optional(),
  templateId: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(3)
    .max(160)
    .optional(),
  fullName: z.string().trim().min(2).max(180),
  designation: optionalText,
  company: optionalText,
  bio: z.string().max(2000).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: optionalText,
  whatsapp: optionalText,
  website: url,
  address: z.string().max(1000).optional().or(z.literal("")),
  mapsUrl: url,
  profileImageUrl: url,
  logoUrl: url,
  theme: z.record(z.string().max(12000)).refine(v=>Object.keys(v).length<=100,'Too many settings').optional(),
  socialLinks: z.array(socialLinkSchema).max(12).default([]),
});

export const cardPatchSchema = cardSchema.partial().extend({
  socialLinks: z.array(socialLinkSchema).max(12).optional(),
});
