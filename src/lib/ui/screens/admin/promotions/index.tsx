"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import toast from "react-hot-toast"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ImagePlusIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/useable-components/card"
import { ConfirmDialog } from "@/lib/ui/useable-components/confirm-dialog"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { SitePopupBody } from "@/lib/ui/useable-components/site-popup"
import { DealCard, type DealData } from "@/lib/ui/screens/public/landing/deals"
import {
  CREATE_DEAL,
  CREATE_SITE_POPUP,
  DELETE_DEAL,
  DELETE_SITE_POPUP,
  GET_COUPONS,
  GET_COURSES,
  GET_DEALS,
  GET_SITE_POPUPS,
  REORDER_DEALS,
  UPDATE_DEAL,
  UPDATE_SITE_POPUP,
} from "@/lib/graphql"
import { cn } from "@/lib/helpers"
import { apiService } from "@/lib/services/api"

const MAX_POPUP_IMAGES = 8

type Popup = {
  id: string
  title: string
  text: string
  images: string[]
  buttonLabel: string
  buttonUrl: string
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  updatedAt: string
}

type Deal = DealData & {
  courseIds: string[]
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  displayOrder: number
}

/** Today in Pakistan time, as YYYY-MM-DD (popup and deal dates are whole days there). */
const todayInPakistan = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" })

function statusOf(item: { isActive: boolean; startsAt: string | null; endsAt: string | null }) {
  const today = todayInPakistan()
  if (!item.isActive) return { label: "Off", className: "bg-muted text-muted-foreground" }
  if (item.endsAt && item.endsAt < today) return { label: "Ended", className: "bg-muted text-muted-foreground" }
  if (item.startsAt && item.startsAt > today) return { label: `Starts ${item.startsAt}`, className: "bg-sky-500/15 text-sky-700 dark:text-sky-400" }
  return { label: "Live", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" }
}

function StatusPill({ item }: { item: { isActive: boolean; startsAt: string | null; endsAt: string | null } }) {
  const s = statusOf(item)
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", s.className)}>{s.label}</span>
}

const dates = (item: { startsAt: string | null; endsAt: string | null }) =>
  item.startsAt || item.endsAt ? `${item.startsAt ?? "now"} → ${item.endsAt ?? "no end"}` : "No end date"

/** Uploads picked images to storage and returns their URLs (skips ones that fail). */
async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name} isn't an image`)
      continue
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${file.name} is over 5 MB`)
      continue
    }
    try {
      const res = await apiService.uploadImage(file, "promotions")
      if (res.success && res.data?.url) urls.push(res.data.url)
      else toast.error(`Couldn't upload ${file.name}`)
    } catch {
      toast.error(`Couldn't upload ${file.name}`)
    }
  }
  return urls
}

function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-muted-foreground block text-xs">{hint}</span>}
    </label>
  )
}

// ---------------------------------------------------------------- Popup

type PopupForm = {
  title: string
  text: string
  images: string[]
  buttonLabel: string
  buttonUrl: string
  isActive: boolean
  startsAt: string
  endsAt: string
}

const emptyPopup: PopupForm = {
  title: "",
  text: "",
  images: [],
  buttonLabel: "Enroll now",
  buttonUrl: "/enrollment",
  isActive: true,
  startsAt: "",
  endsAt: "",
}

