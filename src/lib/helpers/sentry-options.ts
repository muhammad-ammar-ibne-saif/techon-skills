/**
 * Shared Sentry settings for the browser and the server. Error reports only (no tracing, no
 * session replay) and nothing personal: no user details, cookies, headers, bodies, and no query
 * strings, since some links carry sign-in tokens.
 */
type SentryLikeEvent = {
  request?: { url?: string; headers?: unknown; cookies?: unknown; data?: unknown; query_string?: unknown }
  user?: { id?: string | number } | null
  breadcrumbs?: { data?: Record<string, unknown> }[]
}

/** Drops ?query and #hash from a URL-ish string. */
export function stripQuery(value: unknown): unknown {
  if (typeof value !== "string") return value
  const cut = value.search(/[?#]/)
  return cut === -1 ? value : value.slice(0, cut)
}

export function scrubEvent<T extends SentryLikeEvent>(event: T): T {
  if (event.request) {
    delete event.request.headers
    delete event.request.cookies
    delete event.request.data
    delete event.request.query_string
    event.request.url = stripQuery(event.request.url) as string | undefined
  }
  if (event.user) event.user = event.user.id != null ? { id: event.user.id } : null
  for (const b of event.breadcrumbs ?? []) {
    if (!b.data) continue
    for (const k of ["url", "from", "to"]) if (k in b.data) b.data[k] = stripQuery(b.data[k])
  }
  return event
}

export const sentryEnvironment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || "production"

/** Collect nothing personal (user info, cookies, headers, bodies, query strings, variables). */
export const privateDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: true, variables: false },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
} as const satisfies Record<string, unknown>
