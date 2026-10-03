import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS } from '../data/types'
import type { Scenario, Settings, StepSpec } from '../data/types'
import type { Clarify } from '../data/caseStudy'
import { voice } from '../data/copy'
import { asksInChat, buildPlan, isSacred, stopsUser } from './plan'

export { asksInChat, isSacred, stopsUser } from './plan'

export type StepState = 'pending' | 'running' | 'done' | 'blocked' | 'paused' | 'reverted'
export type StepOutcome = 'auto' | 'approved' | 'counter' | 'undone'

/**
 * A decision the user made *before* the flow got here. It sits on the card and
 * executes at the moment the run arrives. Sacred steps can never hold one.
 */
export type QueuedDecision =
  | { type: 'approve' }
  | { type: 'feedback'; text: string }
  | { type: 'rewind'; toKey: string; text: string }

export type StepBranch = 'main' | 'abandoned' | 'diverged'

export type RunStep = {
  key: string
  spec: StepSpec
  state: StepState
  outcome?: StepOutcome
  resultTitle?: string
  resultNote?: string
  counterNote?: string
  isNew?: boolean
  queued?: QueuedDecision
  discarded?: boolean
  /** the dummy run has been generated and read for this step */
  previewed?: boolean
  branch?: StepBranch
  isForkPoint?: boolean
}

export type Message = {
  id: number
  role: 'user' | 'assistant' | 'event'
  text: string
  tone?: 'plain' | 'warn' | 'good'
  /** the agent asked instead of guessing */
  clarify?: Clarify
  /** what the person answered, once they have */
  answered?: string
  /** a basic question about this step, asked here in the chat rather than on the plan */
  askKey?: string
}

/** One turn in a card's own decision thread. */
export type ChatMsg = { id: number; from: 'ai' | 'you'; text: string; tone?: 'warn' | 'good' }

export type DrawerPhase = 'files' | 'generating' | 'preview'
export type Drawer = { key: string; phase: DrawerPhase }

export type RunStatus = 'idle' | 'running' | 'halted' | 'paused' | 'done'

export const STEP_MS = 1_500
const TICK_MS = 50
export const SPEEDS = [1, 4, 12] as const
export type Speed = (typeof SPEEDS)[number]

let uid = 0
const nextKey = () => `k${++uid}`
const toRunStep = (spec: StepSpec, isNew = false, branch: StepBranch = 'main'): RunStep => ({
  key: nextKey(),
  spec,
  state: 'pending',
  isNew,
  branch,
})
const kill = (s: RunStep): RunStep => ({
  ...s,
  state: 'reverted',
  outcome: 'undone',
  discarded: true,
  queued: undefined,
  branch: 'abandoned',
})

/** One entry in the Claude Code sidebar. A session is created the moment a scenario starts. */
export type Session = { id: string; scenarioId: string; scenario?: Scenario; title: string; at: number }

