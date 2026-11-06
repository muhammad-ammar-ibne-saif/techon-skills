"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@apollo/client/react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/helpers"
import { GET_ACTIVE_POPUP } from "@/lib/graphql"
import { siteButton } from "@/lib/ui/useable-components/site-chrome/ui"

export type SitePopupData = {
  id: string
  title: string
  text: string
  images: string[]
  buttonLabel: string
  buttonUrl: string
  updatedAt: string
}

/** Which popup version this browser has already seen (editing a popup shows it again). */
const SEEN_KEY = "techon.site-popup.seen"
const SHOW_AFTER_MS = 1500
const SLIDE_EVERY_MS = 5000
/** Pages where a popup would get in the way. */
const QUIET_PATHS = ["/enrollment"]

/** Swipeable image slider with arrows and dots; slides on its own unless reduced motion is on. */
export function ImageSlider({ images, alt, className }: { images: string[]; alt: string; className?: string }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const many = images.length > 1

  const goTo = (i: number) => {
    const el = track.current
    if (!el) return
    const next = (i + images.length) % images.length
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" })
  }

  useEffect(() => {
    if (!many || paused) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = window.setInterval(() => {
      const el = track.current
      if (!el) return
      const current = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
      const next = (current + 1) % images.length
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" })
    }, SLIDE_EVERY_MS)
    return () => window.clearInterval(t)
  }, [many, paused, images.length])

  if (!images.length) return null
  return (
    <div
      className={cn("group/slider bg-muted relative overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={track}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget
          setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
        }}
        aria-roledescription="carousel"
      >
        {images.map((src, i) => (
          <div key={`${src}-${i}`} className="h-full w-full shrink-0 snap-center" aria-roledescription="slide" aria-label={`${i + 1} of ${images.length}`}>
            <img src={src} alt={i === 0 ? alt : ""} className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} draggable={false} />
          </div>
        ))}
      </div>
      {many && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => goTo(index - 1)}
            className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover/slider:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => goTo(index + 1)}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover/slider:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRightIcon className="size-4" />
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={cn("h-1.5 rounded-full bg-white/60 transition-all", i === index ? "w-5 bg-white" : "w-1.5")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** The popup's button: pages on this site open in place, other https links in a new tab. */
export function PopupButton({ label, url, onClick, className }: { label: string; url: string; onClick?: () => void; className?: string }) {
  const content = (
    <>
      {label} <ArrowRightIcon className="size-4" aria-hidden />
    </>
  )
  if (url.startsWith("/"))
    return (
      <Link href={url} onClick={onClick} className={className}>
        {content}
      </Link>
    )
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
      {content}
    </a>
  )
}

/** Banner, text and button; shared by the website popup and the admin preview. */
export function SitePopupBody({ popup, onAction }: { popup: Pick<SitePopupData, "title" | "text" | "images" | "buttonLabel" | "buttonUrl">; onAction?: () => void }) {
  return (
    <>
      <ImageSlider images={popup.images} alt={popup.title} className="aspect-video w-full" />
      <div className="space-y-3 p-6">
        <h2 className={cn("text-balance text-2xl font-semibold tracking-tight", !popup.images.length && "pr-8")}>{popup.title}</h2>
        {popup.text && <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">{popup.text}</p>}
        <div className="pt-1">
          <PopupButton label={popup.buttonLabel || "Enroll now"} url={popup.buttonUrl || "/enrollment"} onClick={onAction} className={siteButton.primary} />
        </div>
      </div>
    </>
  )
}

function markSeen(popup: SitePopupData) {
  try {
    window.localStorage.setItem(SEEN_KEY, `${popup.id}:${popup.updatedAt}`)
  } catch {
    /* private mode: it may show again next visit */
  }
}

/** Announcement popup on the public website, set in Admin → Popup & deals. Shown once per version. */
export function SitePopup() {
  const pathname = usePathname()
  const { data } = useQuery<{ getActivePopup: SitePopupData | null }>(GET_ACTIVE_POPUP)
  const popup = data?.getActivePopup ?? null
  const [openId, setOpenId] = useState<string | null>(null)
  const quiet = QUIET_PATHS.some((p) => pathname?.startsWith(p))

  useEffect(() => {
    if (!popup || quiet) return
    const t = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem(SEEN_KEY) === `${popup.id}:${popup.updatedAt}`) return
      } catch {
        /* show it */
      }
      setOpenId(popup.id)
    }, SHOW_AFTER_MS)
    return () => window.clearTimeout(t)
  }, [popup, quiet])

  if (!popup) return null
  const close = () => {
    markSeen(popup)
    setOpenId(null)
  }

  return (
    <DialogPrimitive.Root open={openId === popup.id} onOpenChange={(o) => !o && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 bg-background fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border shadow-2xl"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{popup.title}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65"
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
          <SitePopupBody popup={popup} onAction={close} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
