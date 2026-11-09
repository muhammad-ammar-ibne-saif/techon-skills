/**
 * Lives outside the "use client" screens so the student jobs page, a server component, can read
 * it. Next turns a client file's exports into references the server can't call or iterate.
 */
export const CAREER_TABS = [
  { key: "for-you", label: "For you" },
  { key: "applications", label: "Applications" },
  { key: "invites", label: "Invites" },
  { key: "interviews", label: "Interviews" },
  { key: "practice", label: "Interview practice" },
] as const
export type CareerTab = (typeof CAREER_TABS)[number]["key"]
