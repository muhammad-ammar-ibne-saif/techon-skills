import * as Sentry from "@sentry/nextjs"

import { privateDataCollection, scrubEvent, sentryEnvironment, stripQuery } from "@/lib/helpers/sentry-options"

// Browser error reports. Off unless NEXT_PUBLIC_SENTRY_DSN is set.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: sentryEnvironment,
    dataCollection: { ...privateDataCollection, httpBodies: [] },
    tracesSampleRate: 0,
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb(crumb) {
      // Typed text and console output can hold personal data.
      if (crumb.category === "ui.input" || crumb.category === "console") return null
      if (crumb.data) for (const k of ["url", "from", "to"]) if (k in crumb.data) crumb.data[k] = stripQuery(crumb.data[k])
      return crumb
    },
  })
}

export const onRouterTransitionStart = dsn ? Sentry.captureRouterTransitionStart : undefined
