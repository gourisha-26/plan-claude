import { V, simplifyForBeginner } from '../data/copy'
import type { ProjectTemplate } from '../data/projects'
import type { DataFile, Decision, Evidence, Scenario, StepSpec, TriggerId } from '../data/types'
import { generateScenarioFromPrompt } from './dynamicScenario'

const STORAGE_KEY = 'gemini_api_key'
const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite']

export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored.trim()) return stored.trim()
  }
  const envKey = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY) ?? ''
  if (envKey && envKey.trim()) return envKey.trim()
  return ''
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return
  if (!key.trim()) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, key.trim())
  }
}

export function hasGeminiApiKey(): boolean {
  return Boolean(getGeminiApiKey())
}

/**
 * Call Gemini for conversational chat queries with automatic model fallback.
 */
export async function callGeminiChat(userPrompt: string): Promise<string> {
  const apiKey = getGeminiApiKey()

  const systemInstruction = `You are Claude Code, an agentic coding assistant with an automated PLAN layer.
Respond helpfully, concisely, and accurately in 1-3 sentences.
The PLAN visualizer is activated specifically when the user types "/plan <task>" (e.g. "/plan drop production database table users").
If the user asks you to execute an engineering task, run dangerous commands, or requests a plan, answer concisely and mention that they can type "/plan <task>" to open the visual execution pipeline.
Never include markdown headers; keep it conversational like a terminal assistant.`

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (reply) return reply.trim()
      } else {
        console.warn(`Gemini model ${model} responded with status ${response.status}, trying next model...`)
      }
    } catch (err) {
      console.warn(`Gemini model ${model} failed:`, err)
    }
  }

  throw new Error('All Gemini models failed or timed out')
}

interface GeminiPlanResponse {
  chip: string
  reply: string
  replyBeginner?: string
  failure: string
  proves: string
  category: 'database' | 'cloud' | 'security' | 'filesystem' | 'messaging' | 'code' | 'benign'
  isRisky: boolean
  isSacred: boolean
  triggers: number[]
  steps: {
    title: string
    plain: string
    plainBeginner?: string
    tool: string
    tier: 'safe' | 'stop' | 'sacred'
    triggers: number[]
    sensitive?: boolean
  }[]
  decision?: {
    understood: string
    understoodBeginner?: string
    action: string
    actionBeginner?: string
    rule: string
    ruleBeginner?: string
    confirmPhrase: string
    cost: {
      reversible: boolean
      casualty: string
      casualtyBeginner?: string
      detail: string
      detailBeginner?: string
    }
    safer: {
      label: string
      labelBeginner?: string
      detail: string
      detailBeginner?: string
      resultTitle: string
      resultNote: string
    }
    evidenceType: 'schema' | 'setting' | 'proof' | 'group' | 'pairs'
    evidenceSummary: string
    dataFiles: {
      path: string
      kind: 'database' | 'code' | 'config'
      note: string
      scope: string
      impact: string
      diff: { type: 'ctx' | 'add' | 'del'; text: string }[]
    }[]
  }
}

/**
 * Call Gemini to intelligently analyze any custom prompt and synthesize a realistic plan.
 */