function PopupEditor({ initial, editingId, onDone }: { initial: PopupForm; editingId: string | null; onDone: () => void }) {
  const [form, setForm] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const [create, { loading: creating }] = useMutation(CREATE_SITE_POPUP)
  const [update, { loading: updating }] = useMutation(UPDATE_SITE_POPUP)
  const saving = creating || updating

  const addImages = async (files: FileList | null) => {
    const list = Array.from(files ?? []).slice(0, MAX_POPUP_IMAGES - form.images.length)
    if (!list.length) return
    setUploading(true)
    const urls = await uploadImages(list)
    setUploading(false)
    if (urls.length) setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, MAX_POPUP_IMAGES) }))
  }
  const moveImage = (i: number, by: number) =>
    setForm((f) => {
      const images = [...f.images]
      const j = i + by
      if (j < 0 || j >= images.length) return f
      ;[images[i], images[j]] = [images[j]!, images[i]!]
      return { ...f, images }
    })

  const save = async () => {
    if (!form.title.trim()) return toast.error("Add a title")
    const input = {
      title: form.title.trim(),
      text: form.text.trim(),
      images: form.images,
      buttonLabel: form.buttonLabel.trim(),
      buttonUrl: form.buttonUrl.trim(),
      isActive: form.isActive,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    }
    try {
      if (editingId) await update({ variables: { id: editingId, input } })
      else await create({ variables: { input } })
      toast.success(editingId ? "Popup saved" : "Popup created")
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the popup")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <Field label="Title *">
          <Input value={form.title} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="New course: AI Bootcamp" />
        </Field>
        <Field label="Text">
          <Textarea
            value={form.text}
            maxLength={1000}
            rows={4}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            placeholder="Starts 1 December. 30% off for the first 20 students."
          />
        </Field>
        <div className="space-y-2">
          <div className="text-sm font-medium">Banner images</div>
          <p className="text-muted-foreground text-xs">
            Wide images work best (16:9, e.g. 1200×675). Add several to make a slider, up to {MAX_POPUP_IMAGES}.
          </p>
          <div className="flex flex-wrap gap-2">
            {form.images.map((src, i) => (
              <div key={`${src}-${i}`} className="relative w-36 overflow-hidden rounded-lg border">
                <img src={src} alt="" className="aspect-video w-full object-cover" />
                <div className="flex justify-between bg-background/90 px-1 py-0.5">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Move left" disabled={i === 0} onClick={() => moveImage(i, -1)}>
                    <ArrowLeftIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove image"
                    className="text-destructive"
                    onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, k) => k !== i) }))}
                  >
                    <XIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move right"
                    disabled={i === form.images.length - 1}
                    onClick={() => moveImage(i, 1)}
                  >
                    <ArrowRightIcon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {form.images.length < MAX_POPUP_IMAGES && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className="text-muted-foreground hover:bg-muted/50 flex aspect-video w-36 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs"
              >
                {uploading ? <Loader2Icon className="size-5 animate-spin" /> : <ImagePlusIcon className="size-5" />}
                {uploading ? "Uploading…" : "Add images"}
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                void addImages(e.target.files)
                e.target.value = ""
              }}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Button text">
            <Input value={form.buttonLabel} maxLength={40} onChange={(e) => setForm((f) => ({ ...f, buttonLabel: e.target.value }))} />
          </Field>
          <Field label="Button link" hint="A page like /enrollment or /courses/web-development, or a full https:// link.">
            <Input value={form.buttonUrl} maxLength={500} onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))} />
          </Field>
          <Field label="Show from" hint="Empty = right away.">
            <Input type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
          </Field>
          <Field label="Show until" hint="Empty = until you turn it off.">
            <Input type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          Active
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onDone} disabled={saving}>
            Cancel
          </Button>
          <Button variant="brand-secondary" onClick={() => void save()} disabled={saving || uploading}>
            {saving && <Loader2Icon className="size-4 animate-spin" />} {editingId ? "Save popup" : "Create popup"}
          </Button>
        </div>
      </div>
      <div>
        <div className="text-muted-foreground mb-2 text-xs font-medium">Preview</div>
        <div className="bg-background overflow-hidden rounded-2xl border shadow-lg">
          <SitePopupBody
            popup={{
              title: form.title || "Your title",
              text: form.text,
              images: form.images,
              buttonLabel: form.buttonLabel || "Enroll now",
              buttonUrl: "#",
            }}
          />
        </div>
      </div>
    </div>
  )
}

