"use client"

import { useEffect, useState } from "react"
import { useLazyQuery } from "@apollo/client/react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Loader2Icon, XIcon } from "lucide-react"

import { GET_RECORDING_PLAYBACK } from "@/lib/graphql"

type Props = {
  /** Recording to play; null closes the player. */
  recordingId: string | null
  title: string
  onClose: () => void
}

/**
 * Plays a recording through the portal's streaming URL (never the Drive link). The URL is
 * short-lived and the server re-checks access on every request, so locked students stop
 * being able to watch immediately.
 */
export function RecordingPlayerDialog({ recordingId, title, onClose }: Props) {
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

  return (
    <DialogPrimitive.Root open={!!recordingId} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(64rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-black shadow-2xl outline-none">
          <div className="flex items-center justify-between gap-3 bg-background px-4 py-3">
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
                src={playback.url}
                onError={() => setFailedUrl(playback.url)}
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
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
