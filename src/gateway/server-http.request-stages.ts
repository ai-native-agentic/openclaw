import type { IncomingMessage, ServerResponse } from "node:http";
import { loadConfig } from "../config/config.js";
import type { AuthRateLimiter } from "./auth-rate-limit.js";
import {
  authorizeHttpGatewayConnect,
  isLocalDirectRequest,
  type ResolvedGatewayAuth,
} from "./auth.js";
import { getBearerToken } from "./http-utils.js";
import { enforcePluginRouteGatewayAuth } from "./server/http-auth.js";
import {
  isProtectedPluginRoutePathFromContext,
  resolvePluginRoutePathContext,
  type PluginHttpRequestHandler,
  type PluginRoutePathContext,
} from "./server/plugins-http.js";
import type { ReadinessChecker } from "./server/readiness.js";

export type GatewayHttpRequestStage = {
  name: string;
  run: () => Promise<boolean> | boolean;
};

const GATEWAY_PROBE_STATUS_BY_PATH = new Map<string, "live" | "ready">([
  ["/health", "live"],
  ["/healthz", "live"],
  ["/ready", "ready"],
  ["/readyz", "ready"],
]);
const MATTERMOST_SLASH_CALLBACK_PATH = "/api/channels/mattermost/command";

export function resolveMattermostSlashCallbackPaths(
  configSnapshot: ReturnType<typeof loadConfig>,
): Set<string> {
  const callbackPaths = new Set<string>([MATTERMOST_SLASH_CALLBACK_PATH]);
  const isMattermostCommandCallbackPath = (path: string): boolean =>
    path === MATTERMOST_SLASH_CALLBACK_PATH || path.startsWith("/api/channels/mattermost/");

  const normalizeCallbackPath = (value: unknown): string => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed) {
      return MATTERMOST_SLASH_CALLBACK_PATH;
    }
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  };

  const tryAddCallbackUrlPath = (rawUrl: unknown) => {
    if (typeof rawUrl !== "string") {
      return;
    }
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      return;
    }
    try {
      const pathname = new URL(trimmed).pathname;
      if (pathname && isMattermostCommandCallbackPath(pathname)) {
        callbackPaths.add(pathname);
      }
    } catch {
      // Ignore invalid callback URLs in config and keep default path behavior.
    }
  };

  const mmRaw = configSnapshot.channels?.mattermost as Record<string, unknown> | undefined;
  const addMmCommands = (raw: unknown) => {
    if (raw == null || typeof raw !== "object") {
      return;
    }
    const commands = raw as Record<string, unknown>;
    const callbackPath = normalizeCallbackPath(commands.callbackPath);
    if (isMattermostCommandCallbackPath(callbackPath)) {
      callbackPaths.add(callbackPath);
    }
    tryAddCallbackUrlPath(commands.callbackUrl);
  };

  addMmCommands(mmRaw?.commands);
  const accountsRaw = (mmRaw?.accounts ?? {}) as Record<string, unknown>;
  for (const accountId of Object.keys(accountsRaw)) {
    const accountCfg = accountsRaw[accountId] as Record<string, unknown> | undefined;
    addMmCommands(accountCfg?.commands);
  }

  return callbackPaths;
}

function shouldEnforceDefaultPluginGatewayAuth(pathContext: PluginRoutePathContext): boolean {
  return (
    pathContext.malformedEncoding ||
    pathContext.decodePassLimitReached ||
    isProtectedPluginRoutePathFromContext(pathContext)
  );
}

async function canRevealReadinessDetails(params: {
  req: IncomingMessage;
  resolvedAuth: ResolvedGatewayAuth;
  trustedProxies: string[];
  allowRealIpFallback: boolean;
}): Promise<boolean> {
  if (isLocalDirectRequest(params.req, params.trustedProxies, params.allowRealIpFallback)) {
    return true;
  }
  if (params.resolvedAuth.mode === "none") {
    return false;
  }

  const bearerToken = getBearerToken(params.req);
  const authResult = await authorizeHttpGatewayConnect({
    auth: params.resolvedAuth,
    connectAuth: bearerToken ? { token: bearerToken, password: bearerToken } : null,
    req: params.req,
    trustedProxies: params.trustedProxies,
    allowRealIpFallback: params.allowRealIpFallback,
  });
  return authResult.ok;
}

