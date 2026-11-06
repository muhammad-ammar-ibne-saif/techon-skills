"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useLazyQuery, useMutation } from "@apollo/client/react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Loader2Icon, RotateCcwIcon, XIcon } from "lucide-react"

import { GET_RECORDING_PLAYBACK, SAVE_RECORDING_PROGRESS } from "@/lib/graphql"
import { formatClock } from "./clock"
import { RecordingQuestions } from "./questions"

export { formatClock }

/** How often progress is saved while playing. */
const SAVE_EVERY_MS = 15_000

type Props = {
  /** Recording to play; null closes the player. */
  recordingId: string | null
  title: string
  /** Where to resume, in seconds (the student's saved progress). */
  startAt?: number | null
  onClose: () => void
}

/**
 * Plays a recording through the portal's streaming URL (never the Drive link). The URL is
 * short-lived and the server re-checks access on every request, so locked students stop
 * being able to watch immediately. Where the viewer is gets saved as they watch, so they can
 * continue later.
 */
export function RecordingPlayerDialog({ recordingId, title, startAt, onClose }: Props) {
  const [loadPlayback, { data, loading, error }] = useLazyQuery<{
    getRecordingPlayback: { url: string; mimeType: string; expiresAt: string }
  }>(GET_RECORDING_PLAYBACK, { fetchPolicy: "network-only" })

  useEffect(() => {
    if (recordingId) void loadPlayback({ variables: { id: recordingId } })
  }, [recordingId, loadPlayback])

  const playback = recordingId ? data?.getRecordingPlayback : undefined
  // The stream URL that failed to load (e.g. Drive blocked it); a new URL clears it.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const failed = !!playback && failedUrl === playback.url

  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSavedAt = useRef(0)
  const [resumedFrom, setResumedFrom] = useState<number | null>(null)
  const [saveProgress] = useMutation(SAVE_RECORDING_PROGRESS)

  const save = useCallback(
    (force = false) => {
      const v = videoRef.current
      if (!v || !recordingId || !Number.isFinite(v.currentTime) || v.currentTime <= 0) return
      if (!force && Date.now() - lastSavedAt.current < SAVE_EVERY_MS) return
      lastSavedAt.current = Date.now()
      const durationSeconds = Number.isFinite(v.duration) ? v.duration : null
      saveProgress({ variables: { recordingId, positionSeconds: v.currentTime, durationSeconds } }).catch(() => {
        // Progress is a convenience; never interrupt playback over it.
      })
    },
    [recordingId, saveProgress]
  )

  const resume = () => {
    const v = videoRef.current
    setResumedFrom(null)
    // Not worth resuming in the last few seconds; start again instead.
    if (v && startAt && startAt > 5 && (!Number.isFinite(v.duration) || startAt < v.duration - 10)) {
      v.currentTime = startAt
      setResumedFrom(startAt)
    }
  }

  // The "continued from" note fades after a few seconds.
  useEffect(() => {
    if (resumedFrom == null) return
    const t = window.setTimeout(() => setResumedFrom(null), 8000)
    return () => window.clearTimeout(t)
  }, [resumedFrom])

  const close = () => {
    save(true)
    onClose()
  }

  return (
    <DialogPrimitive.Root open={!!recordingId} onOpenChange={(open) => !open && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-black shadow-2xl outline-none">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-background px-4 py-3">
            <DialogPrimitive.Title className="truncate text-sm font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="text-muted-foreground hover:text-primary rounded-full p-1" aria-label="Close">
              <XIcon className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <div className="relative aspect-video w-full bg-black">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80">
                <Loader2Icon className="size-8 animate-spin" />
              </div>
            )}
            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/90">
                {error.message}
              </div>
            )}
            {failed && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/90">
                This recording can&apos;t be played right now. Staff: use &quot;Check Drive access&quot; on the recordings page
                to see why.
              </div>
            )}
            {playback && !loading && !failed && (
              <video
                key={playback.url}
                ref={videoRef}
                src={playback.url}
                onError={() => setFailedUrl(playback.url)}
                onLoadedMetadata={resume}
                onTimeUpdate={() => save()}
                onPause={() => save(true)}
                onEnded={() => save(true)}
                className="size-full"
                controls
                autoPlay
                playsInline
                preload="metadata"
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
              >
                Your browser can&apos;t play this video.
              </video>
            )}
            {resumedFrom != null && !failed && (
              <button
                type="button"
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = 0
                  setResumedFrom(null)
                }}
                className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur hover:bg-black/85"
              >
                <RotateCcwIcon className="size-3.5" />
                Continued from {formatClock(resumedFrom)} · Start over
              </button>
            )}
          </div>
          {recordingId && playback && !error && <RecordingQuestions recordingId={recordingId} videoRef={videoRef} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
