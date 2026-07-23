export type BenyuanInternalAccessDecision =
  | { allowed: true; reason: "development" | "authorized" }
  | { allowed: false; status: 401 | 404; reason: "missing_configuration" | "invalid_authorization" };

function constantTimeEqual(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;

  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return mismatch === 0;
}

function decodeBasicCredentials(value: string) {
  try {
    const decoded = globalThis.atob(value);
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

function readPresentedToken(authorization: string | null | undefined) {
  if (!authorization) return null;

  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  if (bearer) return bearer[1].trim();

  const basic = authorization.match(/^Basic\s+(.+)$/i);
  if (!basic) return null;
  const credentials = decodeBasicCredentials(basic[1].trim());
  if (!credentials || credentials.username !== "benyuan") return null;
  return credentials.password;
}

export function evaluateBenyuanInternalAccess(input: {
  nodeEnv?: string;
  configuredToken?: string;
  authorization?: string | null;
}): BenyuanInternalAccessDecision {
  if (input.nodeEnv !== "production") {
    return { allowed: true, reason: "development" };
  }

  const configuredToken = input.configuredToken?.trim();
  if (!configuredToken) {
    return { allowed: false, status: 404, reason: "missing_configuration" };
  }

  const presentedToken = readPresentedToken(input.authorization);
  if (!presentedToken || !constantTimeEqual(presentedToken, configuredToken)) {
    return { allowed: false, status: 401, reason: "invalid_authorization" };
  }

  return { allowed: true, reason: "authorized" };
}
