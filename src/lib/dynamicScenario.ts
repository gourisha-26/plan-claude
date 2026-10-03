import { V } from '../data/copy'
import type { DataFile, Decision, Evidence, Scenario, StepSpec, TriggerId, Voiced } from '../data/types'

const safe = (id: string, title: string, plain: Voiced, tool: string, sensitive = false): StepSpec => ({
  id,
  title,
  plain,
  tier: 'safe',
  triggers: [],
  tool,
  sensitive,
})

type PromptCategory = 'database' | 'cloud' | 'security' | 'filesystem' | 'messaging' | 'code' | 'benign'

interface PromptAnalysis {
  category: PromptCategory
  isDestructive: boolean
  isSacred: boolean
  isBenign: boolean
  targetNoun: string
  verb: string
  confirmPhrase: string
  triggers: TriggerId[]
}

export function analyzePrompt(raw: string): PromptAnalysis {
  const p = raw.toLowerCase().trim()

  // Benign keywords
  const benignPatterns = [
    /^(explain|how\s+to|what\s+is|describe|why|search|find|list|show|count|check|lint|format|beautify|summarize)\b/,
    /\b(documentation|readme|tutorial|guide)\b/,
  ]
  const isBenign = benignPatterns.some((pattern) => pattern.test(p)) && !/(drop|delete|wipe|purge|remove|kill|truncate|grant\s+root)\b/.test(p)

  if (isBenign) {
    const target = p.replace(/^(explain|how\s+to|what\s+is|describe|search|find|list|show|count|format)\s+/, '').slice(0, 30) || 'requested task'
    return {
      category: 'benign',
      isDestructive: false,
      isSacred: false,
      isBenign: true,
      targetNoun: target,
      verb: 'Inspect and process',
      confirmPhrase: 'PROCEED',
      triggers: [],
    }
  }

  // Security / Safety Setting (Trigger 4 & sacred)
  if (/(disable|bypass|turn\s*off|grant\s*admin|grant\s*root|sudo|elevate|chmod\s*777|api[_\s-]?key|secret|token|perm(ission)?)\b/.test(p)) {
    return {
      category: 'security',
      isDestructive: false,
      isSacred: true,
      isBenign: false,
      targetNoun: extractTarget(p, ['admin', 'root', 'permission', 'security rule', 'api key', 'access policy']) || 'security setting',
      verb: 'Elevate privileges & alter safety configuration',
      confirmPhrase: 'GRANT-ACCESS',
      triggers: [4, 3],
    }
  }

  // Database drops / destructive queries
  if (/(drop|truncate|delete\s+from|alter\s+table|database|table|sql|postgres|mysql|mongo|collection|schema)\b/.test(p)) {
    const isMassive = /(all|prod|production|cluster|cascade|\*)/.test(p)
    return {
      category: 'database',
      isDestructive: true,
      isSacred: isMassive,
      isBenign: false,
      targetNoun: extractTarget(p, ['users', 'patients', 'orders', 'records', 'database', 'table', 'schema']) || 'production table',
      verb: 'Drop and purge data table',
      confirmPhrase: 'DROP-DATA',
      triggers: isMassive ? [1, 2, 3] : [1, 2],
    }
  }

  // Cloud / Infrastructure / S3 / K8s / Containers
  if (/(s3|bucket|aws|k8s|kubernetes|docker|container|cluster|pod|ec2|deploy|cloud|terminate)\b/.test(p)) {
    const isMassive = /(all|prod|production|cluster|every|\*)/.test(p)
    return {
      category: 'cloud',
      isDestructive: /(delete|remove|wipe|terminate|kill|purge)\b/.test(p),
      isSacred: isMassive,
      isBenign: false,
      targetNoun: extractTarget(p, ['s3 bucket', 'cluster', 'containers', 'pods', 'ec2 instance', 'deployment']) || 'cloud resources',
      verb: 'Terminate and dismantle cloud infrastructure',
      confirmPhrase: 'WIPE-INFRA',
      triggers: isMassive ? [1, 3] : [1],
    }
  }

  // Bulk Messaging / Email blasts
  if (/(email|mail|send|blast|broadcast|notify|sms|newsletter|marketing)\b/.test(p)) {
    return {
      category: 'messaging',
      isDestructive: true, // external real-world action cannot be un-sent
      isSacred: /(all|every|unverified|inactive|5000|10000)/.test(p),
      isBenign: false,
      targetNoun: extractTarget(p, ['subscribers', 'customers', 'users', 'recipients', 'patient emails']) || 'recipient list',
      verb: 'Broadcast unthrottled outbound campaign',
      confirmPhrase: 'SEND-BROADCAST',
      triggers: [1, 2],
    }
  }

  // Filesystem wipes / log deletions
  if (/(rm\s+-rf|wipe|purge|prune|clean|delete|erase|format)\b/.test(p)) {
    const isMassive = /(all|root|\/|disk|prod|logs|everything|\*)/.test(p)
    return {
      category: 'filesystem',
      isDestructive: true,
      isSacred: isMassive,
      isBenign: false,
      targetNoun: extractTarget(p, ['system logs', 'archive directory', 'disk partition', 'cache', 'temp files']) || 'target directory',
      verb: 'Permanently remove target files from filesystem',
      confirmPhrase: 'PURGE-FILES',
      triggers: isMassive ? [1, 3] : [1],
    }
  }

  // Code / Git
  if (/(git|branch|merge|force|rebase|push|repo|commit)\b/.test(p)) {
    const isForce = /(force|-f|hard|reset|main|master|prod)/.test(p)
    return {
      category: 'code',
      isDestructive: isForce,
      isSacred: isForce,
      isBenign: false,
      targetNoun: extractTarget(p, ['main branch', 'production release', 'git history', 'repository']) || 'code repository',
      verb: 'Force push and overwrite history',
      confirmPhrase: 'FORCE-PUSH',
      triggers: isForce ? [1, 3] : [1],
    }
  }

  // General fallback
  const isDestr = /(delete|remove|kill|wipe|drop|clear|destroy|reset)\b/.test(p)
  return {
    category: 'filesystem',
    isDestructive: isDestr,
    isSacred: isDestr && /(all|every|prod|root|\*)/.test(p),
    isBenign: !isDestr,
    targetNoun: p.slice(0, 24) || 'system resources',
    verb: isDestr ? 'Delete selected target' : 'Modify configuration',
    confirmPhrase: isDestr ? 'CONFIRM-DELETE' : 'PROCEED',
    triggers: isDestr ? [1] : [],
  }
}