export async function callGeminiPlan(userPrompt: string, projectContext?: ProjectTemplate): Promise<Scenario> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return generateScenarioFromPrompt(userPrompt)
  }

  const folderInfo = projectContext
    ? `\nActive Workspace Folder: "${projectContext.name}" (${projectContext.description})
Available Files in Workspace: ${projectContext.files.join(', ')}
Ensure that the planned steps, commands, and dataFiles specifically reference files located inside the "${projectContext.name}" project.`
    : ''

  const prompt = `You are the safety planner for Claude Code PLAN.
Analyze this user prompt: "${userPrompt}"${folderInfo}

IMPORTANT PLAN PRINCIPLE:
Users frequently submit routine, innocent-sounding development requests without realizing that an autonomous coding agent might choose a naive or dangerous implementation with massive hidden casualties:
- "clean up test accounts and sync DB" -> naive agent plans an automated schema reset or table drop that wipes live user data and audit foreign keys.
- "free up storage space and clear old logs" -> naive agent runs recursive deletions that wipe permanent compliance audit trails (e.g. audit.log).
- "add a blood group field to patient form" -> naive agent rebuilds the entire table from a partial schema, dropping years of clinical notes columns.
- "quieten down notification popups" -> naive agent batches and disables the confirm_before_delete guard.

Detect the hidden blast radius, casualty, and scope mismatch in the user's request.
Always begin with 1-2 safe inspection steps (tier: "safe"), followed by a critical gated step (tier: "stop" or "sacred") that stops execution, explains the hidden danger, and offers a safer, surgical alternative.

Output JSON matching this exact structure:
{
  "chip": "Short 2-4 word title",
  "reply": "1-2 sentence response acknowledging the request and describing the safety plan",
  "failure": "What would go wrong if this executed unverified",
  "proves": "What the safety barrier prevents or verifies",
  "category": "database" | "cloud" | "security" | "filesystem" | "messaging" | "code" | "benign",
  "isRisky": true/false,
  "isSacred": true/false (true if touching root credentials, broad wildcard destruction, or disabling safety rules),
  "triggers": [1, 2, 3, 4] (1=irreversible, 2=sensitive data, 3=bigger than ask, 4=changes safety setting),
  "steps": [
    {
      "title": "Short title",
      "plain": "Plain English explanation of what it does",
      "tool": "terminal command or query",
      "tier": "safe" | "stop" | "sacred",
      "triggers": [1, 2, 3, 4],
      "sensitive": true/false
    }
  ],
  "decision": {
    "understood": "What Claude understood",
    "action": "The exact critical action about to happen",
    "rule": "The safety policy governing this",
    "confirmPhrase": "UPPERCASE-CONFIRMATION-PHRASE",
    "cost": {
      "reversible": false,
      "casualty": "Summary of data/resource destroyed",
      "detail": "Detailed blast radius"
    },
    "safer": {
      "label": "Alternative safer action",
      "detail": "Why this safer action protects data",
      "resultTitle": "Safer title",
      "resultNote": "Post-execution note"
    },
    "evidenceType": "schema" | "setting" | "proof" | "group",
    "evidenceSummary": "Summary of evidence",
    "dataFiles": [
      {
        "path": "path/to/affected_file.ext",
        "kind": "database" | "code" | "config",
        "note": "what this file does",
        "scope": "scope of impact",
        "impact": "impact on file",
        "diff": [
          {"type": "ctx", "text": "unchanged line"},
          {"type": "del", "text": "- removed line"},
          {"type": "add", "text": "+ added line"}
        ]
      }
    ]
  }
}

Important rules:
- Generate 3 to 4 sequential steps.
- The first 1-2 steps must be safe discovery / staging.
- If the task is destructive or high impact, the 3rd step MUST be tier "stop" or "sacred" with the "decision" block filled.
- If the task is completely safe and read-only, all steps must be "safe" with empty triggers, and decision can be omitted.`

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!response.ok) {
        console.warn(`Gemini model ${model} plan generation failed with status ${response.status}, trying next model...`)
        continue
      }

      const data = await response.json()
      const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawJson) continue

      const parsed: GeminiPlanResponse = JSON.parse(rawJson)
      return convertGeminiResponseToScenario(userPrompt, parsed)
    } catch (err) {
      console.warn(`Error during Gemini ${model} plan generation:`, err)
    }
  }

  // Graceful local fallback if all models or network are unavailable
  return generateScenarioFromPrompt(userPrompt)
}