export async function handleGatewayProbeRequest(
  req: IncomingMessage,
  res: ServerResponse,
  requestPath: string,
  resolvedAuth: ResolvedGatewayAuth,
  trustedProxies: string[],
  allowRealIpFallback: boolean,
  getReadiness?: ReadinessChecker,
): Promise<boolean> {
  const status = GATEWAY_PROBE_STATUS_BY_PATH.get(requestPath);
  if (!status) {
    return false;
  }

  const method = (req.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Method Not Allowed");
    return true;
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  let statusCode: number;
  let body: string;
  if (status === "ready" && getReadiness) {
    const includeDetails = await canRevealReadinessDetails({
      req,
      resolvedAuth,
      trustedProxies,
      allowRealIpFallback,
    });
    try {
      const result = getReadiness();
      statusCode = result.ready ? 200 : 503;
      body = JSON.stringify(includeDetails ? result : { ready: result.ready });
    } catch {
      statusCode = 503;
      body = JSON.stringify(
        includeDetails ? { ready: false, failing: ["internal"], uptimeMs: 0 } : { ready: false },
      );
    }
  } else {
    statusCode = 200;
    body = JSON.stringify({ ok: true, status });
  }
  res.statusCode = statusCode;
  res.end(method === "HEAD" ? undefined : body);
  return true;
}

export async function runGatewayHttpRequestStages(
  stages: readonly GatewayHttpRequestStage[],
): Promise<boolean> {
  for (const stage of stages) {
    if (await stage.run()) {
      return true;
    }
  }
  return false;
}

export function buildPluginRequestStages(params: {
  req: IncomingMessage;
  res: ServerResponse;
  requestPath: string;
  mattermostSlashCallbackPaths: ReadonlySet<string>;
  pluginPathContext: PluginRoutePathContext | null;
  handlePluginRequest?: PluginHttpRequestHandler;
  shouldEnforcePluginGatewayAuth?: (pathContext: PluginRoutePathContext) => boolean;
  resolvedAuth: ResolvedGatewayAuth;
  trustedProxies: string[];
  allowRealIpFallback: boolean;
  rateLimiter?: AuthRateLimiter;
}): GatewayHttpRequestStage[] {
  if (!params.handlePluginRequest) {
    return [];
  }
  let pluginGatewayAuthSatisfied = false;
  return [
    {
      name: "plugin-auth",
      run: async () => {
        if (params.mattermostSlashCallbackPaths.has(params.requestPath)) {
          return false;
        }
        const pathContext =
          params.pluginPathContext ?? resolvePluginRoutePathContext(params.requestPath);
        if (
          !(params.shouldEnforcePluginGatewayAuth ?? shouldEnforceDefaultPluginGatewayAuth)(
            pathContext,
          )
        ) {
          return false;
        }
        const pluginAuthOk = await enforcePluginRouteGatewayAuth({
          req: params.req,
          res: params.res,
          auth: params.resolvedAuth,
          trustedProxies: params.trustedProxies,
          allowRealIpFallback: params.allowRealIpFallback,
          rateLimiter: params.rateLimiter,
        });
        if (!pluginAuthOk) {
          return true;
        }
        pluginGatewayAuthSatisfied = true;
        return false;
      },
    },
    {
      name: "plugin-http",
      run: () => {
        const pathContext =
          params.pluginPathContext ?? resolvePluginRoutePathContext(params.requestPath);
        return (
          params.handlePluginRequest?.(params.req, params.res, pathContext, {
            gatewayAuthSatisfied: pluginGatewayAuthSatisfied,
          }) ?? false
        );
      },
    },
  ];
}
