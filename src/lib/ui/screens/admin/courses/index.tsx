"use client"

import { useState, useCallback, useEffect } from "react"
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  BookOpenIcon,
  Loader2Icon,
  Trash2Icon,
  PencilIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  LayoutGridIcon,
  BanknoteIcon,
  CpuIcon,
  FileImageIcon,
  ListChecksIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/lib/ui/useable-components/button"
import { Card, CardContent } from "@/lib/ui/useable-components/card"
import { Input } from "@/lib/ui/useable-components/input"
import { apiService } from "@/lib/services"
import { GET_COURSES, GET_COURSE, DELETE_COURSE, CREATE_COURSE, UPDATE_COURSE, REORDER_COURSES } from "@/lib/graphql"
import { ImageUpload } from "@/lib/ui/useable-components/image-upload"
import { ConfirmDialog } from "@/lib/ui/useable-components/confirm-dialog"
import { cn } from "@/lib/helpers"

type CourseRow = { id: string; title: string; slug: string; subtitle?: string; totalFee?: number; feePerMonth?: number; courseDurationInMonths?: number }

type TechnologyItem = { label: string; description: string; logo: string }
type ArticleFeatureItem = { name: string; description: string; image: string }

const STEPS = [
  { id: 1, label: "Basics", description: "Title, slug, subtitle", icon: LayoutGridIcon },
  { id: 2, label: "Pricing & duration", description: "Fees and hero", icon: BanknoteIcon },
  { id: 3, label: "Technologies", description: "Tools & logos", icon: CpuIcon },
  { id: 4, label: "Article features", description: "Highlights", icon: FileImageIcon },
  { id: 5, label: "Review", description: "Confirm & create", icon: ListChecksIcon },
] as const

const TOTAL_STEPS = STEPS.length

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

const defaultTech: TechnologyItem = { label: "", description: "", logo: "" }
const defaultArticle: ArticleFeatureItem = { name: "", description: "", image: "" }

const initialForm = {
  title: "",
  slug: "",
  subtitle: "",
  subDescription: "",
  heroDescription: "",
  courseDurationInMonths: 6,
  feePerMonth: 0,
  totalFee: 0,
  totalNumberOfInstallments: 6,
  currency: "PKR",
  technologies: [] as TechnologyItem[],
  articleFeatures: [] as ArticleFeatureItem[],
}

