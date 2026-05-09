import { randomBytes, createHash, createHmac, webcrypto } from "node:crypto";
import {
  createBenyuanAuthId,
  findUserByProviderSubject,
  getAuthRateLimit,
  getAuthSessionByToken,
  getPhoneOtp,
  revokeAuthSession,
  saveAuthRateLimit,
  saveAuthUserAndSession,
  savePhoneOtp,
} from "@/lib/benyuan-v3-store";
import type { BenyuanAuthProvider, BenyuanAuthSession, BenyuanUser } from "@/lib/benyuan-v3-types";

export type BenyuanAuthContext = {
  user: BenyuanUser;
  session: BenyuanAuthSession;
};

type AuthProviderCapability = {
  provider: BenyuanAuthProvider;
  enabled: boolean;
  status: "ready" | "reserved";
  actions: string[];
};

type AppleJWK = JsonWebKey & {
  kid?: string;
  alg?: string;
};

type AppleIdentityClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  sub?: string;
  email?: string;
};

type AppleIdentityVerification = {
  subject: string;
  claims: AppleIdentityClaims;
};

type SmsProvider = {
  name: "webhook" | "aliyun";
  sendOtp(input: { phone: string; code: string; expiresAt: string }): Promise<void>;
};

type WechatTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  openid?: string;
  scope?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

export class BenyuanAuthError extends Error {
  constructor(
    public code: string,
    public status = 401,
  ) {
    super(code);
  }
}

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
const DEFAULT_APPLE_CLIENT_ID = "com.fanhao.benyuan.origin.shell";
const WECHAT_ACCESS_TOKEN_URL = "https://api.weixin.qq.com/sns/oauth2/access_token";
let appleJwksCache: { expiresAt: number; keys: AppleJWK[] } | undefined;

function nowIso() {
  return new Date().toISOString();
}

