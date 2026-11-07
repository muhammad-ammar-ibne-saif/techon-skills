"use client"

import { useState } from "react"
import Link from "next/link"
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react"
import {
  BookOpenIcon,
  BriefcaseIcon,
  CheckCircle2Icon,
  CircleIcon,
  Loader2Icon,
  PencilIcon,
  PlayCircleIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import {
  CREATE_CAREER_PATH,
  DELETE_CAREER_PATH,
  GET_CAREER_PATHS,
  GET_MY_LEARNING_PATH,
  GET_SKILL_DEMAND,
  SET_MY_TARGET_PATH,
  UPDATE_CAREER_PATH,
} from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { ConfirmDialog } from "@/lib/ui/useable-components/confirm-dialog"
import { ContentAreaLoader } from "@/lib/ui/useable-components/content-area-loader"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { CONFIG } from "@/utils/constants"
import { EmptyState, Field, Pill, selectClass } from "../jobs/shared"
import { Modal } from "./modal"

/* ------------------------------------------------------------------ types */

export type CareerPath = {
  id: string
  title: string
  slug: string
  description: string
  steps: { skill: string; why: string }[]
  isPublished: boolean
  sortOrder: number
  createdAt: string
  studentsCount?: number | null
}

type LearningStep = {
  skill: string
  why: string
  have: boolean
  openJobs: number
  courses: { id: string; title: string; slug: string; teaches: string[]; enrolled: boolean }[]
  lessons: { id: string; title: string; courseId: string; courseTitle: string; kind: "CONTENT" | "RECORDING" }[]
}

type LearningPath = { done: number; total: number; nextSkill: string | null; path: CareerPath; steps: LearningStep[] }

const MAX_STEPS = 20

/* ================================================================== student */

function PathPicker({ paths, current, onPick, busy }: { paths: CareerPath[]; current?: string; onPick: (id: string) => void; busy: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {paths.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={busy}
          onClick={() => onPick(p.id)}
          className={cn(
            "bg-card hover:border-foreground/30 rounded-xl border p-4 text-left transition-colors disabled:opacity-60",
            current === p.id && "border-(--site-accent)"
          )}
        >
          <p className="font-semibold">{p.title}</p>
          {p.description && <p className="text-muted-foreground mt-1 line-clamp-3 text-sm">{p.description}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.steps.slice(0, 6).map((s) => (
              <Pill key={s.skill}>{s.skill}</Pill>
            ))}
            {p.steps.length > 6 && <Pill>+{p.steps.length - 6} more</Pill>}
          </div>
        </button>
      ))}
    </div>
  )
}