export const AdminCoursesScreen = () => {
  const { data, loading, error, refetch } = useQuery<{ getCourses: CourseRow[] }>(GET_COURSES)
  const [deleteCourse, { loading: deleting }] = useMutation(DELETE_COURSE, {
    onCompleted: () => { toast.success("Course deleted"); refetch() },
    onError: (e) => toast.error(e.message),
  })
  const [createCourse, { loading: creating }] = useMutation(CREATE_COURSE, {
    onCompleted: () => { toast.success("Course created"); setAddOpen(false); resetForm(); refetch() },
    onError: (e) => toast.error(e.message),
  })
  const [updateCourse, { loading: updating }] = useMutation(UPDATE_COURSE, {
    onCompleted: () => { toast.success("Course updated"); setAddOpen(false); resetForm(); setEditingId(null); refetch() },
    onError: (e) => toast.error(e.message),
  })
  const [reorderCourses, { loading: reordering }] = useMutation(REORDER_COURSES, {
    onCompleted: () => { toast.success("Course order saved"); refetch() },
    onError: (e) => toast.error(e.message),
  })
  const [loadCourseForEdit, { data: editCourseData }] = useLazyQuery<{
    getCourse: {
      id: string
      title: string
      slug: string
      heroDescription: string
      subtitle: string
      subDescription: string
      totalFee: number
      feePerMonth: number
      courseDurationInMonths: number
      totalNumberOfInstallments: number
      currency: string
      technologies: TechnologyItem[]
      articleFeatures: ArticleFeatureItem[]
    } | null
  }>(GET_COURSE)

  const courses = data?.getCourses ?? []
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string } | null>(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [techLogoFiles, setTechLogoFiles] = useState<Record<number, File>>({})
  const [articleImageFiles, setArticleImageFiles] = useState<Record<number, File>>({})

  const resetForm = useCallback(() => {
    setForm(initialForm)
    setStep(1)
    setTechLogoFiles({})
    setArticleImageFiles({})
  }, [])

  useEffect(() => {
    const c = editCourseData?.getCourse
    if (!c || !editingId) return
    setForm({
      title: c.title,
      slug: c.slug,
      subtitle: c.subtitle,
      subDescription: c.subDescription,
      heroDescription: c.heroDescription,
      courseDurationInMonths: c.courseDurationInMonths,
      feePerMonth: c.feePerMonth,
      totalFee: c.totalFee,
      totalNumberOfInstallments: c.totalNumberOfInstallments,
      currency: c.currency,
      technologies: c.technologies?.length ? c.technologies.map((t) => ({ ...t })) : [{ ...defaultTech }],
      articleFeatures: c.articleFeatures?.length ? c.articleFeatures.map((a) => ({ ...a })) : [{ ...defaultArticle }],
    })
    setStep(1)
  }, [editCourseData, editingId])

  const openEdit = (id: string) => {
    setEditingId(id)
    setAddOpen(true)
    void loadCourseForEdit({ variables: { id } })
  }

  /** Swaps a course with its neighbour; the list order is what students and visitors see. */
  const moveCourse = (index: number, delta: -1 | 1) => {
    const ids = courses.map((c) => c.id)
    const target = index + delta
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderCourses({ variables: { ids } })
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ id })
  }
  const onConfirmDelete = () => {
    if (deleteConfirm) {
      deleteCourse({ variables: { input: { id: deleteConfirm.id } } })
      setDeleteConfirm(null)
    }
  }

  const setTitle = (title: string) => {
    setForm((f) => ({ ...f, title, slug: f.slug || slugify(title) }))
  }
  const setSlug = (slug: string) => setForm((f) => ({ ...f, slug }))

  const addTechnology = () => setForm((f) => ({ ...f, technologies: [...f.technologies, { ...defaultTech }] }))
  const removeTechnology = (i: number) => setForm((f) => ({ ...f, technologies: f.technologies.filter((_, idx) => idx !== i) }))
  const updateTechnology = (i: number, field: keyof TechnologyItem, value: string) => {
    setForm((f) => ({
      ...f,
      technologies: f.technologies.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)),
    }))
  }

  const addArticleFeature = () => setForm((f) => ({ ...f, articleFeatures: [...f.articleFeatures, { ...defaultArticle }] }))
  const removeArticleFeature = (i: number) => setForm((f) => ({ ...f, articleFeatures: f.articleFeatures.filter((_, idx) => idx !== i) }))
  const updateArticleFeature = (i: number, field: keyof ArticleFeatureItem, value: string) => {
    setForm((f) => ({
      ...f,
      articleFeatures: f.articleFeatures.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)),
    }))
  }

  const canNext = () => {
    if (step === 1) return form.title.trim() && form.slug.trim() && form.subtitle.trim() && form.subDescription.trim()
    if (step === 2) return form.heroDescription.trim() && form.courseDurationInMonths > 0 && form.totalFee >= 0
    if (step === 3) return form.technologies.length > 0 && form.technologies.every((t, i) => t.label.trim() && t.description.trim() && (t.logo.trim() || techLogoFiles[i]))
    if (step === 4) return form.articleFeatures.length > 0 && form.articleFeatures.every((a, i) => a.name.trim() && a.description.trim() && (a.image.trim() || articleImageFiles[i]))
    return true
  }

  const handleCreate = async () => {
    if (!canNext() && step < 5) return
    const techPayload: { label: string; description: string; logo: string }[] = []
    for (let i = 0; i < form.technologies.length; i++) {
      const t = form.technologies[i]
      let logo = t.logo.trim()
      if (techLogoFiles[i]) {
        const res = await apiService.uploadImage(techLogoFiles[i], "courses", form.slug.trim() || undefined)
        if (!res.success || !res.data?.url) { toast.error("Failed to upload technology logo"); return }
        logo = res.data.url
      }
      techPayload.push({ label: t.label.trim(), description: t.description.trim(), logo })
    }
    const articlePayload: { name: string; description: string; image: string }[] = []
    for (let i = 0; i < form.articleFeatures.length; i++) {
      const a = form.articleFeatures[i]
      let image = a.image.trim()
      if (articleImageFiles[i]) {
        const res = await apiService.uploadImage(articleImageFiles[i], "courses", form.slug.trim() || undefined)
        if (!res.success || !res.data?.url) { toast.error("Failed to upload feature image"); return }
        image = res.data.url
      }
      articlePayload.push({ name: a.name.trim(), description: a.description.trim(), image })
    }
    const input = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      subtitle: form.subtitle.trim(),
      subDescription: form.subDescription.trim(),
      heroDescription: form.heroDescription.trim(),
      courseDurationInMonths: form.courseDurationInMonths,
      feePerMonth: form.feePerMonth,
      totalFee: form.totalFee,
      totalNumberOfInstallments: form.totalNumberOfInstallments,
      currency: form.currency.trim() || "PKR",
      technologies: techPayload,
      articleFeatures: articlePayload,
    }
    if (editingId) {
      updateCourse({ variables: { input: { id: editingId, ...input } } })
    } else {
      createCourse({ variables: { input } })
    }
  }

  return (
    <div className="w-full py-10 animate-in fade-in duration-700">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-secondary">Admin</div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Courses</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-pretty">
            Manage the course catalog. Use the arrows to set the order courses appear in on the website and student portal.
          </p>
        </div>
        <Button variant="brand-secondary" shape="pill" className="gap-2 shrink-0" onClick={() => { setEditingId(null); resetForm(); setAddOpen(true) }}>
          <PlusIcon className="size-4" />
          Add course
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2Icon className="size-6 animate-spin" />
          <span>Loading courses...</span>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-destructive">Failed to load courses.</p>
        </div>
      ) : (
        <Card className="bg-background/70 backdrop-blur rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted-surface/40">
                  <tr>
                    <th className="p-4 font-semibold">Order</th>
                    <th className="p-4 font-semibold">Course</th>
                    <th className="p-4 font-semibold">Slug</th>
                    <th className="p-4 font-semibold">Duration</th>
                    <th className="p-4 font-semibold">Fee</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c, i) => (
                    <tr key={c.id} className="border-b transition-colors hover:bg-muted-surface/20">
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground w-5 text-xs tabular-nums">{i + 1}</span>
                          <Button variant="ghost" size="icon" title="Move up" aria-label={`Move ${c.title} up`} disabled={i === 0 || reordering} onClick={() => moveCourse(i, -1)}>
                            <ArrowUpIcon className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Move down" aria-label={`Move ${c.title} down`} disabled={i === courses.length - 1 || reordering} onClick={() => moveCourse(i, 1)}>
                            <ArrowDownIcon className="size-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{c.title}</div>
                        {c.subtitle && <div className="text-muted-foreground text-xs">{c.subtitle}</div>}
                      </td>
                      <td className="p-4 font-mono text-xs">{c.slug}</td>
                      <td className="p-4 text-muted-foreground">{c.courseDurationInMonths != null ? `${c.courseDurationInMonths} mo` : "—"}</td>
                      <td className="p-4">
                        {c.totalFee != null ? `PKR ${c.totalFee.toLocaleString()}` : "—"}
                      </td>
                      <td className="p-4 flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c.id)} title="Edit course">
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)} disabled={deleting}>
                          <Trash2Icon className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {courses.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <BookOpenIcon className="size-12 mx-auto mb-4 opacity-50" />
                <p>No courses yet. Click &quot;Add course&quot; to create one.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete course"
        description="Delete this course? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={onConfirmDelete}
        loading={deleting}
      />

      <DialogPrimitive.Root open={addOpen} onOpenChange={(open) => { if (!open) { setAddOpen(false); setEditingId(null); resetForm(); } }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:fade-out-0" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(36rem,calc(100vw-2rem))] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-3xl border bg-background shadow-xl overflow-hidden">
            <div className="shrink-0 border-b px-6 py-4">
              <DialogPrimitive.Title className="text-lg font-semibold">{editingId ? "Edit course" : "Add new course"}</DialogPrimitive.Title>
              <p className="text-muted-foreground text-sm mt-0.5">Step {step} of {TOTAL_STEPS}: {STEPS[step - 1].label}</p>
              <div className="flex gap-1 mt-4">
                {STEPS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                      step === s.id ? "bg-(--brand-primary) text-(--text-on-dark)" : "bg-muted-surface/60 text-muted-foreground hover:bg-muted-surface"
                    )}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title *</label>
                    <Input value={form.title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Full Stack Web Development" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Slug (URL) *</label>
                    <Input value={form.slug} onChange={(e) => setSlug(e.target.value)} placeholder="full-stack-web-development" className="font-mono text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Subtitle *</label>
                    <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="Short tagline for cards" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Sub description *</label>
                    <textarea
                      value={form.subDescription}
                      onChange={(e) => setForm((f) => ({ ...f, subDescription: e.target.value }))}
                      placeholder="Brief description for course card and listing"
                      rows={3}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Currency</label>
                    <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} placeholder="PKR" />
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Hero description *</label>
                    <textarea
                      value={form.heroDescription}
                      onChange={(e) => setForm((f) => ({ ...f, heroDescription: e.target.value }))}
                      placeholder="Main description on course detail page"
                      rows={4}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Duration (months) *</label>
                      <Input type="number" min={1} value={form.courseDurationInMonths} onChange={(e) => setForm((f) => ({ ...f, courseDurationInMonths: Number(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Course fee (total) *</label>
                      <Input type="number" min={0} value={form.totalFee || ""} onChange={(e) => setForm((f) => ({ ...f, totalFee: Number(e.target.value) || 0 }))} placeholder="0" />
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Students pay this in full or in 2 installments. Discounts and custom installments are set per student under Payments → Student fees.
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  <p className="text-muted-foreground text-sm">Technologies shown on the course detail page (label, description, logo).</p>
                  {form.technologies.map((t, i) => (
                    <div key={i} className="rounded-xl border p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">Technology {i + 1}</span>
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeTechnology(i)}>Remove</Button>
                      </div>
                      <Input placeholder="Label (e.g. React)" value={t.label} onChange={(e) => updateTechnology(i, "label", e.target.value)} />
                      <Input placeholder="Description" value={t.description} onChange={(e) => updateTechnology(i, "description", e.target.value)} />
                      <ImageUpload
                        label="Logo"
                        category="courses"
                        subPath={form.slug.trim() || undefined}
                        value={t.logo || undefined}
                        onChange={(url) => updateTechnology(i, "logo", url)}
                        pendingFile={techLogoFiles[i] ?? null}
                        onPendingFileChange={(file) => setTechLogoFiles((prev) => { const next = { ...prev }; if (file) next[i] = file; else delete next[i]; return next; })}
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addTechnology}>
                    <PlusIcon className="size-4" /> Add technology
                  </Button>
                </>
              )}
              {step === 4 && (
                <>
                  <p className="text-muted-foreground text-sm">Article/feature highlights (name, description, image).</p>
                  {form.articleFeatures.map((a, i) => (
                    <div key={i} className="rounded-xl border p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">Feature {i + 1}</span>
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeArticleFeature(i)}>Remove</Button>
                      </div>
                      <Input placeholder="Name" value={a.name} onChange={(e) => updateArticleFeature(i, "name", e.target.value)} />
                      <Input placeholder="Description" value={a.description} onChange={(e) => updateArticleFeature(i, "description", e.target.value)} />
                      <ImageUpload
                        label="Image"
                        category="courses"
                        subPath={form.slug.trim() || undefined}
                        value={a.image || undefined}
                        onChange={(url) => updateArticleFeature(i, "image", url)}
                        pendingFile={articleImageFiles[i] ?? null}
                        onPendingFileChange={(file) => setArticleImageFiles((prev) => { const next = { ...prev }; if (file) next[i] = file; else delete next[i]; return next; })}
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={addArticleFeature}>
                    <PlusIcon className="size-4" /> Add feature
                  </Button>
                </>
              )}
              {step === 5 && (
                <div className="space-y-3 text-sm">
                  <p className="font-medium">{form.title || "—"}</p>
                  <p className="text-muted-foreground">Slug: <span className="font-mono">{form.slug || "—"}</span></p>
                  <p className="text-muted-foreground">{form.subtitle || "—"}</p>
                  <p className="text-muted-foreground">{form.currency} {form.totalFee?.toLocaleString()} total (full or 2 installments) · {form.courseDurationInMonths} months</p>
                  <p className="text-muted-foreground">{form.technologies.length} technologies · {form.articleFeatures.length} article features</p>
                </div>
              )}
            </div>
            <div className="shrink-0 border-t flex justify-between gap-2 px-6 py-4">
              <div>
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="gap-1">
                    <ChevronLeftIcon className="size-4" /> Previous
                  </Button>
                ) : (
                  <DialogPrimitive.Close asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogPrimitive.Close>
                )}
              </div>
              {step < TOTAL_STEPS ? (
                <Button type="button" variant="brand-secondary" onClick={() => setStep(step + 1)} disabled={!canNext()} className="gap-1">
                  Next <ChevronRightIcon className="size-4" />
                </Button>
              ) : (
                <Button type="button" variant="brand-secondary" onClick={handleCreate} disabled={creating || updating || !canNext()} className="gap-1">
                  {(creating || updating) ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
                  {editingId ? "Save changes" : "Create course"}
                </Button>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
