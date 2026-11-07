import * as Sentry from "@sentry/nextjs"

import { privateDataCollection, scrubEvent, sentryEnvironment } from "@/lib/helpers/sentry-options"

// Server error reports. Off unless SENTRY_DSN (or NEXT_PUBLIC_SENTRY_DSN) is set.
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

export async function register() {
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: sentryEnvironment,
    dataCollection: { ...privateDataCollection, httpBodies: [] },
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
  })
}

export const onRequestError: typeof Sentry.captureRequestError = (...args) => {
  if (dsn) Sentry.captureRequestError(...args)
}
