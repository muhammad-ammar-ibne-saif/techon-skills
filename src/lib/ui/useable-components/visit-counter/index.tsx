"use client"

import { useEffect } from "react"
import { useMutation } from "@apollo/client/react"

import { RECORD_VISIT } from "@/lib/graphql"

const KEY = "tos-visit-counted"

/** Counts one visit per browser session for the staff funnel. Sends nothing about the visitor. */
export function VisitCounter() {
  const [record] = useMutation(RECORD_VISIT)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) return
      sessionStorage.setItem(KEY, "1")
    } catch {
      // Storage blocked (private mode, strict settings): skip rather than count every page.
      return
    }
    record().catch(() => {})
  }, [record])
  return null
}
