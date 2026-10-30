"use client"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import { type ChangeEvent, FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2Icon, EyeIcon, EyeOffIcon, KeyRoundIcon, MailIcon } from "lucide-react"

import { Button } from "@/lib/ui/useable-components/button"
import { Input } from "@/lib/ui/useable-components/input"
import { cn, getApiDisplayMessage, getPostLoginHomePath, logger, saveSession } from "@/lib/helpers"
import { apiService } from "@/lib/services"
import { ApiResponse, IUserProfileInfo } from "@/utils/interfaces"
import { LoggerLevel } from "@/utils/enums/logger"
import { ResponseStatus } from "@/utils/enums/magic-link"

import toast from "react-hot-toast"
import { useUser } from "@/lib/providers/user"

type Mode = "password" | "link"

type LoginData = { user?: IUserProfileInfo; accessToken?: string; passwordNotSet?: boolean }

/** `plain` renders a text-style "Log in" / "Dashboard" trigger styled only by `className` (home page nav). */
export const ContinueToDashboardDialog = ({ className, plain = false }: { className?: string; plain?: boolean }) => {
  const { userProfileInfo, refetchProfile } = useUser()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("password")
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [responseMessage, setResponseMessage] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<ResponseStatus>(ResponseStatus.INFO)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const switchMode = (next: Mode, message?: string) => {
    setMode(next)
    setSubmitted(false)
    setResponseMessage(message ?? null)
    setResponseStatus(message ? ResponseStatus.INFO : ResponseStatus.INFO)
  }

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResponseMessage(null)
    const email = formData.email.trim()
    setBusy(true)
    try {
      const data: ApiResponse<LoginData> = await apiService.login<LoginData>(email, formData.password)
      if (data.success && data.data?.accessToken) {
        saveSession(data.data.accessToken, data.data.user)
        await refetchProfile()
        toast.success("Signed in")
        setOpen(false)
        router.push(getPostLoginHomePath(data.data.user?.role))
        return
      }
      if (data.data?.passwordNotSet) {
        switchMode("link", getApiDisplayMessage(data, "You haven't set a password yet."))
        return
      }
      setResponseStatus(ResponseStatus.ERROR)
      setResponseMessage(getApiDisplayMessage(data, "Invalid email or password"))
    } catch (error) {
      logger({ type: LoggerLevel.ERROR, message: JSON.stringify(error) })
      setResponseStatus(ResponseStatus.ERROR)
      setResponseMessage("Unable to sign in right now. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const handleSendLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setResponseMessage(null)
    setResponseStatus(ResponseStatus.INFO)
    const email = formData.email.trim()
    setBusy(true)
    try {
      const data: ApiResponse<null> = await apiService.sendMagicLink(email)
      if (data.success) {
        const message = getApiDisplayMessage(data, "Sign-in link sent.")
        setSubmittedEmail(email)
        setResponseMessage(message)
        setResponseStatus(message.includes("requested") ? ResponseStatus.INFO : ResponseStatus.SUCCESS)
      } else {
        setResponseMessage(getApiDisplayMessage(data, "Unable to send sign-in link."))
        setResponseStatus(ResponseStatus.ERROR)
      }
    } catch (error) {
      logger({ type: LoggerLevel.ERROR, message: JSON.stringify(error) })
      setResponseMessage("Failed to send sign-in link.")
      setResponseStatus(ResponseStatus.ERROR)
    } finally {
      setBusy(false)
    }
    setSubmitted(true)
  }

  const status = useMemo(() => {
    if (!submitted) return "idle" as const
    return responseStatus
  }, [responseStatus, submitted])

  const dashboardHref = useMemo(() => {
    if (!userProfileInfo) return null
    return getPostLoginHomePath(userProfileInfo.role)
  }, [userProfileInfo])

  const resetDialog = () => {
    setMode("password")
    setSubmitted(false)
    setSubmittedEmail("")
    setResponseMessage(null)
    setResponseStatus(ResponseStatus.INFO)
    setShowPassword(false)
    setFormData({ email: "", password: "" })
  }

  if (dashboardHref) {
    if (plain) {
      return (
        <Link href={dashboardHref} className={className}>
          Dashboard
        </Link>
      )
    }
    return (
      <Button asChild variant="brand-secondary" shape="pill" className={cn("px-3 sm:px-4", className)}>
        <Link href={dashboardHref}>
          <span className="sm:hidden">Dashboard</span>
          <span className="hidden sm:inline">Continue to dashboard</span>
        </Link>
      </Button>
    )
  }

  const showLinkSent = mode === "link" && status === ResponseStatus.SUCCESS
  const showPendingApproval = mode === "link" && status === ResponseStatus.INFO && submitted

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => {
      setOpen(v)
      if (!v) resetDialog()
    }}>
      <DialogPrimitive.Trigger asChild>
        {plain ? (
          <button type="button" className={className}>
            Log in
          </button>
        ) : (
          <Button variant="brand-secondary" shape="pill" className={cn("max-w-46 px-3 sm:max-w-none sm:px-4", className)}>
            <span className="sm:hidden">Dashboard</span>
            <span className="hidden sm:inline">Continue to dashboard</span>
          </Button>
        )}
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            "bg-card text-primary data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed left-1/2 top-1/2 z-50 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border shadow-xl outline-none"
          )}
        >
          <div className="p-6 sm:p-8">
            {showLinkSent ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-[var(--system-success)] text-white">
                  <CheckCircle2Icon className="size-9 animate-in zoom-in-50 duration-500" strokeWidth={2.5} />
                </div>
                <DialogPrimitive.Title className="text-primary text-xl font-semibold">
                  Check your email
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-muted-foreground mt-3 text-sm leading-7">
                  We sent a sign-in link to{" "}
                  <span className="font-medium text-primary">{submittedEmail || "your email"}</span>.
                  It works once and expires in 30 minutes. After opening it you&apos;ll set a password,
                  so next time you can sign in without checking your email.
                  If you don&apos;t see it within a few minutes, check spam or promotions.
                </DialogPrimitive.Description>
                <Button
                  type="button"
                  variant="brand-secondary"
                  shape="pill"
                  className="mt-8 h-11 min-w-[8rem] px-6"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span className="bg-(--brand-primary) text-(--text-on-dark) inline-flex size-10 items-center justify-center rounded-2xl">
                    {mode === "password" ? <KeyRoundIcon className="size-5" /> : <MailIcon className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <DialogPrimitive.Title className="text-primary text-lg font-semibold">
                      {mode === "password" ? "Sign in" : "Email me a sign-in link"}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="text-muted-foreground text-sm">
                      {mode === "password"
                        ? "Use your enrolled email and password."
                        : "First time here, or forgot your password? We'll email you a one-time link, then you can set a password."}
                    </DialogPrimitive.Description>
                  </div>
                </div>

                {mode === "password" ? (
                  <form className="mt-6 space-y-4" onSubmit={handlePasswordLogin}>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-11 rounded-full"
                      required
                    />
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        name="password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        className="h-11 rounded-full pr-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="text-muted-foreground hover:text-primary absolute right-3 top-1/2 -translate-y-1/2 p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                      </button>
                    </div>
                    <Button type="submit" variant="brand-secondary" shape="pill" className="h-11 w-full" disabled={busy}>
                      {busy ? "Signing in..." : "Sign in"}
                    </Button>
                    {responseMessage && (
                      <p className={cn("text-sm", responseStatus === ResponseStatus.ERROR ? "text-destructive" : "text-muted-foreground")}>
                        {responseMessage}
                      </p>
                    )}
                    <button
                      type="button"
                      className="text-(--brand-primary) w-full text-center text-sm font-medium hover:underline"
                      onClick={() => switchMode("link")}
                    >
                      First time here or forgot your password? Email me a sign-in link
                    </button>
                  </form>
                ) : !submitted || status === ResponseStatus.ERROR ? (
                  <form className="mt-6 space-y-4" onSubmit={handleSendLink}>
                    {responseMessage && status !== ResponseStatus.ERROR && (
                      <p className="rounded-2xl border bg-background/50 p-3 text-sm text-muted-foreground">{responseMessage}</p>
                    )}
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-11 rounded-full"
                      required
                    />
                    <Button type="submit" variant="brand-secondary" shape="pill" className="h-11 w-full" disabled={busy}>
                      {busy ? "Sending..." : "Send sign-in link"}
                    </Button>
                    {status === ResponseStatus.ERROR && responseMessage && (
                      <p className="text-destructive text-sm">{responseMessage}</p>
                    )}
                    <button
                      type="button"
                      className="text-(--brand-primary) w-full text-center text-sm font-medium hover:underline"
                      onClick={() => switchMode("password")}
                    >
                      Back to password sign-in
                    </button>
                  </form>
                ) : showPendingApproval ? (
                  <div className="mt-6 rounded-2xl border bg-background/50 p-4 text-sm">
                    <div className="text-primary font-semibold">Please wait for approval</div>
                    <div className="text-muted-foreground mt-1 leading-7">{responseMessage}</div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