function extractTarget(p: string, candidates: string[]): string | null {
  for (const c of candidates) {
    if (p.includes(c)) return c
  }
  return null
}

/**
 * Detect whether the user's input is an actionable engineering task that needs a plan,
 * vs. conversational chit-chat, greetings, or questions that should just be answered directly.
 */
export function isActionableTask(raw: string): boolean {
  const p = raw.toLowerCase().trim()
  if (!p) return false

  // Pure greetings / social
  if (/^(hi|hello|hey|yo|sup|greetings|howdy|good\s*(morning|afternoon|evening|day))(\s*[!.]*)?$/i.test(p)) {
    return false
  }

  // Pure thanks / acknowledgements / closing
  if (/^(thanks|thank\s*you|thx|cool|nice|ok|okay|great|awesome|bye|goodbye|cya)(\s*[!.]*)?$/i.test(p)) {
    return false
  }

  // Meta / capability questions
  if (
    /^(who\s+are\s+you|what\s+are\s+you|what\s+is\s+this|what\s+can\s+you\s+do|how\s+do\s+you\s+work|tell\s+me\s+about\s+yourself|help)(\s*[?!.]*)?$/i.test(
      p
    )
  ) {
    return false
  }

  // Conversational questions without action
  if (/^(how\s+are\s+you|what('s|\s+is)\s+up|how('s|\s+is)\s+it\s+going)(\s*[?!.]*)?$/i.test(p)) {
    return false
  }

  // Very short non-command inputs (< 4 chars)
  if (p.length <= 3 && !['rm', 'cp', 'mv', 'ls'].includes(p)) {
    return false
  }

  return true
}