function clientIpFromRequest(request?: Request) {
  if (!request) return "server";
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function createSessionToken(provider: BenyuanAuthProvider) {
  return `bya_${provider}_${randomBytes(24).toString("base64url")}`;
}

function providerSubject(provider: BenyuanAuthProvider, source?: string) {
  const seed = source && source.trim().length > 0 ? source.trim() : randomBytes(12).toString("base64url");
  return `${provider}:${createHash("sha256").update(seed).digest("hex").slice(0, 28)}`;
}

function updateUserProvider(user: BenyuanUser, provider: BenyuanAuthProvider, providerSubjectValue: string, options?: { displayName?: string }) {
  return {
    ...user,
    updated_at: nowIso(),
    display_name: user.display_name ?? options?.displayName,
    providers: {
      ...user.providers,
      [provider]: providerSubjectValue,
    },
    phone_bound: provider === "phone" ? true : user.phone_bound,
    wechat_bound: provider === "wechat" ? true : user.wechat_bound,
  };
}

function allowFixtureAuth() {
  return process.env.BENYUAN_AUTH_ALLOW_FIXTURE === "1";
}

function allowPhoneFixtureAuth() {
  return process.env.BENYUAN_AUTH_ALLOW_PHONE_FIXTURE === "1";
}

function allowWechatFixtureAuth() {
  return process.env.BENYUAN_AUTH_ALLOW_WECHAT_FIXTURE === "1";
}

function isWechatAuthReady() {
  return allowWechatFixtureAuth() || Boolean(process.env.BENYUAN_WECHAT_APP_ID?.trim() && process.env.BENYUAN_WECHAT_APP_SECRET?.trim());
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmacSha256Hex(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function percentCode(value: string) {
  return encodeURIComponent(value).replace(/[!*'()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildCanonicalFormBody(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${percentCode(key)}=${percentCode(value)}`)
    .join("&");
}

async function sendAliyunSmsOtp(input: { phone: string; code: string }) {
  const accessKeyId = process.env.BENYUAN_ALIYUN_SMS_ACCESS_KEY_ID?.trim();
  const accessKeySecret = process.env.BENYUAN_ALIYUN_SMS_ACCESS_KEY_SECRET?.trim();
  const signName = process.env.BENYUAN_ALIYUN_SMS_SIGN_NAME?.trim();
  const templateCode = process.env.BENYUAN_ALIYUN_SMS_TEMPLATE_CODE?.trim();
  if (!accessKeyId || !accessKeySecret || !signName || !templateCode) {
    throw new BenyuanAuthError("sms_provider_not_configured", 503);
  }

  const endpoint = process.env.BENYUAN_ALIYUN_SMS_ENDPOINT?.trim() || "https://dysmsapi.aliyuncs.com";
  const endpointUrl = new URL(endpoint);
  const body = buildCanonicalFormBody({
    PhoneNumbers: input.phone,
    SignName: signName,
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify({ code: input.code }),
  });
  const contentHash = sha256Hex(body);
  const nonce = randomBytes(16).toString("hex");
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const headers: Record<string, string> = {
    host: endpointUrl.host,
    "x-acs-action": "SendSms",
    "x-acs-content-sha256": contentHash,
    "x-acs-date": date,
    "x-acs-signature-nonce": nonce,
    "x-acs-version": "2017-05-25",
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.entries(headers)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value.trim()}\n`)
    .join("");
  const canonicalRequest = ["POST", "/", "", canonicalHeaders, signedHeaders, contentHash].join("\n");
  const stringToSign = `ACS3-HMAC-SHA256\n${sha256Hex(canonicalRequest)}`;
  const signature = hmacSha256Hex(accessKeySecret, stringToSign);
  const authorization = `ACS3-HMAC-SHA256 Credential=${accessKeyId},SignedHeaders=${signedHeaders},Signature=${signature}`;

  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      ...headers,
      authorization,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as { Code?: string; Message?: string };
  if (!response.ok || payload.Code !== "OK") {
    throw new BenyuanAuthError("sms_provider_failed", 502);
  }
}

function resolveSmsProvider(): SmsProvider | undefined {
  const provider = process.env.BENYUAN_SMS_PROVIDER?.trim().toLowerCase();
  if (!provider) return undefined;
  if (provider === "aliyun") {
    const hasAliyunConfig = Boolean(
      process.env.BENYUAN_ALIYUN_SMS_ACCESS_KEY_ID?.trim() &&
        process.env.BENYUAN_ALIYUN_SMS_ACCESS_KEY_SECRET?.trim() &&
        process.env.BENYUAN_ALIYUN_SMS_SIGN_NAME?.trim() &&
        process.env.BENYUAN_ALIYUN_SMS_TEMPLATE_CODE?.trim(),
    );
    if (!hasAliyunConfig) return undefined;
    return {
      name: "aliyun",
      async sendOtp(input) {
        await sendAliyunSmsOtp({ phone: input.phone, code: input.code });
      },
    };
  }
  if (provider !== "webhook") return undefined;

  const webhookUrl = process.env.BENYUAN_SMS_WEBHOOK_URL?.trim();
  if (!webhookUrl) return undefined;

  return {
    name: "webhook",
    async sendOtp(input) {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(process.env.BENYUAN_SMS_WEBHOOK_TOKEN ? { authorization: `Bearer ${process.env.BENYUAN_SMS_WEBHOOK_TOKEN}` } : {}),
        },
        body: JSON.stringify({
          phone: input.phone,
          code: input.code,
          expires_at: input.expiresAt,
          app: "benyuan",
        }),
      });
      if (!response.ok) {
        throw new BenyuanAuthError("sms_provider_failed", 502);
      }
    },
  };
}

function isPhoneAuthReady() {
  return allowPhoneFixtureAuth() || Boolean(resolveSmsProvider());
}

function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s-]/g, "");
}

function validatePhone(phone: string) {
  return /^\+\d{8,15}$/.test(phone);
}

function hashPhoneCode(phone: string, code: string) {
  const secret = process.env.BENYUAN_AUTH_PHONE_SECRET ?? "benyuan-phone-dev-secret";
  return createHash("sha256").update(`${phone}:${code}:${secret}`).digest("hex");
}

export async function checkAuthRateLimit(input: { key: string; limit?: number; windowMs?: number }) {
  const limit = input.limit ?? Number(process.env.BENYUAN_AUTH_RATE_LIMIT_MAX ?? 5);
  const windowMs = input.windowMs ?? Number(process.env.BENYUAN_AUTH_RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000);
  const timestamp = nowIso();
  const existing = await getAuthRateLimit(input.key);
  const resetAt = existing ? new Date(existing.reset_at).getTime() : 0;
  const next =
    !existing || resetAt <= Date.now()
      ? { key: input.key, count: 1, reset_at: new Date(Date.now() + windowMs).toISOString(), updated_at: timestamp }
      : { ...existing, count: existing.count + 1, updated_at: timestamp };

  await saveAuthRateLimit(next);
  if (next.count > limit) {
    throw new BenyuanAuthError("rate_limited", 429);
  }
  return next;
}

function appleClientIds() {
  const configured = process.env.BENYUAN_APPLE_CLIENT_IDS ?? process.env.BENYUAN_APPLE_CLIENT_ID ?? DEFAULT_APPLE_CLIENT_ID;
  return configured
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="), "base64");
}

function decodeJwtSegment<T>(segment: string): T {
  return JSON.parse(decodeBase64Url(segment).toString("utf8")) as T;
}

async function fetchAppleJwks() {
  if (appleJwksCache && appleJwksCache.expiresAt > Date.now()) {
    return appleJwksCache.keys;
  }

  const response = await fetch(APPLE_JWKS_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new BenyuanAuthError("apple_jwks_unavailable", 503);
  }
  const payload = (await response.json()) as { keys?: AppleJWK[] };
  const keys = payload.keys ?? [];
  appleJwksCache = { keys, expiresAt: Date.now() + 60 * 60 * 1000 };
  return keys;
}

async function verifyJwtSignature(input: { header: { kid?: string; alg?: string }; signingInput: string; signature: Buffer }) {
  if (input.header.alg !== "RS256") {
    throw new BenyuanAuthError("unsupported_apple_identity_alg");
  }

  const key = (await fetchAppleJwks()).find((item) => item.kid === input.header.kid);
  if (!key) {
    throw new BenyuanAuthError("apple_public_key_not_found");
  }

  const cryptoKey = await webcrypto.subtle.importKey("jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await webcrypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, input.signature, Buffer.from(input.signingInput));
  if (!ok) {
    throw new BenyuanAuthError("invalid_apple_identity_signature");
  }
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentityVerification> {
  if (allowFixtureAuth() && identityToken.startsWith("fixture.")) {
    return { subject: `fixture:${createHash("sha256").update(identityToken).digest("hex").slice(0, 28)}`, claims: { sub: identityToken } };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = identityToken.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new BenyuanAuthError("invalid_apple_identity_token");
  }

  let header: { kid?: string; alg?: string };
  let claims: AppleIdentityClaims;
  try {
    header = decodeJwtSegment(encodedHeader);
    claims = decodeJwtSegment(encodedPayload);
  } catch {
    throw new BenyuanAuthError("invalid_apple_identity_token");
  }

  await verifyJwtSignature({
    header,
    signingInput: `${encodedHeader}.${encodedPayload}`,
    signature: decodeBase64Url(encodedSignature),
  });

  if (claims.iss !== APPLE_ISSUER) {
    throw new BenyuanAuthError("invalid_apple_identity_issuer");
  }

  const allowedAudiences = new Set(appleClientIds());
  const audiences = Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
  if (!audiences.some((audience) => allowedAudiences.has(audience))) {
    throw new BenyuanAuthError("invalid_apple_identity_audience");
  }

  if (typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now()) {
    throw new BenyuanAuthError("expired_apple_identity_token");
  }

  if (!claims.sub) {
    throw new BenyuanAuthError("missing_apple_subject");
  }

  return { subject: claims.sub, claims };
}

async function createAuthSession(provider: BenyuanAuthProvider, options?: { subject?: string; displayName?: string }) {
  const timestamp = nowIso();
  const user: BenyuanUser = {
    user_id: createBenyuanAuthId("usr"),
    created_at: timestamp,
    updated_at: timestamp,
    display_name: options?.displayName,
    primary_provider: provider,
    providers: {
      [provider]: providerSubject(provider, options?.subject),
    },
    phone_bound: false,
    wechat_bound: false,
  };
  const session: BenyuanAuthSession = {
    session_id: createBenyuanAuthId("auth"),
    user_id: user.user_id,
    token: createSessionToken(provider),
    provider,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await saveAuthUserAndSession(user, session);
  return { user, session };
}

async function createOrReuseAuthSession(provider: BenyuanAuthProvider, options?: { subject?: string; displayName?: string; existingAuth?: BenyuanAuthContext | null }) {
  const providerSubjectValue = providerSubject(provider, options?.subject);
  if (options?.existingAuth) {
    const user = updateUserProvider(options.existingAuth.user, provider, providerSubjectValue, { displayName: options.displayName });
    return createBoundAuthSession(user, provider);
  }

  const existingUser = await findUserByProviderSubject(provider, providerSubjectValue);
  if (existingUser) {
    return createBoundAuthSession(existingUser, provider);
  }

  const auth = await createAuthSession(provider, {
    subject: options?.subject,
    displayName: options?.displayName,
  });
  const user = updateUserProvider(auth.user, provider, providerSubjectValue, { displayName: options?.displayName });
  await saveAuthUserAndSession(user, auth.session);
  return { user, session: auth.session };
}

async function createPhoneAuthSession(phone: string) {
  const auth = await createOrReuseAuthSession("phone", {
    subject: phone,
    displayName: phone,
  });
  return auth;
}

async function createBoundAuthSession(user: BenyuanUser, provider: BenyuanAuthProvider) {
  const timestamp = nowIso();
  const session: BenyuanAuthSession = {
    session_id: createBenyuanAuthId("auth"),
    user_id: user.user_id,
    token: createSessionToken(provider),
    provider,
    created_at: timestamp,
    updated_at: timestamp,
  };
  await saveAuthUserAndSession(user, session);
  return { user, session };
}

export async function createAnonymousAuthSession() {
  return createAuthSession("anonymous", { displayName: "访客" });
}

export async function createAppleAuthSession(input: { identityToken?: string; authorizationCode?: string; displayName?: string }) {
  const verified = await verifyAppleIdentityToken(input.identityToken ?? "");
  return createOrReuseAuthSession("apple", {
    subject: verified.subject,
    displayName: input.displayName ?? "Apple 用户",
  });
}

async function exchangeWechatCode(code: string): Promise<{ subject: string; openid: string; unionid?: string }> {
  if (allowWechatFixtureAuth() && code.startsWith("fixture.")) {
    const subject = `fixture:${createHash("sha256").update(code).digest("hex").slice(0, 28)}`;
    return { subject, openid: subject, unionid: subject };
  }

  const appid = process.env.BENYUAN_WECHAT_APP_ID?.trim();
  const secret = process.env.BENYUAN_WECHAT_APP_SECRET?.trim();
  if (!appid || !secret) {
    throw new BenyuanAuthError("wechat_not_configured", 503);
  }

  const url = new URL(process.env.BENYUAN_WECHAT_ACCESS_TOKEN_URL?.trim() || WECHAT_ACCESS_TOKEN_URL);
  url.searchParams.set("appid", appid);
  url.searchParams.set("secret", secret);
  url.searchParams.set("code", code);
  url.searchParams.set("grant_type", "authorization_code");
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => ({}))) as WechatTokenResponse;
  if (!response.ok || payload.errcode || !payload.openid) {
    throw new BenyuanAuthError("invalid_wechat_code", 401);
  }
  return { subject: payload.unionid ?? payload.openid, openid: payload.openid, unionid: payload.unionid };
}

export async function createWechatAuthSession(input: { code?: string; displayName?: string; existingAuth?: BenyuanAuthContext | null }) {
  const code = (input.code ?? "").trim();
  if (!code) {
    throw new BenyuanAuthError("missing_wechat_code", 400);
  }
  const verified = await exchangeWechatCode(code);
  return createOrReuseAuthSession("wechat", {
    subject: verified.subject,
    displayName: input.displayName ?? "微信用户",
    existingAuth: input.existingAuth,
  });
}

export async function requestPhoneOtp(input: { phone?: string; request?: Request }) {
  const phone = normalizePhone(input.phone ?? "");
  if (!validatePhone(phone)) {
    throw new BenyuanAuthError("invalid_phone", 400);
  }
  await checkAuthRateLimit({ key: `phone_otp:${phone}` });
  await checkAuthRateLimit({ key: `phone_otp_ip:${clientIpFromRequest(input.request)}`, limit: 20 });

  const smsProvider = resolveSmsProvider();
  if (!allowPhoneFixtureAuth() && !smsProvider) {
    throw new BenyuanAuthError("sms_provider_not_configured", 503);
  }

  const code = allowPhoneFixtureAuth() ? "246810" : String(Math.floor(100000 + Math.random() * 900000));
  const timestamp = nowIso();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  if (!allowPhoneFixtureAuth() && smsProvider) {
    await smsProvider.sendOtp({ phone, code, expiresAt });
  }
  await savePhoneOtp({
    phone,
    code_hash: hashPhoneCode(phone, code),
    created_at: timestamp,
    expires_at: expiresAt,
    attempts: 0,
  });

  return { phone, expires_at: expiresAt, fixture_code: allowPhoneFixtureAuth() ? code : undefined };
}

export async function verifyPhoneOtpAndCreateSession(input: { phone?: string; code?: string }) {
  const phone = normalizePhone(input.phone ?? "");
  const code = (input.code ?? "").trim();
  if (!validatePhone(phone)) {
    throw new BenyuanAuthError("invalid_phone", 400);
  }
  if (!/^\d{4,8}$/.test(code)) {
    throw new BenyuanAuthError("invalid_phone_code", 401);
  }

  const otp = await getPhoneOtp(phone);
  if (!otp || otp.consumed_at || new Date(otp.expires_at).getTime() <= Date.now()) {
    throw new BenyuanAuthError("invalid_phone_code", 401);
  }
  if (otp.attempts >= 5) {
    throw new BenyuanAuthError("phone_code_attempts_exceeded", 429);
  }
  if (otp.code_hash !== hashPhoneCode(phone, code)) {
    await savePhoneOtp({ ...otp, attempts: otp.attempts + 1 });
    throw new BenyuanAuthError("invalid_phone_code", 401);
  }

  await savePhoneOtp({ ...otp, consumed_at: nowIso(), attempts: otp.attempts + 1 });
  return createPhoneAuthSession(phone);
}

export async function readAuthFromRequest(request: Request): Promise<BenyuanAuthContext | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return (await getAuthSessionByToken(match[1].trim())) ?? null;
}

export async function getCurrentAuthSession(request: Request) {
  const auth = await readAuthFromRequest(request);
  if (!auth) {
    throw new BenyuanAuthError("auth_required", 401);
  }
  return auth;
}

export async function logoutAuthSession(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new BenyuanAuthError("auth_required", 401);
  }
  const revoked = await revokeAuthSession(match[1].trim());
  if (!revoked) {
    throw new BenyuanAuthError("auth_required", 401);
  }
  return { ok: true };
}

export async function assertPart1Owner(request: Request, part1: { user_id: string }) {
  const auth = await readAuthFromRequest(request);
  if (!auth) return { ok: true as const, auth };
  if (auth.user.user_id !== part1.user_id) {
    return { ok: false as const, status: 403, error: "part1_forbidden" };
  }
  return { ok: true as const, auth };
}

export function listBenyuanAuthProviders(): { providers: AuthProviderCapability[]; capabilities: string[] } {
  return {
    providers: [
      { provider: "apple", enabled: true, status: "ready", actions: ["login"] },
      { provider: "anonymous", enabled: true, status: "ready", actions: ["login"] },
      { provider: "wechat", enabled: isWechatAuthReady(), status: isWechatAuthReady() ? "ready" : "reserved", actions: ["login", "bind_wechat"] },
      { provider: "phone", enabled: isPhoneAuthReady(), status: isPhoneAuthReady() ? "ready" : "reserved", actions: ["login", "bind_phone"] },
    ],
    capabilities: ["guest_login", "apple_login", "bind_wechat", "bind_phone"],
  };
}