function convertGeminiResponseToScenario(prompt: string, g: GeminiPlanResponse): Scenario {
  const id = `gemini-${Date.now()}`

  // Build steps
  const steps: StepSpec[] = g.steps.map((st, i) => {
    const stepId = `${id}-${i + 1}`
    const triggers = (st.triggers || []) as TriggerId[]
    const beginnerStepPlain = st.plainBeginner || simplifyForBeginner(st.plain)

    if (st.tier === 'safe') {
      return {
        id: stepId,
        title: st.title,
        plain: V(beginnerStepPlain, st.plain, st.plain),
        tier: 'safe',
        triggers: [],
        tool: st.tool,
        sensitive: st.sensitive ?? false,
      }
    }

    // Gated decision step
    let decision: Decision | undefined = undefined
    if (g.decision) {
      const gd = g.decision
      let evidence: Evidence

      if (gd.evidenceType === 'setting') {
        evidence = {
          kind: 'setting',
          caption: gd.evidenceSummary || 'Security state transition',
          setting: 'Access permission policy',
          before: 'Restricted / Standard role',
          after: 'Elevated / Unrestricted permissions',
          history: 'Requires supervisor override',
        }
      } else if (gd.evidenceType === 'schema') {
        evidence = {
          kind: 'schema',
          caption: gd.evidenceSummary || 'Schema mutation delta',
          table: 'production_table',
          rows: 'Affected rows',
          columns: [
            { name: 'primary_key', sample: 'id-001', fate: 'destroyed' },
            { name: 'payload_data', sample: 'active record', fate: 'destroyed' },
            { name: 'timestamp', sample: '2024-01-01', fate: 'destroyed' },
          ],
        }
      } else {
        evidence = {
          kind: 'proof',
          caption: gd.evidenceSummary || 'Live resource impact verification',
          rows: [
            { label: 'Target Resource', value: 'Production entity', status: 'bad' },
            { label: 'Active Dependents', value: 'In-use by 14 services', status: 'bad' },
            { label: 'Data Recovery Point', value: 'None configured', status: 'bad' },
          ],
        }
      }

      const dataFiles: DataFile[] = (gd.dataFiles || []).map((df) => ({
        path: df.path,
        kind: df.kind,
        note: df.note,
        scope: df.scope,
        impact: df.impact,
        destructive: true,
        diff: df.diff || [
          { type: 'ctx', text: '# live resource target' },
          { type: 'del', text: '- active_state: running' },
          { type: 'add', text: '+ active_state: terminated' },
        ],
      }))

      decision = {
        understood: V(
          gd.understoodBeginner || simplifyForBeginner(gd.understood),
          gd.understood,
          gd.understood
        ),
        action: V(
          gd.actionBeginner || simplifyForBeginner(gd.action),
          gd.action,
          gd.action
        ),
        rule: V(
          gd.ruleBeginner || simplifyForBeginner(gd.rule),
          gd.rule,
          gd.rule
        ),
        evidence,
        cost: {
          reversible: gd.cost?.reversible ?? false,
          casualty: V(
            gd.cost?.casualtyBeginner || simplifyForBeginner(gd.cost?.casualty ?? 'Destructive mutation'),
            gd.cost?.casualty ?? 'Destructive mutation',
            gd.cost?.casualty ?? 'Destructive mutation'
          ),
          detail: V(
            gd.cost?.detailBeginner || simplifyForBeginner(gd.cost?.detail ?? 'Live change'),
            gd.cost?.detail ?? 'Live change',
            gd.cost?.detail ?? 'Live change'
          ),
        },
        safer: {
          label: V(
            gd.safer?.labelBeginner || simplifyForBeginner(gd.safer?.label ?? 'Safe alternative'),
            gd.safer?.label ?? 'Safe alternative',
            gd.safer?.label ?? 'Safe alternative'
          ),
          detail: V(
            gd.safer?.detailBeginner || simplifyForBeginner(gd.safer?.detail ?? 'Preserves data'),
            gd.safer?.detail ?? 'Preserves data',
            gd.safer?.detail ?? 'Preserves data'
          ),
          resultTitle: gd.safer?.resultTitle ?? 'Safe path executed',
          resultNote: gd.safer?.resultNote ?? 'Executed alternative with zero data loss.',
        },
        approveResultNote: `Approved: ${st.title}`,
        confirmPhrase: gd.confirmPhrase || 'CONFIRM-ACTION',
        dataFiles: dataFiles.length ? dataFiles : [
          {
            path: 'manifest.json',
            kind: 'config',
            note: 'Configuration manifest',
            scope: 'Live production target',
            impact: 'State altered',
            destructive: true,
            diff: [
              { type: 'ctx', text: 'target: active' },
              { type: 'del', text: '- status: ok' },
              { type: 'add', text: '+ status: purged' },
            ],
          },
        ],
        technicalNote: st.tool,
      }
    }

    return {
      id: stepId,
      title: st.title,
      plain: V(beginnerStepPlain, st.plain, st.plain),
      tier: st.tier,
      triggers,
      tool: st.tool,
      decision,
      followUps: {
        approve: [
          {
            id: `${stepId}-audit`,
            title: 'Record audit log & metric telemetry',
            plain: V('Logs changes made to history records.', 'Records event in audit log.', 'Emit immutable audit record.'),
            tier: 'safe',
            triggers: [],
            tool: 'Audit · record event',
          },
        ],
        safer: [
          {
            id: `${stepId}-backup`,
            title: 'Create safe snapshot backup',
            plain: V('Backs up current data before applying scoped changes.', 'Clones data to snapshot storage.', 'Create point-in-time backup snapshot.'),
            tier: 'safe',
            triggers: [],
            tool: 'Snapshot · backup saved',
          },
        ],
      },
    }
  })

  return {
    id,
    prompt,
    chip: g.chip || prompt.slice(0, 30),
    failure: g.failure || 'Unverified execution with potential data loss',
    proves: g.proves || 'Safety gate intercepts high impact actions',
    reply: V(g.replyBeginner || simplifyForBeginner(g.reply), g.reply, g.reply),
    steps,
    outcome: {
      approve: 'Executed - confirmed by user.',
      safer: 'Protected - safer route chosen with zero data lost.',
    },
  }
}