/**
 * Generate an instant conversational reply for non-task inputs.
 */
export function getConversationalReply(raw: string): string {
  const p = raw.toLowerCase().trim()

  if (/^(hi|hello|hey|yo|sup|howdy|good\s*(morning|afternoon|evening|day))/i.test(p)) {
    return "Hello! I'm Claude Code with PLAN. You can chat with me here, or start a task with `/plan <task>` (e.g. `/plan drop production database table users`) to activate the PLAN visualizer."
  }

  if (/^(who\s+are\s+you|what\s+are\s+you|what\s+is\s+this|what\s+can\s+you\s+do)/i.test(p)) {
    return "I am Claude Code with an active PLAN layer. For general questions, we can chat normally here. To launch and visualize a supervised execution plan, type `/plan <task>`."
  }

  if (/^help/i.test(p)) {
    return "To open the PLAN visualizer, type `/plan` followed by any task:\n• `/plan drop production database table users`\n• `/plan delete all unused s3 buckets in us-east-1`\n• `/plan grant root admin access to guest account`\n• `/plan wipe temporary logs older than 30 days`\n• `/plan format and lint codebase`\n\nNormal questions and chat can be typed directly without `/plan`."
  }

  if (/^(thanks|thank\s*you|thx|cool|nice|ok|okay|great|awesome)/i.test(p)) {
    return "You're welcome! Whenever you want to test the visualization pipeline, just type `/plan <task>`."
  }

  return "I'm ready. Chat with me normally, or type `/plan <task>` to generate and visualize a supervised safety plan."
}

/**
 * Generate a dynamic scenario adapted to the user's free-form prompt.
 */
export function generateScenarioFromPrompt(prompt: string): Scenario {
  const trimmed = prompt.trim()
  const analysis = analyzePrompt(trimmed)
  const id = `dyn-${Date.now()}`
  const shortPrompt = trimmed.length > 40 ? trimmed.slice(0, 38) + '…' : trimmed

  // 1. BENIGN CASE: No risky steps, clean 3-step inspection & execution
  if (analysis.isBenign) {
    return {
      id,
      prompt: trimmed,
      chip: shortPrompt,
      failure: 'No risk detected - safe read-only execution.',
      proves: 'Safe workflows execute smoothly without unnecessary interruptions.',
      reply: V(
        `I can help with that. I've mapped out a quick 3-step inspection plan on the right. Nothing here changes or destroys any data.`,
        `Analyzing request: "${trimmed}". The execution plan is ready on the right. All operations are safe and read-only.`,
        `Safe execution plan queued. Operations are idempotent and read-only. Commencing execution.`
      ),
      steps: [
        safe(`${id}-1`, `Analyze scope for ${analysis.targetNoun}`, V('Inspects source files and requirements.', 'Scans the relevant files and metadata.', 'Stat and parse target files into memory.'), 'Inspect · analyze scope', false),
        safe(`${id}-2`, `Process and format response`, V('Generates the requested explanation and examples cleanly.', 'Processes data and formats output structure.', 'Evaluates AST and synthesizes formatted output.'), 'Compute · generate artifact', false),
        safe(`${id}-3`, `Finalize output verification`, V('Checks output for accuracy and readiness.', 'Verifies consistency and validates result.', 'Lint and run assertion checks.'), 'Verify · completed', false),
      ],
      outcome: {
        approve: 'Finished - all steps verified safely.',
        safer: 'Finished - all steps completed.',
      },
    }
  }

  // 2. RISKY / DESTRUCTIVE CASE: 3 to 4 steps with a stopping or sacred decision
  return buildRiskyScenario(id, trimmed, shortPrompt, analysis)
}