function PopupSection() {
  const { data, loading, refetch } = useQuery<{ getSitePopups: Popup[] }>(GET_SITE_POPUPS, { fetchPolicy: "network-only" })
  const [remove] = useMutation(DELETE_SITE_POPUP)
  const [editing, setEditing] = useState<{ id: string | null; form: PopupForm; key: number } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const popups = data?.getSitePopups ?? []
  const live = popups.find((p) => statusOf(p).label === "Live")

  const openEditor = (p: Popup | null) =>
    setEditing({
      id: p?.id ?? null,
      key: Date.now(),
      form: p
        ? {
            title: p.title,
            text: p.text,
            images: p.images,
            buttonLabel: p.buttonLabel,
            buttonUrl: p.buttonUrl,
            isActive: p.isActive,
            startsAt: p.startsAt ?? "",
            endsAt: p.endsAt ?? "",
          }
        : emptyPopup,
    })

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Website popup</CardTitle>
          <CardDescription>
            Shown once to each visitor on the public website (again after you edit it). If several are live, the most recently saved one shows.
          </CardDescription>
        </div>
        {!editing && (
          <Button variant="brand-secondary" size="sm" onClick={() => openEditor(null)}>
            <PlusIcon className="size-4" /> New popup
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing && (
          <div className="rounded-xl border p-4">
            <PopupEditor
              key={editing.key}
              initial={editing.form}
              editingId={editing.id}
              onDone={() => {
                setEditing(null)
                void refetch()
              }}
            />
          </div>
        )}
        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2Icon className="size-4 animate-spin" /> Loading…
          </div>
        ) : popups.length === 0 ? (
          <p className="text-muted-foreground text-sm">No popups yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {popups.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                {p.images[0] ? (
                  <img src={p.images[0]} alt="" className="aspect-video w-20 rounded object-cover" />
                ) : (
                  <div className="bg-muted aspect-video w-20 rounded" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{p.title}</span>
                    <StatusPill item={p} />
                    {live?.id === p.id && <span className="text-muted-foreground text-xs">showing now</span>}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {p.images.length} image{p.images.length === 1 ? "" : "s"} · {dates(p)} · button → {p.buttonUrl}
                  </div>
                </div>
                <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditor(p)}>
                  <PencilIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Delete" className="text-destructive" onClick={() => setDeleteId(p.id)}>
                  <Trash2Icon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete popup"
        description="This removes the popup from the website. It can't be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          const id = deleteId
          setDeleteId(null)
          if (!id) return
          remove({ variables: { id } })
            .then(() => {
              toast.success("Popup deleted")
              void refetch()
            })
            .catch((e) => toast.error(e.message))
        }}
      />
    </Card>
  )
}

// ---------------------------------------------------------------- Deals

type DealForm = {
  title: string
  description: string
  image: string
  badge: string
  courseIds: string[]
  couponCode: string
  originalPrice: string
  dealPrice: string
  currency: string
  buttonLabel: string
  isActive: boolean
  startsAt: string
  endsAt: string
}

const emptyDeal: DealForm = {
  title: "",
  description: "",
  image: "",
  badge: "",
  courseIds: [],
  couponCode: "",
  originalPrice: "",
  dealPrice: "",
  currency: "PKR",
  buttonLabel: "Grab the deal",
  isActive: true,
  startsAt: "",
  endsAt: "",
}

const toInt = (s: string) => (s.trim() === "" ? null : Math.round(Number(s)))