export function useRun() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [onboarded, setOnboarded] = useState(false)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [steps, setSteps] = useState<RunStep[]>([])
  const [cursor, setCursor] = useState(0)
  const [status, setStatus] = useState<RunStatus>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [openNode, setOpenNode] = useState<string | null>(null)
  const [chats, setChats] = useState<Record<string, ChatMsg[]>>({})
  const [drawer, setDrawer] = useState<Drawer | null>(null)
  const [finalOutcome, setFinalOutcome] = useState<'approve' | 'safer' | null>(null)
  const [speed, setSpeed] = useState<Speed>(1)
  const [progress, setProgress] = useState(0)
  const [epoch, setEpoch] = useState(0)
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  const ticker = useRef<number | null>(null)
  const elapsed = useRef(0)
  const msgId = useRef(0)
  const chatId = useRef(0)
  const speedRef = useRef<Speed>(speed)
  speedRef.current = speed
  const settingsRef = useRef<Settings>(settings)
  settingsRef.current = settings

  const stepsRef = useRef<RunStep[]>(steps)
  stepsRef.current = steps

  const say = useCallback((role: Message['role'], text: string, tone: Message['tone'] = 'plain') => {
    setMessages((m) => [...m, { id: ++msgId.current, role, text, tone }])
  }, [])

  const pushChat = useCallback((key: string, from: ChatMsg['from'], text: string, tone?: ChatMsg['tone']) => {
    setChats((c) => ({ ...c, [key]: [...(c[key] ?? []), { id: ++chatId.current, from, text, tone }] }))
  }, [])

  const stopTicker = () => {
    if (ticker.current !== null) {
      window.clearInterval(ticker.current)
      ticker.current = null
    }
  }

  const start = useCallback(
    (s: Scenario, opts: { keepThread?: boolean } = {}) => {
      stopTicker()
      const plan = buildPlan(s, settingsRef.current)
      setScenario(s)
      setSteps(plan.map((spec) => toRunStep(spec)))
      setCursor(0)
      setOpenNode(null)
      setDrawer(null)
      setChats({})
      setFinalOutcome(null)
      setProgress(0)
      // after a clarifying question the plan continues the same conversation
      if (!opts.keepThread) {
        setMessages([])
        msgId.current = 0
      }
      setEpoch((e) => e + 1)
      setStatus('running')
      const sid = `${s.id}-${Date.now()}`
      setSessionId(sid)
      setSessions((prev) => [{ id: sid, scenarioId: s.id, scenario: s, title: s.chip, at: Date.now() }, ...prev])
      const stopping = plan.filter((p) => stopsUser(p, settingsRef.current) && !asksInChat(p)).length
      if (!opts.keepThread) say('user', s.prompt)
      say('assistant', voice(s.reply, settingsRef.current.tech))
      say('event', `Planned ${plan.length} steps - ${stopping === 0 ? 'none will stop you' : `${stopping} will stop you`} at your check-in setting.`)
    },
    [say],
  )

  const chatOnly = useCallback(
    (userText: string, replyText: string) => {
      stopTicker()
      setScenario(null)
      setSteps([])
      setCursor(0)
      setStatus('idle')
      say('user', userText)
      say('assistant', replyText)
    },
    [say],
  )

  /** Ask, don't guess: a question in the thread instead of a plan. */
  const ask = useCallback((userText: string, clarify: Clarify) => {
    stopTicker()
    setScenario(null)
    setSteps([])
    setCursor(0)
    setStatus('idle')
    setMessages((m) => [
      ...m,
      { id: ++msgId.current, role: 'user', text: userText },
      { id: ++msgId.current, role: 'assistant', text: clarify.title, clarify },
    ])
  }, [])

  const answerClarify = useCallback((id: number, answer: string) => {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, answered: answer } : x)))
  }, [])

  const reset = useCallback(() => {
    stopTicker()
    setScenario(null)
    setSteps([])
    setCursor(0)
    setStatus('idle')
    setMessages([])
    setOpenNode(null)
    setDrawer(null)
    setChats({})
    setFinalOutcome(null)
    setProgress(0)
    setSessionId(null)
  }, [])

  const completeCurrent = useCallback((i: number) => {
    stopTicker()
    setProgress(0)
    const completedStep = stepsRef.current[i]
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, state: 'done', outcome: s.outcome ?? 'auto' } : s)))
    setCursor((c) => c + 1)
    if (completedStep && !completedStep.discarded) {
      const toolText = completedStep.spec.tool ? ` (${completedStep.spec.tool})` : ''
      say('event', `✓ Step completed: ${completedStep.spec.title}${toolText}`)
    }
  }, [say])

  /* ---------------- resolving a stopping step ---------------- */

  const approveAt = useCallback(
    (idx: number) => {
      const list = stepsRef.current
      const step = list[idx]
      const d = step.spec.decision
      const extras = (step.spec.followUps?.approve ?? []).map((sp) => toRunStep(sp, true))
      setSteps([
        ...list.slice(0, idx),
        { ...step, state: 'done', outcome: 'approved', resultNote: d?.approveResultNote, queued: undefined },
        ...extras,
        ...list.slice(idx + 1),
      ])
      setCursor(idx + 1)
      setEpoch((e) => e + 1)
      setStatus('running')
      say('user', d?.oneClick ? d.approveLabel ?? 'Yes' : d?.confirmPhrase ?? 'approved')
      // approving what you meant is calm; approving a guess you never checked is the warning
      if (d?.intended) say('event', `✓ ${d.approveResultNote}`, 'good')
      else say('event', `Approved as-is - ${d?.approveResultNote}`, 'warn')
    },
    [say],
  )

  const feedbackAt = useCallback(
    (idx: number, text: string) => {
      const list = stepsRef.current
      const step = list[idx]
      const d = step.spec.decision
      // safer.label is voiced, so compare against the register the user is actually reading
      const usedSuggestion = !!d && text.trim() === voice(d.safer.label, settingsRef.current.tech)
      const resolved: RunStep = {
        ...step,
        state: 'done',
        outcome: 'counter',
        counterNote: text,
        queued: undefined,
        isForkPoint: true,
        branch: 'main',
        resultTitle: usedSuggestion ? d?.safer.resultTitle : 'Re-planned from your instruction',
        resultNote: usedSuggestion
          ? d?.safer.resultNote
          : `Your instruction: “${text}” - applied instead of the original step.`,
      }
      const disabled = list.slice(idx + 1).map(kill)
      const replan = (step.spec.followUps?.safer ?? []).map((sp) => toRunStep(sp, true, 'diverged'))
      // the suggested change already has its own plan; only your own words need re-checking
      if (!usedSuggestion) replan.push(
        toRunStep(
          {
            id: `${step.spec.id}-after`,
            title: 'Re-check the plan against your instruction',
            plain: `Confirms the rest of the work still matches what you asked for: “${text}”`,
            tier: 'safe',
            triggers: [],
            tool: 'Re-plan · verify against instruction',
          },
          true,
          'diverged',
        ),
      )
      setSteps([...list.slice(0, idx), resolved, ...disabled, ...replan])
      setCursor(idx + 1 + disabled.length)
      setEpoch((e) => e + 1)
      setStatus('running')
      say('user', text)
      say('assistant', `Changed the plan: “${text}”. The old steps are crossed out on the right, next to the new ones. Nothing from the old path ran.`, 'good')
    },
    [say],
  )

  const rewindAt = useCallback(
    (toKey: string, text: string, fromIdx?: number) => {
      const list = stepsRef.current
      const i = list.findIndex((s) => s.key === toKey)
      if (i < 0) return
      const target = list[i]
      const d = target.spec.decision
      stopTicker()
      setProgress(0)
      const disabled = list.slice(i).map(kill)
      // "Go back and fix the rule": the step that stopped you knows what the corrected plan is
      const steer = fromIdx != null ? list[fromIdx]?.spec.decision?.steer : undefined
      if (steer && steer.goBackTo === target.spec.id) {
        const preSteps = list.slice(0, i).map((s, si) => (si === i - 1 ? { ...s, isForkPoint: true } : s))
        setSteps([...preSteps, ...disabled, ...steer.afterGoBack.map((sp) => toRunStep(sp, true, 'diverged'))])
        setCursor(i + disabled.length)
        setFinalOutcome(null)
        setEpoch((e) => e + 1)
        setStatus('running')
        say('user', text)
        say('assistant', `Back to step ${i + 1} with your rule. Nothing was deleted - I stopped before it. The new plan is on the right, next to the old one.`, 'good')
        return
      }
      const replan: RunStep[] = [
        toRunStep(
          {
            id: `${target.spec.id}-undo`,
            title: 'Undo the disabled path',
            plain: `Restores the state saved before “${target.spec.title}”. Your correction: “${text}”`,
            tier: 'safe',
            triggers: [],
            tool: 'Restore snapshot · pre-step',
          },
          true,
          'diverged',
        ),
      ]
      if (d) {
        replan.push(
          toRunStep(
            { id: `${target.spec.id}-safer`, title: d.safer.resultTitle, plain: d.safer.detail, tier: 'safe', triggers: [], tool: 'Apply the safer path' },
            true,
            'diverged',
          ),
        )
      }
      const preSteps = list.slice(0, i).map((s, si) => (si === i - 1 ? { ...s, isForkPoint: true } : s))
      setSteps([...preSteps, ...disabled, ...replan])
      setCursor(i + disabled.length)
      setFinalOutcome(null)
      setEpoch((e) => e + 1)
      setStatus('running')
      say('user', `Rewind to “${target.spec.title}”. ${text}`)
      say('assistant', 'Reverted to that point from the saved per-step history and re-planned from there.', 'good')
    },
    [say],
  )

  const applyDecision = useCallback(
    (idx: number, dec: QueuedDecision) => {
      setOpenNode(null)
      setDrawer(null)
      if (dec.type === 'approve') approveAt(idx)
      else if (dec.type === 'feedback') feedbackAt(idx, dec.text)
      else rewindAt(dec.toKey, dec.text, idx)
    },
    [approveAt, feedbackAt, rewindAt],
  )

  /* ---------------- the engine ---------------- */
  useEffect(() => {
    if (status !== 'running' || !scenario) return
    const current = stepsRef.current[cursor]
    if (!current) {
      setStatus('done')
      return
    }
    if (current.state === 'running' || current.state === 'done') return

    if (stopsUser(current.spec, settingsRef.current)) {
      if (current.queued) {
        const dec = current.queued
        say('event', 'Reached a step you had already decided - running your instruction.')
        applyDecision(cursor, dec)
        return
      }
      setSteps((prev) => prev.map((s, i) => (i === cursor ? { ...s, state: 'blocked' } : s)))
      setStatus('halted')
      // a basic question is asked right here in the chat - the plan only opens for the risky ones
      if (asksInChat(current.spec)) {
        setMessages((m) => [...m, { id: ++msgId.current, role: 'assistant', text: '', askKey: current.key }])
        return
      }
      setOpenNode(current.key)
      const why = current.spec.decision?.failed
        ? 'Something broke.'
        : current.spec.triggers.includes(3)
          ? 'It changes more than you asked for.'
          : current.spec.triggers.includes(1)
          ? 'It can’t be undone.'
          : 'It needs your say-so.'
      say('assistant', `I stopped before step ${cursor + 1}, “${current.spec.title}”. ${why} It’s open on the right.`, 'warn')
      return
    }

    setSteps((prev) => prev.map((s, i) => (i === cursor ? { ...s, state: 'running' } : s)))
    elapsed.current = 0
    setProgress(0)
    // Measure against the wall clock rather than counting ticks. Browsers throttle
    // setInterval hard in a hidden or unfocused tab - counting ticks made the whole run
    // crawl the moment you switched windows mid-demo.
    let last = performance.now()
    ticker.current = window.setInterval(() => {
      const now = performance.now()
      elapsed.current += (now - last) * speedRef.current
      last = now
      if (elapsed.current >= STEP_MS) completeCurrent(cursor)
      else setProgress(elapsed.current / STEP_MS)
    }, TICK_MS)
    return stopTicker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, cursor, epoch, scenario])

  useEffect(() => {
    if (status !== 'done' || !scenario) return
    // the run ends on whichever decision was made last - that is the one the summary is about
    const live = stepsRef.current.filter((s) => !s.discarded)
    const last = [...live].reverse().find((s) => s.spec.decision && (s.outcome === 'approved' || s.outcome === 'counter'))
    const d = last?.spec.decision
    const approvedHarm = last?.outcome === 'approved' && !d?.intended
    const took = approvedHarm ? 'approve' : 'safer'
    setFinalOutcome(took)
    const key = last?.outcome === 'approved' ? 'approve' : 'safer'
    const outcomeText = d?.outcome?.[key] || scenario.outcome?.[took] || 'Finished.'
    say('assistant', `✓ ${outcomeText}`, approvedHarm ? 'warn' : 'good')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  /* ---------------- user controls ---------------- */

  const skip = useCallback(() => {
    if (status === 'running' && stepsRef.current[cursor]?.state === 'running') completeCurrent(cursor)
  }, [status, cursor, completeCurrent])

  const queueDecision = useCallback(
    (key: string, dec: QueuedDecision) => {
      const step = stepsRef.current.find((s) => s.key === key)
      if (!step || isSacred(step.spec.triggers)) return
      setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, queued: dec } : s)))
      const what = dec.type === 'approve' ? 'approve it' : dec.type === 'feedback' ? 'apply your instruction' : 'rewind'
      say('event', `Queued on “${step.spec.title}” - when the flow gets there it will ${what}.`)
    },
    [say],
  )

  const clearQueued = useCallback((key: string) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, queued: undefined } : s)))
  }, [])

  const decideNow = useCallback(
    (key: string, dec: QueuedDecision) => {
      const idx = stepsRef.current.findIndex((s) => s.key === key)
      if (idx < 0) return
      applyDecision(idx, dec)
    },
    [applyDecision],
  )

  const pauseStep = useCallback(
    (key: string) => {
      stopTicker()
      setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, state: 'paused' } : s)))
      setStatus('paused')
      say('event', 'You paused a step that wasn’t flagged. Nothing runs until you resume.')
    },
    [say],
  )

  const resume = useCallback(() => {
    setSteps((prev) => prev.map((s) => (s.state === 'paused' ? { ...s, state: 'pending' } : s)))
    setEpoch((e) => e + 1)
    setStatus('running')
  }, [])

  /* ---------------- dummy-run drawer ---------------- */

  const openDrawer = useCallback((key: string) => setDrawer({ key, phase: 'files' }), [])
  const closeDrawer = useCallback(() => setDrawer(null), [])

  const generateDummy = useCallback(
    (key: string) => {
      setDrawer({ key, phase: 'generating' })
      window.setTimeout(() => {
        setDrawer({ key, phase: 'preview' })
        setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, previewed: true } : s)))
        pushChat(key, 'ai', 'I ran it on a throwaway copy. The preview on the right is what it did - nothing real has changed.', 'warn')
      }, 1600)
    },
    [pushChat],
  )

  return {
    settings, setSettings, onboarded, setOnboarded,
    sessions, sessionId,
    scenario, steps, cursor, status, messages, openNode, chats, drawer,
    finalOutcome, speed, progress,
    setSpeed, setOpenNode, pushChat,
    skip, start, reset, chatOnly, ask, answerClarify,
    queueDecision, clearQueued, decideNow, rewindAt, feedbackAt, approveAt,
    pauseStep, resume,
    openDrawer, closeDrawer, generateDummy,
  }
}