function buildRiskyScenario(id: string, prompt: string, chip: string, a: PromptAnalysis): Scenario {
  const triggers = a.triggers.length ? a.triggers : ([1] as TriggerId[])
  const tier = a.isSacred ? 'sacred' : 'stop'

  const decision = buildDynamicDecision(prompt, a)

  const steps: StepSpec[] = [
    safe(
      `${id}-1`,
      `Inspect ${a.targetNoun} state`,
      V(
        `Examines current state of ${a.targetNoun} to see what exists. Nothing is modified.`,
        `Inspects target ${a.targetNoun} and compiles active identifiers. Read-only.`,
        `Query metadata catalog for ${a.targetNoun}. Dry-run discovery only.`
      ),
      `Read · inspect ${a.targetNoun}`,
      triggers.includes(2)
    ),
    safe(
      `${id}-2`,
      `Stage target operations and compute blast radius`,
      V(
        `Prepares the exact changes in memory and measures potential impact.`,
        `Stages changes to scratch buffer and computes impact metrics.`,
        `Compute delta manifest and dependency tree.`
      ),
      `Analyze · calculate blast radius`,
      triggers.includes(2)
    ),
    {
      id: `${id}-3`,
      title: `${a.verb} (${a.targetNoun})`,
      plain: V(
        `Executes the critical operation on ${a.targetNoun}. This cannot be undone once started.`,
        `Applies the destructive change to ${a.targetNoun}. Irreversible operation.`,
        `Execute write operation on live target: ${a.targetNoun}.`
      ),
      tier,
      triggers,
      preview: V(
        `This step makes permanent changes that affect real system resources. It will stop and ask you before proceeding.`,
        `High-impact gated step. Requires manual authorization because it triggers safety rules.`,
        `Gated step triggered by policies [${triggers.join(', ')}]. Non-delegable confirmation barrier.`
      ),
      tool: decision.technicalNote || `execute · ${a.targetNoun}`,
      decision,
      followUps: {
        approve: [
          safe(`${id}-post`, `Write audit record & update telemetry`, V('Logs what was modified for compliance tracking.', 'Appends entry to audit trail.', 'Emit audit event to secure log stream.'), 'Audit · record event'),
        ],
        safer: [
          safe(`${id}-backup`, `Create snapshot archive`, V('Safely clones current data to a backup archive first.', 'Creates snapshot archive in cold storage.', 'Create point-in-time snapshot before scoped update.'), 'Snapshot · backup saved'),
        ],
      },
    },
    safe(
      `${id}-4`,
      `Verify system consistency`,
      V(
        `Checks that the system remains healthy and logs the result.`,
        `Runs health checks on related services to verify stability.`,
        `Assert system integrity and post-execution invariants.`
      ),
      `Verify · health check`
    ),
  ]

  return {
    id,
    prompt,
    chip,
    failure: `Destructive operation with potential collateral impact: "${prompt}".`,
    proves: 'Stopping barrier gives full visibility and a safer alternative before execution.',
    reply: V(
      `I understand you want to "${prompt}". Because this action has serious consequences, I have created a guarded plan on the right. Step 3 will stop and wait for your explicit decision.`,
      `I've formulated the execution plan for "${prompt}". High-risk steps are gated on the right and require verification before proceeding.`,
      `Plan generated for requested operation. Destructive mutations gated under Triggers [${triggers.join(', ')}]. Plan paused on the right awaiting supervisor review.`
    ),
    steps,
    outcome: {
      approve: 'Executed - destructive operation confirmed and logged.',
      safer: 'Protected - safer alternative adopted with zero accidental loss.',
    },
  }
}