function StepItem({ step, index, isNext }: { step: LearningStep; index: number; isNext: boolean }) {
  const [open, setOpen] = useState(isNext)
  const hasDetail = step.lessons.length > 0 || step.courses.length > 0 || step.openJobs > 0
  return (
    <li className={cn("bg-card rounded-xl border p-4", isNext && "border-(--site-accent) ring-1 ring-(--site-accent)/30")}>
      <div className="flex items-start gap-3">
        {step.have ? (
          <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-label="You have this skill" />
        ) : (
          <CircleIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-label="Still to learn" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs">Step {index + 1}</span>
            <p className="font-semibold">{step.skill}</p>
            {isNext && <Pill className="bg-(--site-accent)/12 text-(--site-accent)">Learn next</Pill>}
            {step.have && <Pill className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Done</Pill>}
          </div>
          {step.why && <p className="text-muted-foreground mt-1 text-sm">{step.why}</p>}
          {hasDetail && (
            <button type="button" className="mt-2 text-sm font-medium text-(--site-accent)" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? "Hide lessons" : "Show lessons and courses"}
            </button>
          )}
          {open && (
            <div className="mt-3 space-y-3 text-sm">
              {step.lessons.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">In your courses</p>
                  <ul className="space-y-1">
                    {step.lessons.map((l) => (
                      <li key={`${l.kind}:${l.id}`}>
                        <Link
                          href={l.kind === "RECORDING" ? CONFIG.ROUTES.STUDENT.RECORDINGS : CONFIG.ROUTES.STUDENT.COURSE_CONTENT}
                          className="hover:text-foreground inline-flex items-center gap-1.5"
                        >
                          {l.kind === "RECORDING" ? <PlayCircleIcon className="size-4" /> : <BookOpenIcon className="size-4" />}
                          {l.title}
                          <span className="text-muted-foreground text-xs">· {l.courseTitle}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {step.courses.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1 text-xs font-medium">Courses that teach it</p>
                  <div className="flex flex-wrap gap-2">
                    {step.courses.map((c) => (
                      <Link
                        key={c.id}
                        href={`${CONFIG.ROUTES.PUBLIC.COURSES}/${c.slug}`}
                        className="hover:border-foreground/30 rounded-lg border px-2.5 py-1"
                      >
                        {c.title}
                        {c.enrolled && <span className="text-muted-foreground"> · your course</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {step.openJobs > 0 && (
                <Link href={CONFIG.ROUTES.STUDENT.JOBS} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                  <BriefcaseIcon className="size-4" /> {step.openJobs} open job{step.openJobs === 1 ? "" : "s"} ask for {step.skill}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export function LearningPathScreen() {
  const { data: pathsData, loading: pathsLoading } = useQuery<{ careerPaths: CareerPath[] }>(GET_CAREER_PATHS, { fetchPolicy: "cache-and-network" })
  const { data, loading } = useQuery<{ myLearningPath: LearningPath | null }>(GET_MY_LEARNING_PATH, { fetchPolicy: "cache-and-network" })
  const [setTarget, { loading: saving }] = useMutation(SET_MY_TARGET_PATH, { refetchQueries: [GET_MY_LEARNING_PATH] })
  const [changing, setChanging] = useState(false)
  const paths = pathsData?.careerPaths ?? []
  const lp = data?.myLearningPath ?? null

  const pick = (pathId: string | null) =>
    void setTarget({ variables: { pathId } })
      .then(() => {
        setChanging(false)
        if (pathId) toast.success("Path saved")
      })
      .catch((e: Error) => toast.error(e.message))

  if ((loading && !data) || (pathsLoading && !pathsData)) return <ContentAreaLoader />

  const header = (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Learning path</h1>
      <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
        Pick the role you&apos;re aiming for. You&apos;ll see the skills it needs in order, which you already have, and the lessons in your courses
        that teach the rest.
      </p>
    </div>
  )

  if (!lp || changing) {
    return (
      <div className="w-full space-y-6 py-6">
        {header}
        {!paths.length ? (
          <EmptyState title="No roles to pick yet">
            <p className="text-muted-foreground mt-1 text-sm">Our team is setting these up. Check back soon.</p>
          </EmptyState>
        ) : (
          <>
            <PathPicker paths={paths} current={lp?.path.id} onPick={pick} busy={saving} />
            {changing && (
              <Button variant="ghost" onClick={() => setChanging(false)}>
                Keep {lp?.path.title}
              </Button>
            )}
          </>
        )}
      </div>
    )
  }

  const percent = lp.total ? Math.round((lp.done / lp.total) * 100) : 0
  return (
    <div className="w-full space-y-6 py-6">
      {header}
      <div className="bg-card rounded-xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-sm">Aiming for</p>
            <p className="text-xl font-semibold">{lp.path.title}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setChanging(true)}>
              Change role
            </Button>
            <Button size="sm" variant="ghost" disabled={saving} onClick={() => pick(null)}>
              Clear
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span>
              {lp.done} of {lp.total} skills
            </span>
            <span className="text-muted-foreground">{percent}%</span>
          </div>
          <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
            <div className="h-full rounded-full bg-(--site-accent)" style={{ width: `${percent}%` }} />
          </div>
        </div>
        {lp.nextSkill ? (
          <p className="mt-3 flex items-center gap-2 text-sm">
            <SparklesIcon className="size-4 text-(--site-accent)" /> Next up: <span className="font-medium">{lp.nextSkill}</span>
          </p>
        ) : (
          <p className="mt-3 text-sm font-medium text-emerald-600">You have every skill on this path. Time to apply!</p>
        )}
        <p className="text-muted-foreground mt-3 text-xs">
          A skill counts as done when it&apos;s in your{" "}
          <Link href={CONFIG.ROUTES.STUDENT.PORTFOLIO} className="underline">
            portfolio
          </Link>{" "}
          skills or projects.
        </p>
      </div>
      <ol className="space-y-3">
        {lp.steps.map((s, i) => (
          <StepItem key={s.skill} step={s} index={i} isNext={s.skill === lp.nextSkill} />
        ))}
      </ol>
    </div>
  )
}

/* ================================================================== admin */

type PathForm = { title: string; description: string; steps: { skill: string; why: string }[]; isPublished: boolean; sortOrder: number }

function SkillSuggestions({ title, have, onAdd }: { title: string; have: string[]; onAdd: (skill: string) => void }) {
  const [load, { data, loading, called }] = useLazyQuery<{ skillDemand: { skill: string; jobs: number }[] }>(GET_SKILL_DEMAND, {
    fetchPolicy: "network-only",
  })
  const lower = new Set(have.map((h) => h.toLowerCase()))
  const list = (data?.skillDemand ?? []).filter((d) => !lower.has(d.skill.toLowerCase()))
  return (
    <div className="bg-muted/40 space-y-2 rounded-lg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">What jobs with a title like this ask for</p>
        <Button size="sm" variant="outline" disabled={!title.trim() || loading} onClick={() => void load({ variables: { title: title.trim() } })}>
          {loading && <Loader2Icon className="size-4 animate-spin" />} {called ? "Check again" : "Check job board"}
        </Button>
      </div>
      {called && !loading && (
        list.length ? (
          <div className="flex flex-wrap gap-1.5">
            {list.map((d) => (
              <button
                key={d.skill}
                type="button"
                onClick={() => onAdd(d.skill)}
                className="hover:bg-muted inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
              >
                <PlusIcon className="size-3" /> {d.skill} <span className="text-muted-foreground">{d.jobs}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">No other skills found in open jobs with a similar title.</p>
        )
      )}
    </div>
  )
}

function PathFormBody({ path, onDone }: { path: CareerPath | null; onDone: () => void }) {
  const [form, setForm] = useState<PathForm>({
    title: path?.title ?? "",
    description: path?.description ?? "",
    steps: path?.steps.map((s) => ({ skill: s.skill, why: s.why })) ?? [],
    isPublished: path?.isPublished ?? false,
    sortOrder: path?.sortOrder ?? 0,
  })
  const [newSkill, setNewSkill] = useState("")
  const refetchQueries = [GET_CAREER_PATHS]
  const [create, { loading: creating }] = useMutation(CREATE_CAREER_PATH, { refetchQueries })
  const [update, { loading: updating }] = useMutation(UPDATE_CAREER_PATH, { refetchQueries })

  const addStep = (skill: string) => {
    const s = skill.trim()
    if (!s || form.steps.length >= MAX_STEPS || form.steps.some((x) => x.skill.toLowerCase() === s.toLowerCase())) return
    setForm((f) => ({ ...f, steps: [...f.steps, { skill: s, why: "" }] }))
  }
  const moveStep = (i: number, by: number) =>
    setForm((f) => {
      const steps = [...f.steps]
      const j = i + by
      if (j < 0 || j >= steps.length) return f
      ;[steps[i], steps[j]] = [steps[j], steps[i]]
      return { ...f, steps }
    })

  const save = async () => {
    if (!form.title.trim() || !form.steps.length) {
      toast.error("Add a title and at least one skill")
      return
    }
    const input = {
      title: form.title.trim(),
      description: form.description.trim(),
      steps: form.steps.map((s) => ({ skill: s.skill, why: s.why.trim() })),
      isPublished: form.isPublished,
      sortOrder: form.sortOrder,
    }
    try {
      if (path) await update({ variables: { id: path.id, input } })
      else await create({ variables: { input } })
      toast.success("Saved")
      onDone()
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save")
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Role">
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={80} placeholder="e.g. Frontend developer" />
      </Field>
      <Field label="Short description">
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          maxLength={600}
          placeholder="What the job is like and who it suits."
        />
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-medium">Skills, in the order to learn them</p>
        {form.steps.map((s, i) => (
          <div key={s.skill} className="space-y-1 rounded-lg border p-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-5 text-xs">{i + 1}</span>
              <span className="flex-1 text-sm font-medium">{s.skill}</span>
              <button type="button" aria-label="Move up" className="hover:bg-muted rounded p-1" onClick={() => moveStep(i, -1)}>
                <ArrowUpIcon className="size-4" />
              </button>
              <button type="button" aria-label="Move down" className="hover:bg-muted rounded p-1" onClick={() => moveStep(i, 1)}>
                <ArrowDownIcon className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${s.skill}`}
                className="hover:bg-muted rounded p-1"
                onClick={() => setForm((f) => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))}
              >
                <Trash2Icon className="size-4" />
              </button>
            </div>
            <Input
              value={s.why}
              onChange={(e) => setForm((f) => ({ ...f, steps: f.steps.map((x, j) => (j === i ? { ...x, why: e.target.value } : x)) }))}
              maxLength={300}
              placeholder="Why it matters (optional)"
              className="h-8 text-sm"
              aria-label={`Why ${s.skill} matters`}
            />
          </div>
        ))}
        {form.steps.length < MAX_STEPS && (
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addStep(newSkill)
                  setNewSkill("")
                }
              }}
              maxLength={60}
              placeholder="Add a skill, e.g. TypeScript"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                addStep(newSkill)
                setNewSkill("")
              }}
            >
              Add
            </Button>
          </div>
        )}
        <SkillSuggestions title={form.title} have={form.steps.map((s) => s.skill)} onAdd={addStep} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} /> Students
          can pick it
        </label>
        <label className="flex items-center gap-2 text-sm">
          Order
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
            className="h-8 w-20"
          />
        </label>
      </div>
      <Button disabled={creating || updating} onClick={() => void save()}>
        {(creating || updating) && <Loader2Icon className="size-4 animate-spin" />} Save
      </Button>
    </div>
  )
}

export function AdminCareerPathsScreen() {
  const { data, loading } = useQuery<{ careerPaths: CareerPath[] }>(GET_CAREER_PATHS, {
    variables: { includeDrafts: true },
    fetchPolicy: "cache-and-network",
  })
  const [editing, setEditing] = useState<CareerPath | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<CareerPath | null>(null)
  const [remove, { loading: removing }] = useMutation(DELETE_CAREER_PATH, { refetchQueries: [GET_CAREER_PATHS] })
  const [filter, setFilter] = useState<"all" | "live" | "draft">("all")
  const paths = (data?.careerPaths ?? []).filter((p) => filter === "all" || (filter === "live" ? p.isPublished : !p.isPublished))

  return (
    <div className="w-full space-y-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-secondary text-sm font-semibold">Admin</div>
          <h1 className="text-3xl font-semibold tracking-tight">Career paths</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Roles students can aim for, with the skills to learn in order. Each student sees which they have, and the lessons in their courses
            that teach the rest.
          </p>
        </div>
        <div className="flex gap-2">
          <select aria-label="Show" className={cn(selectClass, "w-32")} value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">All</option>
            <option value="live">Live</option>
            <option value="draft">Drafts</option>
          </select>
          <Button onClick={() => setCreating(true)}>
            <PlusIcon className="size-4" /> New path
          </Button>
        </div>
      </div>
      {loading && !data ? (
        <ContentAreaLoader />
      ) : !paths.length ? (
        <EmptyState title="No career paths yet">
          <p className="text-muted-foreground mt-1 text-sm">Start with the roles your courses lead to, like Frontend developer or Data analyst.</p>
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {paths.map((p) => (
            <div key={p.id} className="bg-card flex flex-col rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{p.title}</p>
                <Pill className={p.isPublished ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : undefined}>
                  {p.isPublished ? "Live" : "Draft"}
                </Pill>
                <span className="text-muted-foreground ml-auto text-xs">{p.studentsCount ?? 0} students</span>
              </div>
              {p.description && <p className="text-muted-foreground mt-1 text-sm">{p.description}</p>}
              <ol className="mt-2 flex flex-wrap gap-1.5">
                {p.steps.map((s, i) => (
                  <li key={s.skill}>
                    <Pill>
                      {i + 1}. {s.skill}
                    </Pill>
                  </li>
                ))}
              </ol>
              <div className="mt-auto flex gap-2 pt-3">
                <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                  <PencilIcon className="size-4" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal
        open={creating || !!editing}
        onOpenChange={(o) => !o && (setCreating(false), setEditing(null))}
        title={editing ? `Edit ${editing.title}` : "New career path"}
      >
        {(creating || editing) && <PathFormBody key={editing?.id ?? "new"} path={editing} onDone={() => (setCreating(false), setEditing(null))} />}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.title ?? "this path"}?`}
        description={
          deleting?.studentsCount
            ? `${deleting.studentsCount} student${deleting.studentsCount === 1 ? " is" : "s are"} aiming for it. They'll be asked to pick another role.`
            : "Students haven't picked it yet."
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={removing}
        onConfirm={() => {
          const p = deleting
          if (!p) return
          void remove({ variables: { id: p.id } })
            .then(() => toast.success("Deleted"))
            .catch((e: Error) => toast.error(e.message))
            .finally(() => setDeleting(null))
        }}
      />
    </div>
  )
}
