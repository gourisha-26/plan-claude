import { useEffect, useRef, useState } from 'react'
import type { ProjectTemplate } from '../data/projects'
import type { Scenario } from '../data/types'
import { CASE_TASKS, matchCaseStudy, type ClarifyOption } from '../data/caseStudy'
import { generateScenarioFromPrompt, getConversationalReply } from '../lib/dynamicScenario'
import { callGeminiChat, callGeminiPlan } from '../lib/gemini'
import type { useRun } from '../lib/useRun'
import { Folder, Plus, Sparkle, Split } from './icons'
import { Abilities } from './Abilities'
import { ClarifyCard } from './ClarifyCard'
import { ChatAsk } from './ChatAsk'
import { asksInChat } from '../lib/plan'
import { Onboarding } from './Onboarding'
import { Sidebar, type Theme } from './Sidebar'

type Run = ReturnType<typeof useRun>

type Props = {
  run: Run
  /** the settings sheet, opened from the plan panel */
  editing: boolean
  onCloseEditing: () => void
  /** opens the "how this ships for real" walkthrough */
  onGuide: () => void
  selectedProject: ProjectTemplate | null
  onOpenFinder: () => void
  theme: Theme
  onTheme: (t: Theme) => void
}


export function ClaudeWindow({ run, editing, onCloseEditing, onGuide, selectedProject, onOpenFinder, theme, onTheme }: Props) {
  const [draft, setDraft] = useState('')
  const [sidebar, setSidebar] = useState(true)
  const [aiThinking, setAiThinking] = useState(false)
  const [pendingPlanPrompt, setPendingPlanPrompt] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const showOnboarding = !run.onboarded || editing

  // only follow the conversation once there is one - otherwise the home view opens scrolled past its own heading
  useEffect(() => {
    const el = scrollRef.current
    if (el && run.messages.length > 0) el.scrollTop = el.scrollHeight
  }, [run.messages])

  // Automatically execute pending /plan prompt when workspace folder is selected in Finder
  useEffect(() => {
    if (selectedProject && pendingPlanPrompt) {
      const promptToRun = pendingPlanPrompt
      setPendingPlanPrompt(null)
      submitDraft(promptToRun)
    }
  }, [selectedProject, pendingPlanPrompt])

  const send = (s: Scenario) => run.start(s)

  const pickOption = (msgId: number, o: ClarifyOption) => {
    run.answerClarify(msgId, o.label)
    if (o.scenario) run.start(o.scenario, { keepThread: true })
    else if (o.reply) run.chatOnly(o.label, o.reply)
  }

  const isPlanCommand = (text: string) => text.trim().toLowerCase().startsWith('/plan')

  const submitDraft = async (overridePrompt?: string) => {
    const raw = (overridePrompt ?? draft).trim()
    if (!raw || aiThinking) return
    if (!overridePrompt) setDraft('')

    // If midway through an active run (halted or running), branch/diverge path immediately
    if ((run.status === 'halted' || run.status === 'running') && run.steps.length > 0 && run.cursor < run.steps.length) {
      // a basic question in the chat can be answered by typing, too
      const current = run.steps[run.cursor]
      if (run.status === 'halted' && asksInChat(current.spec) && /^(yes|yep|ok(ay)?|sure|looks good|done|go ahead|i('|’)ve added them)\b/i.test(raw)) {
        run.approveAt(run.cursor)
        return
      }
      run.feedbackAt(run.cursor, raw)
      return
    }

    // THE VISUALIZATION ONLY OPENS WHEN INITIATED WITH /plan
    if (isPlanCommand(raw)) {
      const taskPrompt = raw.replace(/^\/plan\s*/i, '').trim()
      if (!taskPrompt) {
        run.chatOnly(raw, 'Please specify a task to visualize, e.g.: `/plan drop production database table users`')
        return
      }

      // MANDATORY FOLDER SELECTION FOR /plan: opens Finder on the simulated desktop
      if (!selectedProject) {
        setPendingPlanPrompt(raw)
        onOpenFinder()
        run.chatOnly(
          raw,
          'Pick the project folder first - I only work inside one project, never outside it. Opening Finder…',
        )
        return
      }

      // the case-study scenarios: a plan, or a question when the request isn't clear enough to plan
      const match = matchCaseStudy(taskPrompt)
      if (match?.type === 'plan') {
        send({ ...match.scenario, prompt: raw })
        return
      }
      if (match?.type === 'clarify') {
        run.ask(raw, match.clarify)
        return
      }

      setAiThinking(true)
      run.chatOnly(raw, 'Reading the project and drafting a plan…')
      try {
        const scenario = await callGeminiPlan(taskPrompt, selectedProject)
        scenario.prompt = raw
        send(scenario)
      } catch (err) {
        console.warn('Gemini plan error, fallback to local:', err)
        const scenario = generateScenarioFromPrompt(taskPrompt)
        scenario.prompt = raw
        send(scenario)
      } finally {
        setAiThinking(false)
      }
      return
    }

    // Normal message WITHOUT /plan: Pure conversational terminal chat. The visualizer NEVER opens.
    setAiThinking(true)
    try {
      const reply = await callGeminiChat(raw)
      run.chatOnly(raw, reply)
    } catch (err) {
      console.warn('Gemini chat error, fallback to local:', err)
      const reply = getConversationalReply(raw)
      run.chatOnly(raw, reply)
    } finally {
      setAiThinking(false)
    }
  }

  return (
    <div className={`cc${sidebar ? ' has-sb' : ''}`} role="application" aria-label="Claude Code">
      <div className="lights" aria-hidden>
        <span className="light light--r" />
        <span className="light light--y" />
        <span className="light light--g" />
      </div>
      {sidebar && <Sidebar run={run} onGuide={onGuide} theme={theme} onTheme={onTheme} />}
      <div className="cc__main">
      <div className="cc__chrome">
        <button
          className={`cc__icon${sidebar ? ' is-on' : ''}`}
          aria-label="Toggle sidebar"
          aria-pressed={sidebar}
          onClick={() => setSidebar((v) => !v)}
        >
          <Split size={15} />
        </button>
        <span className="cc__spacer" />
        {run.scenario && !sidebar && (
          <button className="cc__link" onClick={run.reset}>
            New session
          </button>
        )}
      </div>

      <div className="cc__body" ref={scrollRef}>
        {run.messages.length === 0 ? (
          <div className="home">
            <div className="home__hero">
              <div className="home__mark">
                <Sparkle size={24} />
              </div>
              <h1>Claude Code</h1>
              <p className="home__sub">
                Type <code>/plan</code> and a task. I’ll show you the plan first.
              </p>
            </div>

            <Abilities project={selectedProject?.name} />

            <div className="home__examples">
              <span className="home__examples-label">Try it</span>
              <div className="home__pills">
                {CASE_TASKS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    className="home__pill home__pill--main"
                    onClick={() => submitDraft(t.prompt)}
                    title={`Run: ${t.prompt}`}
                  >
                    <span className="home__pill-prefix">/plan</span>
                    <span className="home__pill-text">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="thread">
            <div className="thread__tag">
              <Sparkle size={12} /> {run.scenario ? 'Plan · active' : 'Conversation · active'}
            </div>
            {run.messages.map((m) =>
              m.askKey ? (
                <ChatAsk key={m.id} run={run} stepKey={m.askKey} />
              ) : m.clarify ? (
                <div key={m.id} className="msg msg--ai msg--clar">
                  <Sparkle size={13} className="msg__star" />
                  <ClarifyCard
                    clarify={m.clarify}
                    answered={m.answered}
                    onPick={(o) => pickOption(m.id, o)}
                    onAnswer={(text) => {
                      run.answerClarify(m.id, text)
                      if (m.clarify?.question) run.start(m.clarify.question.answer(text), { keepThread: true })
                    }}
                  />
                </div>
              ) : (
                <Msg key={m.id} role={m.role} text={m.text} tone={m.tone} />
              ),
            )}
            {aiThinking && (
              <div className="msg msg--ai">
                <span className="spinner spinner--sm" aria-hidden />
                <p style={{ color: 'var(--g400)', fontStyle: 'italic' }}>Thinking...</p>
              </div>
            )}
            {run.status === 'running' && <RunningLine run={run} />}

          </div>
        )}
      </div>

      <div className="cc__composer">
        <div className="cc__ctx">
          <button
            type="button"
            className={`ctx ctx--action${!selectedProject ? ' is-empty' : ''}`}
            onClick={onOpenFinder}
            title={selectedProject ? `Active workspace: ${selectedProject.name} (click to open Finder)` : 'Select workspace folder in Finder (required for /plan)'}
          >
            <Folder size={13} />
            <span>{selectedProject ? selectedProject.name : 'Select folder'}</span>
            {selectedProject ? (
              <span className="ctx__tag">{selectedProject.badge}</span>
            ) : (
              <span className="ctx__required">*mandatory for /plan</span>
            )}
          </button>
          <button
            type="button"
            className="ctx ctx--action ctx--icon"
            onClick={onOpenFinder}
            title="Open Finder to select workspace folder"
          >
            <Plus size={13} />
          </button>
        </div>
        <div className="cc__input">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message, or /plan <task> to see the plan first…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitDraft()
              }}
            />
          <button
            type="button"
            className="cc__enter"
            onClick={() => submitDraft()}
            disabled={!draft.trim() || aiThinking}
            style={{ cursor: draft.trim() && !aiThinking ? 'pointer' : 'default', background: 'none', border: 0, padding: 0 }}
            title="Send prompt"
          >
            ⏎
          </button>
        </div>
      </div>
      </div>

      {showOnboarding && (
        <Onboarding
          settings={run.settings}
          canCancel={run.onboarded}
          onCancel={onCloseEditing}
          onDone={(s) => {
            run.setSettings(s)
            run.setOnboarded(true)
            onCloseEditing()
          }}
        />
      )}
    </div>
  )
}

function RunningLine({ run }: { run: Run }) {
  const step = run.steps[run.cursor]
  if (!step) return null
  return (
    <div className="msg msg--tool">
      <span className="spinner spinner--sm" aria-hidden />
      <code>{step.spec.tool ?? step.spec.title}</code>
    </div>
  )
}

function Msg({ role, text, tone }: { role: string; text: string; tone?: string }) {
  if (role === 'user')
    return (
      <div className="msg msg--user">
        <span className="msg__who">You</span>
        <p>{text}</p>
      </div>
    )
  if (role === 'event')
    return (
      <div className={`msg msg--event${tone === 'warn' ? ' is-warn' : tone === 'good' ? ' is-good' : ''}`}>
        <span className="msg__dot" aria-hidden />
        {text}
      </div>
    )
  return (
    <div className={`msg msg--ai${tone === 'warn' ? ' is-warn' : tone === 'good' ? ' is-good' : ''}`}>
      <Sparkle size={13} className="msg__star" />
      <p>{text}</p>
    </div>
  )
}
