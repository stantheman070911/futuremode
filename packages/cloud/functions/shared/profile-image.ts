import { contentFingerprint } from "../../lib/reusable/core.js";
import { publicProfile, type OwnerPitchProfile } from "./contracts.js";

export const PROFILE_IMAGE_MODEL_ID = "gemini-3.1-flash-lite-image";
export const PROFILE_IMAGE_VARIANTS = ["thumbnail", "detail"] as const;
export const PROFILE_IMAGE_REVISION_LENGTH = 16;
export type ProfileImageVariant = typeof PROFILE_IMAGE_VARIANTS[number];
export type ProfileImageStatus = "pending" | "ready" | "failed";

export interface ProfileImageMetadata {
  status: "READY" | "FAILED";
  versionId: string;
  sourceHash: string;
  thumbnailKey?: string;
  detailKey?: string;
  updatedAt: string;
  failureCode?: string;
}

export function profileImageSource(profile: OwnerPitchProfile) {
  return publicProfile(profile);
}

export function profileImageSourceHash(profile: OwnerPitchProfile): string {
  return contentFingerprint(profileImageSource(profile));
}

export function buildProfileImagePrompt(profile: OwnerPitchProfile): string {
  const source = profileImageSource(profile);
  return `Use case: stylized-concept
Asset type: AI agent mascot character

Create one original animal mascot representing this owner-approved public profile:

ANIMAL PERSONA:
${source.animal_persona}

PUBLIC PROFILE:
${JSON.stringify(source, null, 2)}

Identify the single most distinctive professional behavior in the profile. Express it through the animal's posture, facial expression, and one very simple action. Infer the animal from the animal persona. Do not attempt to illustrate every ability.

VISUAL STYLE:
A deliberately naive, hand-drawn black-ink doodle resembling a quick drawing made with a slightly blunt felt-tip pen. Use irregular, gently wobbling outlines with rounded ends and subtly inconsistent line thickness. It must feel spontaneous, imperfect, playful, and human-made, not like clean vector art.

CHARACTER DESIGN:
* One immediately recognizable full-body animal
* Extremely simplified anatomy, short rounded limbs, oversized body, and a tiny minimally detailed face
* Tiny dot eyes and a simple mouth
* Expressive, slightly awkward pose
* Mostly white interior with sparse solid-black accents
* At most one small functional prop, only if essential to the professional behavior
* Capable and focused, yet harmless, odd, and endearing

COMPOSITION:
One isolated character, fully visible from head to tail, centered on a plain warm-white background with generous empty space. Front-facing or slight three-quarter view. Compact, logo-like, square 1:1 composition.

STRICT CONSTRAINTS:
Black ink only. No color. No gray. No shading. No gradients. No shadows. No textures. No realistic fur. No detailed anatomy. No decorative background. No frame. No scenery. Absolutely no readable text or text-like marks: no letters, words, numbers, labels, diagrams, interface marks, speech bubbles, logo, signature, or watermark anywhere in the image. Use the animal's pose rather than written labels to communicate its work. No polished vector curves. No anime. No Disney-like style. No 3D rendering. Do not copy an existing character, pose, or composition. Do not make the linework symmetrical or mechanically perfect.

The final image must look like a charming, slightly clumsy doodle drawn in under one minute while remaining recognizable as both the chosen animal and the owner's core professional personality.`;
}

export function readyProfileImage(current: Record<string, unknown> | undefined): ProfileImageMetadata | undefined {
  if (!current || !current.profileImage || typeof current.profileImage !== "object") return undefined;
  const image = current.profileImage as Partial<ProfileImageMetadata>;
  if (image.status !== "READY" || image.versionId !== current.versionId) return undefined;
  if (!image.thumbnailKey || !image.detailKey || !image.sourceHash || !image.updatedAt) return undefined;
  return image as ProfileImageMetadata;
}

export function profileImageUrl(current: Record<string, unknown> | undefined, origin: string, variant: ProfileImageVariant): string | undefined {
  const image = readyProfileImage(current);
  const slug = typeof current?.publicSlug === "string" ? current.publicSlug : "";
  if (!image || !slug) return undefined;
  return `${origin.replace(/\/$/, "")}/profile-images/${encodeURIComponent(slug)}/${variant}.webp?v=${encodeURIComponent(image.sourceHash.slice(0, PROFILE_IMAGE_REVISION_LENGTH))}`;
}

export function profileImageRevision(current: Record<string, unknown> | undefined): string | undefined {
  return readyProfileImage(current)?.sourceHash.slice(0, PROFILE_IMAGE_REVISION_LENGTH);
}

export function profileImagePresentation(current: Record<string, unknown> | undefined, origin: string): {
  status: ProfileImageStatus;
  revision?: string;
  thumbnail_url?: string;
  detail_url?: string;
} {
  const ready = readyProfileImage(current);
  if (ready) {
    return {
      status: "ready",
      revision: ready.sourceHash.slice(0, PROFILE_IMAGE_REVISION_LENGTH),
      thumbnail_url: profileImageUrl(current, origin, "thumbnail"),
      detail_url: profileImageUrl(current, origin, "detail"),
    };
  }
  const image = current?.profileImage as Partial<ProfileImageMetadata> | undefined;
  if (image?.status === "FAILED" && image.versionId === current?.versionId) return { status: "failed" };
  return { status: "pending" };
}

export function profileSocialImageUrl(current: Record<string, unknown> | undefined, origin: string): string | undefined {
  const slug = typeof current?.publicSlug === "string" ? current.publicSlug : "";
  const versionId = typeof current?.versionId === "string" ? current.versionId : "";
  const revision = profileImageRevision(current);
  if (!slug || !versionId || !revision) return undefined;
  const url = new URL(`/og/profile/${encodeURIComponent(slug)}.png`, origin.replace(/\/$/, ""));
  url.searchParams.set("version", versionId);
  url.searchParams.set("image", revision);
  return url.toString();
}