function DealEditor({ initial, editingId, onDone }: { initial: DealForm; editingId: string | null; onDone: () => void }) {
  const [form, setForm] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const { data: coursesData } = useQuery<{ getCourses: { id: string; title: string; slug: string; totalFee: number; currency: string }[] }>(GET_COURSES)
  const { data: couponsData } = useQuery<{ getCoupons: { id: string; code: string; label: string; isActive: boolean }[] }>(GET_COUPONS)
  const [create, { loading: creating }] = useMutation(CREATE_DEAL)
  const [update, { loading: updating }] = useMutation(UPDATE_DEAL)
  const saving = creating || updating
  const courses = coursesData?.getCourses ?? []
  const coupons = (couponsData?.getCoupons ?? []).filter((c) => c.isActive || c.code === form.couponCode)

  const toggleCourse = (id: string) =>
    setForm((f) => ({ ...f, courseIds: f.courseIds.includes(id) ? f.courseIds.filter((x) => x !== id) : [...f.courseIds, id] }))

  const pickImage = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    const [url] = await uploadImages([file])
    setUploading(false)
    if (url) setForm((f) => ({ ...f, image: url }))
  }

  const save = async () => {
    if (!form.title.trim()) return toast.error("Add a title")
    const input = {
      title: form.title.trim(),
      description: form.description.trim(),
      image: form.image,
      badge: form.badge.trim(),
      courseIds: form.courseIds,
      couponCode: form.couponCode,
      originalPrice: toInt(form.originalPrice),
      dealPrice: toInt(form.dealPrice),
      currency: form.currency.trim() || "PKR",
      buttonLabel: form.buttonLabel.trim(),
      isActive: form.isActive,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
    }
    try {
      if (editingId) await update({ variables: { id: editingId, input } })
      else await create({ variables: { input } })
      toast.success(editingId ? "Deal saved" : "Deal created")
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the deal")
    }
  }

  const picked = courses.filter((c) => form.courseIds.includes(c.id))
  const preview: DealData = {
    id: "preview",
    title: form.title || "Your deal",
    description: form.description,
    image: form.image,
    badge: form.badge,
    courses: picked.map((c) => ({ id: c.id, title: c.title, slug: c.slug })),
    couponCode: form.couponCode,
    originalPrice: toInt(form.originalPrice),
    dealPrice: toInt(form.dealPrice),
    currency: form.currency || "PKR",
    buttonLabel: form.buttonLabel,
    endsAtTime: null,
    enrollUrl: "#",
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <Field label="Title *">
            <Input value={form.title} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Eid offer on Web Development" />
          </Field>
          <Field label="Ribbon" hint='e.g. "30% OFF"'>
            <Input value={form.badge} maxLength={30} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={form.description} maxLength={600} rows={3} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <div className="space-y-2">
          <div className="text-sm font-medium">Image</div>
          <div className="flex items-center gap-3">
            {form.image ? (
              <div className="relative w-40 overflow-hidden rounded-lg border">
                <img src={form.image} alt="" className="aspect-video w-full object-cover" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove image"
                  className="bg-background/80 absolute top-1 right-1"
                  onClick={() => setForm((f) => ({ ...f, image: "" }))}
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            ) : null}
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
              {uploading ? <Loader2Icon className="size-4 animate-spin" /> : <ImagePlusIcon className="size-4" />}
              {form.image ? "Change image" : "Upload image"}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void pickImage(e.target.files?.[0])
                e.target.value = ""
              }}
            />
          </div>
          <p className="text-muted-foreground text-xs">Optional, 16:9 works best. Without one the card shows a colour band.</p>
        </div>
        <div className="space-y-1.5">
          <div className="text-sm font-medium">Courses</div>
          <p className="text-muted-foreground text-xs">Picked courses are selected on the enrollment form when someone takes the deal.</p>
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <label
                key={c.id}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                  form.courseIds.includes(c.id) && "border-(--brand-primary) bg-(--brand-primary)/10"
                )}
              >
                <input type="checkbox" className="sr-only" checked={form.courseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} />
                {c.title}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coupon code" hint="Filled into the enrollment form. Create codes under Coupons & referrals.">
            <select
              value={form.couponCode}
              onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value }))}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value="">No code</option>
              {coupons.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code}
                  {c.label ? ` · ${c.label}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Button text">
            <Input value={form.buttonLabel} maxLength={40} onChange={(e) => setForm((f) => ({ ...f, buttonLabel: e.target.value }))} />
          </Field>
          <Field label="Original price" hint="Optional, shown crossed out.">
            <Input type="number" min={0} value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))} />
          </Field>
          <Field label="Deal price" hint="Optional. 0 shows as Free.">
            <Input type="number" min={0} value={form.dealPrice} onChange={(e) => setForm((f) => ({ ...f, dealPrice: e.target.value }))} />
          </Field>
          <Field label="Starts" hint="Empty = right away.">
            <Input type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
          </Field>
          <Field label="Ends" hint="Shows a countdown. Empty = no end.">
            <Input type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          Active
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onDone} disabled={saving}>
            Cancel
          </Button>
          <Button variant="brand-secondary" onClick={() => void save()} disabled={saving || uploading}>
            {saving && <Loader2Icon className="size-4 animate-spin" />} {editingId ? "Save deal" : "Create deal"}
          </Button>
        </div>
      </div>
      <div>
        <div className="text-muted-foreground mb-2 text-xs font-medium">Preview</div>
        <DealCard deal={preview} now={0} />
      </div>
    </div>
  )
}

function DealsSection() {
  const { data, loading, refetch } = useQuery<{ getDeals: Deal[] }>(GET_DEALS, { fetchPolicy: "network-only" })
  const [remove] = useMutation(DELETE_DEAL)
  const [reorder, { loading: reordering }] = useMutation(REORDER_DEALS)
  const [editing, setEditing] = useState<{ id: string | null; form: DealForm; key: number } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const deals = data?.getDeals ?? []

  const openEditor = (d: Deal | null) =>
    setEditing({
      id: d?.id ?? null,
      key: Date.now(),
      form: d
        ? {
            title: d.title,
            description: d.description,
            image: d.image,
            badge: d.badge,
            courseIds: d.courseIds,
            couponCode: d.couponCode,
            originalPrice: d.originalPrice == null ? "" : String(d.originalPrice),
            dealPrice: d.dealPrice == null ? "" : String(d.dealPrice),
            currency: d.currency,
            buttonLabel: d.buttonLabel,
            isActive: d.isActive,
            startsAt: d.startsAt ?? "",
            endsAt: d.endsAt ?? "",
          }
        : emptyDeal,
    })

  const move = (i: number, by: number) => {
    const ids = deals.map((d) => d.id)
    const j = i + by
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j]!, ids[i]!]
    reorder({ variables: { ids } })
      .then(() => void refetch())
      .catch((e) => toast.error(e.message))
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Deals on the home page</CardTitle>
          <CardDescription>Live deals show in a &quot;Deals running now&quot; section near the top of the home page, in this order.</CardDescription>
        </div>
        {!editing && (
          <Button variant="brand-secondary" size="sm" onClick={() => openEditor(null)}>
            <PlusIcon className="size-4" /> New deal
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing && (
          <div className="rounded-xl border p-4">
            <DealEditor
              key={editing.key}
              initial={editing.form}
              editingId={editing.id}
              onDone={() => {
                setEditing(null)
                void refetch()
              }}
            />
          </div>
        )}
        {loading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2Icon className="size-4 animate-spin" /> Loading…
          </div>
        ) : deals.length === 0 ? (
          <p className="text-muted-foreground text-sm">No deals yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {deals.map((d, i) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <div className="flex flex-col">
                  <Button variant="ghost" size="icon-sm" aria-label={`Move ${d.title} up`} disabled={i === 0 || reordering} onClick={() => move(i, -1)}>
                    <ArrowUpIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Move ${d.title} down`}
                    disabled={i === deals.length - 1 || reordering}
                    onClick={() => move(i, 1)}
                  >
                    <ArrowDownIcon className="size-3.5" />
                  </Button>
                </div>
                {d.image ? <img src={d.image} alt="" className="aspect-video w-20 rounded object-cover" /> : <div className="bg-muted aspect-video w-20 rounded" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{d.title}</span>
                    {d.badge && <span className="rounded bg-(--brand-primary)/15 px-1.5 py-0.5 font-mono text-[10px]">{d.badge}</span>}
                    <StatusPill item={d} />
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {dates(d)}
                    {d.couponCode ? ` · code ${d.couponCode}` : ""}
                    {d.courses.length ? ` · ${d.courses.map((c) => c.title).join(", ")}` : ""}
                  </div>
                </div>
                <Button variant="ghost" size="icon" title="Edit" onClick={() => openEditor(d)}>
                  <PencilIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Delete" className="text-destructive" onClick={() => setDeleteId(d.id)}>
                  <Trash2Icon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete deal"
        description="This removes the deal from the home page. It can't be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          const id = deleteId
          setDeleteId(null)
          if (!id) return
          remove({ variables: { id } })
            .then(() => {
              toast.success("Deal deleted")
              void refetch()
            })
            .catch((e) => toast.error(e.message))
        }}
      />
    </Card>
  )
}

/** Admin: the website popup (with an image slider) and the home page deals. */
export const AdminPromotionsScreen = () => (
  <div className="w-full space-y-6 py-10">
    <div>
      <div className="text-secondary text-sm font-semibold">Promotions</div>
      <h1 className="text-3xl font-semibold tracking-tight">Popup & deals</h1>
      <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
        Announce new courses and offers on the public website. To make a course free, edit it under Courses and tick &quot;Free course&quot;.
      </p>
    </div>
    <PopupSection />
    <DealsSection />
  </div>
)
