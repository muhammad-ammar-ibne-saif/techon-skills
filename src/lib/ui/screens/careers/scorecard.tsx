"use client"

import { useState } from "react"
import { useMutation } from "@apollo/client/react"
import { ClipboardCheckIcon, Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import toast from "react-hot-toast"

import { cn } from "@/lib/helpers"
import { DELETE_INTERVIEW_FEEDBACK, GET_COMPANY_INTERVIEWS, SUBMIT_INTERVIEW_FEEDBACK } from "@/lib/graphql"
import { Button } from "@/lib/ui/useable-components/button"
import { Input } from "@/lib/ui/useable-components/input"
import { Textarea } from "@/lib/ui/useable-components/textarea"
import { Field, Pill } from "../jobs/shared"
import type { Interview } from "./interview"

export type Recommendation = "STRONG_YES" | "YES" | "NO" | "STRONG_NO"

export type InterviewFeedback = {
  id: string
  authorName: string
  mine: boolean
  overall: number
  recommendation: Recommendation
  skills: { skill: string; score: number }[]
  strengths: string
  concerns: string
  createdAt: string
  updatedAt: string
}

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  STRONG_YES: "Strong yes",
  YES: "Yes",
  NO: "No",
  STRONG_NO: "Strong no",
}
const RECOMMENDATION_CLASS: Record<Recommendation, string> = {
  STRONG_YES: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  YES: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  NO: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  STRONG_NO: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
}
const SCORE_WORDS = ["", "Weak", "Below the bar", "OK", "Good", "Excellent"]
const MAX_SKILLS = 12

