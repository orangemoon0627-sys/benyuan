import { NextResponse } from "next/server";
import { BenyuanAuthError, getCurrentAuthSession } from "@/lib/benyuan-auth";
import { updateAuthUserProfile } from "@/lib/benyuan-v3-store";
import type { BenyuanUserGender, BenyuanUserProfilePatch } from "@/lib/benyuan-v3-types";

const ALLOWED_AVATAR_SYMBOLS = new Set([
  "moon.stars.fill",
  "sparkles",
  "circle.hexagongrid.fill",
  "scope",
  "sun.max.fill",
  "circle.dashed.inset.filled",
]);
const ALLOWED_GENDERS = new Set<BenyuanUserGender>(["female", "male", "nonbinary", "undisclosed"]);
const PROFILE_PLACEHOLDER_NAMES = new Set(["Apple 用户", "微信用户", "手机用户", "访客", "我的本源档案"]);

function normalizeOptionalString(value: unknown, maximumLength: number) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length > maximumLength) return null;
  return cleaned;
}

export async function GET(request: Request) {
  try {
    const auth = await getCurrentAuthSession(request);
    return NextResponse.json({
      user: auth.user,
      session: auth.session,
    });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getCurrentAuthSession(request);
    const body = await request.json().catch(() => ({}));

    const displayName = normalizeOptionalString(body.display_name, 32);
    const avatarSymbol = normalizeOptionalString(body.avatar_symbol, 64);
    const profileBio = normalizeOptionalString(body.profile_bio, 80);
    const hasPatchField =
      body.display_name !== undefined ||
      body.avatar_symbol !== undefined ||
      body.birth_year !== undefined ||
      body.gender !== undefined ||
      body.profile_bio !== undefined;

    if (!hasPatchField || displayName === null || avatarSymbol === null || profileBio === null) {
      return NextResponse.json({ error: "invalid_profile_payload" }, { status: 400 });
    }
    if (body.display_name !== undefined && (!displayName || displayName.length > 32 || PROFILE_PLACEHOLDER_NAMES.has(displayName))) {
      return NextResponse.json({ error: "invalid_profile_payload" }, { status: 400 });
    }
    if (avatarSymbol !== undefined && !ALLOWED_AVATAR_SYMBOLS.has(avatarSymbol)) {
      return NextResponse.json({ error: "invalid_profile_payload" }, { status: 400 });
    }

    let birthYear: number | null | undefined;
    if (body.birth_year !== undefined) {
      if (body.birth_year === null) {
        birthYear = null;
      } else {
        const value = Number(body.birth_year);
        const currentYear = new Date().getUTCFullYear();
        if (!Number.isInteger(value) || value < 1900 || value > currentYear) {
          return NextResponse.json({ error: "invalid_profile_payload" }, { status: 400 });
        }
        birthYear = value;
      }
    }

    let gender: BenyuanUserGender | undefined;
    if (body.gender !== undefined) {
      if (typeof body.gender !== "string" || !ALLOWED_GENDERS.has(body.gender as BenyuanUserGender)) {
        return NextResponse.json({ error: "invalid_profile_payload" }, { status: 400 });
      }
      gender = body.gender as BenyuanUserGender;
    }

    const patch: BenyuanUserProfilePatch = {
      ...(displayName !== undefined ? { display_name: displayName } : {}),
      ...(avatarSymbol !== undefined ? { avatar_symbol: avatarSymbol } : {}),
      ...(birthYear !== undefined ? { birth_year: birthYear } : {}),
      ...(gender !== undefined ? { gender } : {}),
      ...(profileBio !== undefined ? { profile_bio: profileBio } : {}),
    };

    const user = await updateAuthUserProfile(auth.user.user_id, patch);
    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
      session: auth.session,
    });
  } catch (error) {
    if (error instanceof BenyuanAuthError) {
      return NextResponse.json({ error: error.code }, { status: error.status });
    }
    throw error;
  }
}