function buildDynamicDecision(prompt: string, a: PromptAnalysis): Decision {
  const category = a.category

  // 1. Evidence synthesis based on category
  let evidence: Evidence

  if (category === 'database') {
    evidence = {
      kind: 'schema',
      caption: `Impact analysis for table: ${a.targetNoun}`,
      table: a.targetNoun.replace(/\s+/g, '_'),
      rows: '1,240 rows affected',
      columns: [
        { name: 'id', sample: 'uuid-4821', fate: 'destroyed' },
        { name: 'account_data', sample: 'JSON payload (encrypted)', fate: 'destroyed' },
        { name: 'created_at', sample: '2024-01-15 09:30:00', fate: 'destroyed' },
        { name: 'status', sample: 'active', fate: 'destroyed' },
      ],
    }
  } else if (category === 'security') {
    evidence = {
      kind: 'setting',
      caption: `Security permission state transition`,
      setting: `Access Control / Privilege Level for ${a.targetNoun}`,
      before: 'Role: Standard (Read/Write sandbox)',
      after: 'Role: Root Superadmin (Unrestricted)',
      history: 'Elevated role bypasses MFA checks and deletion confirmation barriers.',
    }
  } else if (category === 'cloud') {
    evidence = {
      kind: 'proof',
      caption: `Target cloud resources scheduled for removal`,
      rows: [
        { label: `${a.targetNoun} primary instance`, value: 'Running · Contains live state', status: 'bad' },
        { label: 'Attached persistent storage', value: '450 GB NVMe volume', status: 'bad' },
        { label: 'Dependent load balancer', value: 'Receiving 120 req/sec', status: 'bad' },
        { label: 'Automated snapshot backup', value: 'Last taken 18 hours ago', status: 'unknown' },
      ],
    }
  } else if (category === 'messaging') {
    evidence = {
      kind: 'group',
      caption: `Recipients matched by current query filter`,
      sharedLabel: 'Target Cohort',
      sharedValue: 'All Registered Accounts (Unsegmented)',
      members: [
        { name: 'Dr. Sarah Lin', role: 'Active subscriber', detail: 'Received 2 emails this week' },
        { name: 'Mark Davis', role: 'Unsubscribed 3 days ago', detail: 'Will receive email despite unsubscribe' },
        { name: 'Dr. Anita Patel', role: 'Staff Doctor', detail: 'Internal test recipient' },
        { name: '+ 4,892 others', role: 'Bulk audience', detail: 'Unverified delivery status' },
      ],
      verdict: 'Sending to unsegmented list violates anti-spam rate policies.',
    }
  } else {
    evidence = {
      kind: 'proof',
      caption: `Filesystem impact analysis for ${a.targetNoun}`,
      rows: [
        { label: 'Target Directory / Resource', value: `/var/data/${a.targetNoun.replace(/\s+/g, '_')}`, status: 'bad' },
        { label: 'Files matching criteria', value: '3,842 files (14.2 GB)', status: 'bad' },
        { label: 'Uncommitted work files', value: '14 files modified today', status: 'bad' },
        { label: 'Recycle bin fallback', value: 'Disabled (permanent unlink)', status: 'bad' },
      ],
    }
  }

  // 2. DataFiles synthesis for Dummy Run Drawer
  const dataFiles: DataFile[] = [
    {
      path: `production/${a.targetNoun.replace(/\s+/g, '_')}.conf`,
      kind: 'config',
      note: `Modifies operational state of ${a.targetNoun}`,
      scope: 'Active production system',
      diff: [
        { type: 'ctx', text: '  # Production service configuration' },
        { type: 'ctx', text: `  target_entity = "${a.targetNoun}"` },
        { type: 'del', text: '  protection_lock: enabled' },
        { type: 'del', text: '  safe_mode: true' },
        { type: 'add', text: '  protection_lock: bypassed' },
        { type: 'add', text: '  safe_mode: false' },
      ],
      impact: `Removes active safety barriers on ${a.targetNoun}`,
      destructive: true,
    },
    {
      path: `data/${a.targetNoun.replace(/\s+/g, '_')}_manifest.json`,
      kind: 'database',
      note: 'Live record index',
      scope: 'Entire dataset',
      diff: [
        { type: 'ctx', text: '  "active_records": 1240,' },
        { type: 'del', text: '  "status": "online"' },
        { type: 'add', text: '  "status": "terminated_or_purged"' },
      ],
      impact: 'Target records marked permanently unrecoverable',
      destructive: true,
    },
  ]

  // 3. Technical commands and phrases
  const confirmPhrase = a.confirmPhrase
  const saferLabel =
    category === 'database'
      ? 'Soft-delete with active=false flag'
      : category === 'security'
        ? 'Grant scoped temporary token (1 hour)'
        : category === 'cloud'
          ? 'Archive to cold storage & pause instance'
          : category === 'messaging'
            ? 'Test send to 5 staff accounts first'
            : 'Move to quarantine archive folder first'

  const saferDetail =
    category === 'database'
      ? 'Keeps all rows safe in the table, merely hiding them from views. Can be reversed in 1 second.'
      : category === 'security'
        ? 'Grants limited access with automatic expiration. No permanent escalation.'
        : category === 'cloud'
          ? 'Stops billing by snapshotting disk to glacier before shutting down instances.'
          : category === 'messaging'
            ? 'Sends a live test batch to internal team members so formatting and links can be verified.'
            : 'Moves files to a temporary holding folder with automatic purge after 7 days.'

  return {
    understood: V(
      `You asked me to "${prompt}". I interpreted this as an immediate, irreversible execution on ${a.targetNoun}.`,
      `Parsed intent: "${prompt}". Proceeding with live modification of ${a.targetNoun}.`,
      `Request parsed: [${prompt}]. Target: ${a.targetNoun}. Blast radius assessment triggered.`
    ),
    action: V(
      `I am preparing to permanently apply changes to ${a.targetNoun}.`,
      `Executing destructive mutation across ${a.targetNoun}.`,
      `Direct live mutation against production resource: ${a.targetNoun}.`
    ),
    rule: V(
      `Safety Rule: Any command targeting production or requesting broad deletion must be confirmed with an exact consequence phrase.`,
      `Policy 4.2: High-blast-radius operations require explicit confirmation or scoped alternative selection.`,
      `Rule: Triggered Triggers [${a.triggers.join(', ')}] require explicit supervisor approval token.`
    ),
    evidence,
    cost: {
      reversible: false,
      casualty: V(
        `Destroys active state for ${a.targetNoun}. Cannot be restored without external backups.`,
        `Permanent loss of data or elevation of critical safety privileges.`,
        `Non-reversible live mutation. Recovery SLA > 4 hours.`
      ),
      detail: V(
        'Once executed, all active records and configurations will be dropped or updated in place.',
        'Affects all dependent processes and queries accessing this resource.',
        'Cascading impact on downstream consumers.'
      ),
    },
    safer: {
      label: V(saferLabel, saferLabel, `Scoped mitigation: ${saferLabel}`),
      detail: V(saferDetail, saferDetail, saferDetail),
      resultTitle: `${saferLabel}`,
      resultNote: `Executed safe alternative: ${saferLabel}. Zero data lost.`,
    },
    approveResultNote: `Approved and executed: ${a.verb} on ${a.targetNoun}.`,
    confirmPhrase,
    dataFiles,
    technicalNote:
      category === 'database'
        ? `psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS ${a.targetNoun.replace(/\s+/g, '_')} CASCADE;"`
        : category === 'cloud'
          ? `aws s3 rb s3://${a.targetNoun.replace(/\s+/g, '-')} --force`
          : category === 'security'
            ? `auth-cli grant --role superadmin --user "${a.targetNoun}" --bypass-mfa`
            : `rm -rf /var/data/${a.targetNoun.replace(/\s+/g, '_')}/*`,
  }
}