/** Like Field, but not a <label>: a label would pass clicks on its text to the first button inside. */
function Group({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

const hasStarted = (iv: Pick<Interview, "startAt">) => new Date(iv.startAt).getTime() <= Date.now()

function ScorePicker({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          title={SCORE_WORDS[n]}
          onClick={() => onChange(n)}
          className={cn(
            "size-8 rounded-md border text-sm font-medium",
            value === n ? "border-(--site-accent) bg-(--site-accent) text-white" : "hover:bg-muted"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function ScorecardForm({ iv, mine, onDone }: { iv: Interview; mine: InterviewFeedback | null; onDone: () => void }) {
  const initialSkills = mine?.skills.length
    ? mine.skills
    : (iv.suggestedSkills ?? []).slice(0, MAX_SKILLS).map((skill) => ({ skill, score: 0 }))
  const [overall, setOverall] = useState(mine?.overall ?? 0)
  const [recommendation, setRecommendation] = useState<Recommendation | "">(mine?.recommendation ?? "")
  const [skills, setSkills] = useState(initialSkills)
  const [newSkill, setNewSkill] = useState("")
  const [strengths, setStrengths] = useState(mine?.strengths ?? "")
  const [concerns, setConcerns] = useState(mine?.concerns ?? "")
  const [submit, { loading }] = useMutation(SUBMIT_INTERVIEW_FEEDBACK, { refetchQueries: [GET_COMPANY_INTERVIEWS] })

  const addSkill = () => {
    const s = newSkill.trim()
    if (!s || skills.length >= MAX_SKILLS || skills.some((x) => x.skill.toLowerCase() === s.toLowerCase())) return
    setSkills((list) => [...list, { skill: s, score: 0 }])
    setNewSkill("")
  }

  const save = async () => {
    if (!overall || !recommendation) {
      toast.error("Give an overall score and a recommendation")
      return
    }
    try {
      await submit({
        variables: {
          interviewId: iv.id,
          input: {
            overall,
            recommendation,
            skills: skills.filter((s) => s.score > 0),
            strengths: strengths.trim(),
            concerns: concerns.trim(),
          },
        },
      })
      toast.success("Scorecard saved")
      onDone()
    } catch (e) {
      toast.error((e as Error).message || "Couldn't save")
    }
  }

  return (
    <div className="bg-muted/40 mt-3 space-y-4 rounded-lg p-3">
      <Group label="Overall">
        <ScorePicker value={overall} onChange={setOverall} label="Overall score" />
      </Group>
      <Group label="Hire?">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(RECOMMENDATION_LABEL) as Recommendation[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRecommendation(r)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                recommendation === r ? cn("border-transparent font-medium", RECOMMENDATION_CLASS[r]) : "hover:bg-muted"
              )}
            >
              {RECOMMENDATION_LABEL[r]}
            </button>
          ))}
        </div>
      </Group>
      <Group label="Skills" hint="Score the skills you tested. Skip any you didn't. Staff see averages across companies, without names.">
        <div className="space-y-2">
          {skills.map((s, i) => (
            <div key={s.skill} className="flex flex-wrap items-center gap-2">
              <span className="w-36 truncate text-sm">{s.skill}</span>
              <ScorePicker
                value={s.score}
                label={s.skill}
                onChange={(n) => setSkills((list) => list.map((x, j) => (j === i ? { ...x, score: n } : x)))}
              />
              <button
                type="button"
                aria-label={`Remove ${s.skill}`}
                onClick={() => setSkills((list) => list.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <Trash2Icon className="size-4" />
              </button>
            </div>
          ))}
          {skills.length < MAX_SKILLS && (
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                maxLength={60}
                placeholder="Add a skill, e.g. Communication"
                className="max-w-xs"
              />
              <Button type="button" size="sm" variant="outline" onClick={addSkill}>
                <PlusIcon className="size-4" /> Add
              </Button>
            </div>
          )}
        </div>
      </Group>
      <Field label="Strengths">
        <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} maxLength={2000} />
      </Field>
      <Field label="Concerns">
        <Textarea value={concerns} onChange={(e) => setConcerns(e.target.value)} rows={2} maxLength={2000} />
      </Field>
      <p className="text-muted-foreground text-xs">Only your company&apos;s team sees this scorecard. The student doesn&apos;t.</p>
      <div className="flex gap-2">
        <Button size="sm" disabled={loading} onClick={() => void save()}>
          {loading && <Loader2Icon className="size-4 animate-spin" />} Save scorecard
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function ScorecardView({ fb }: { fb: InterviewFeedback }) {
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{fb.authorName}</span>
        <Pill className={RECOMMENDATION_CLASS[fb.recommendation]}>{RECOMMENDATION_LABEL[fb.recommendation]}</Pill>
        <span className="text-muted-foreground">Overall {fb.overall}/5</span>
      </div>
      {fb.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {fb.skills.map((s) => (
            <Pill key={s.skill} className={s.score <= 2 ? "bg-rose-500/10 text-rose-700 dark:text-rose-400" : undefined}>
              {s.skill} {s.score}/5
            </Pill>
          ))}
        </div>
      )}
      {fb.strengths && (
        <p className="mt-2 whitespace-pre-line">
          <span className="text-muted-foreground">Strengths: </span>
          {fb.strengths}
        </p>
      )}
      {fb.concerns && (
        <p className="mt-1 whitespace-pre-line">
          <span className="text-muted-foreground">Concerns: </span>
          {fb.concerns}
        </p>
      )}
    </div>
  )
}

/** The team's scorecards for an interview that has started, and a form for the signed-in member's own. */
export function InterviewScorecards({ iv }: { iv: Interview }) {
  const [editing, setEditing] = useState(false)
  const [remove, { loading: removing }] = useMutation(DELETE_INTERVIEW_FEEDBACK, { refetchQueries: [GET_COMPANY_INTERVIEWS] })
  const all = iv.feedback ?? []
  const mine = all.find((f) => f.mine) ?? null
  if (!hasStarted(iv)) return null

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium">
          <ClipboardCheckIcon className="size-4" /> Scorecards {all.length > 0 && `(${all.length})`}
        </p>
        {!editing && (
          <div className="flex gap-2">
            <Button size="sm" variant={mine ? "ghost" : "outline"} onClick={() => setEditing(true)}>
              {mine ? "Edit mine" : "Add scorecard"}
            </Button>
            {mine && (
              <Button
                size="sm"
                variant="ghost"
                disabled={removing}
                onClick={() =>
                  void remove({ variables: { interviewId: iv.id } })
                    .then(() => toast.success("Scorecard removed"))
                    .catch((e: Error) => toast.error(e.message))
                }
              >
                Remove mine
              </Button>
            )}
          </div>
        )}
      </div>
      {editing && <ScorecardForm iv={iv} mine={mine} onDone={() => setEditing(false)} />}
      {all.map((fb) => (
        <ScorecardView key={fb.id} fb={fb} />
      ))}
    </div>
  )
}
