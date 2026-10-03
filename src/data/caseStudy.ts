import { V } from './copy'
import type { Decision, Scenario, StepSpec, Voiced } from './types'

/**
 * The scenarios from the PLAN case study (MIT-ID Hackathon 2026).
 *
 * A designer works on their portfolio, which now has a small print shop. Two tasks show where
 * PLAN steps in - each prompt leaves one decision unsaid, the agent finds out, and asks - and
 * four short requests show what the agent does when it isn't sure: vague, missing info, a
 * clash, and outside its limits.
 */

const safe = (id: string, title: string, plain: Voiced, tool: string, extra: Partial<StepSpec> = {}): StepSpec => ({
  id,
  title,
  plainTitle: title,
  plain,
  tier: 'safe',
  triggers: [],
  tool,
  ...extra,
})

/* ------------------------------------------------------------------ *
 * "Make the checkout button bigger" - the button is shared by 14 screens.
 * Nobody said "only checkout" or "everywhere"; the agent finds out, and asks.
 * ------------------------------------------------------------------ */

const SCREENS = [
  'Checkout', 'Home', 'Work', 'Case study', 'About', 'Contact', 'Shop',
  'Print page', 'Cart', 'Order done', 'Newsletter', 'Search', 'Sign in', 'Not found',
]

const sharedButton: Decision = {
  question: V('This button is used on 14 screens.', 'This button is shared by 14 screens.', 'Button is a shared component - 14 screens.'),
  understood: V(
    'You want checkout to stand out, and the rest of the site to stay consistent.',
    'You want a bigger checkout button, with the site kept consistent.',
    'Request: enlarge the checkout CTA; keep the design system consistent.',
  ),
  action: V('Making it bigger here makes it bigger on all 14 screens.', 'Changing it changes all 14 screens.', 'Editing Button.tsx updates 14 screens.'),
  explain: {
    happens: V(
      'If I make it bigger, it gets bigger on all 14 screens - including Sign in, Newsletter and Not found.',
      'Changing the button changes it on all 14 screens, not just checkout.',
      'Editing <Button variant="primary"> changes 14 screens.',
    ),
    risky: V('Easy to undo, but it changes 13 screens you didn’t mention.', 'Reversible - but 13 screens change that you didn’t ask about.', 'Reversible; 13 screens out of scope.'),
    assumed: V(
      'You said “keep the rest consistent”. That could mean all buttons match - or nothing else changes.',
      '“Keep it consistent” could mean change everywhere, or change nothing else.',
      '“Consistent” is ambiguous: global change vs. scoped variant.',
    ),
    headsUp: V(
      'You said “keep the rest consistent” - I’m not sure if that means change everywhere, or change nothing else.',
      'You said “keep the rest consistent” - I’m not sure if you want all 14 changed, or only checkout.',
      'Scope ambiguous: global vs. checkout-only.',
    ),
  },
  evidence: {
    kind: 'screens',
    caption: '',
    screens: SCREENS.map((name) => ({ name, asked: name === 'Checkout' })),
  },
  cost: {
    reversible: true,
    casualty: V('13 screens you didn’t mention', '13 other screens', '13 out-of-scope screens'),
    detail: V('Easy to undo.', 'Reversible.', 'Reversible.'),
  },
  safer: {
    label: V('Checkout only', 'Checkout only', 'Checkout-only variant'),
    detail: V('A bigger version just for checkout. The other 13 stay the same.', 'Adds a checkout-only version.', 'New variant, used on /checkout only.'),
    resultTitle: 'Checkout only - the other 13 screens stay the same',
    resultNote: 'A bigger button, just for checkout.',
  },
  approveResultNote: 'Changing the button on all 14 screens.',
  confirmPhrase: 'change everywhere',
  simpleChoices: true,
  review: true,
  intended: true,
  chip: V('changes 14 screens', 'changes 14 screens', '14 screens'),
  approveLabel: 'Change everywhere',
  dataFiles: [],
  outcome: {
    approve: 'Done - the button is bigger on all 14 screens, so they all still match.',
    safer: 'Done - the checkout button is bigger and bolder. The other 13 screens are exactly as they were.',
  },
}

export const checkoutButton: Scenario = {
  id: 'checkout',
  chip: 'Make the checkout button bigger',
  prompt: 'Make the checkout button bigger.',
  failure: '',
  proves: '',
  reply: V(
    'On it. I’ll look at how the checkout button is built first, then make it stand out.',
    'On it. I’ll check how the button is built, then make it bigger.',
    'Inspecting the checkout CTA implementation before editing.',
  ),
  steps: [
    safe('k1', 'Look at the checkout page', V('Looks at how your checkout page is laid out.', 'Reads the checkout page.', 'Reads src/pages/shop/checkout.tsx.'), 'Read checkout.tsx'),
    safe(
      'k2',
      'Find the checkout button',
      V('Finds where the button is made.', 'Finds the button’s code.', 'Resolves <Button variant="primary"> → Button.tsx.'),
      'Search · Button · 14 uses',
    ),
    {
      id: 'k3',
      title: 'Check where else this button is used',
      plainTitle: 'Check where else this button is used',
      plain: V('Looks for every screen that uses the same button.', 'Finds every screen using this button.', 'Finds all 14 importers of Button.tsx.'),
      tier: 'stop',
      triggers: [3],
      tool: 'Search · Button used on 14 screens',
      decision: sharedButton,
      followUps: {
        safer: [
          safe(
            'k4s',
            'Add a bigger version for checkout',
            V('Makes a bigger, bolder version of the button, just for checkout.', 'Adds a checkout-only version of the button.', 'Adds variant="checkout" to Button.tsx.'),
            'Edit Button.tsx · new version',
          ),
          safe(
            'k5s',
            'Use it on the checkout page only',
            V('Puts the new button on checkout. Nothing else changes.', 'Uses it on checkout only.', 'checkout.tsx → variant="checkout".'),
            'Edit checkout.tsx',
          ),
          safe(
            'k6s',
            'Check the checkout page',
            V('Looks at checkout to make sure it looks right.', 'Checks the checkout page.', 'Visual check · /checkout.'),
            'Check · checkout page',
          ),
        ],
      },
    },
    safe(
      'k4',
      'Make the button bigger',
      V('Makes the button bigger and bolder.', 'Increases the button size and contrast.', 'Button.tsx · size + contrast.'),
      'Edit Button.tsx',
      { note: V('Changes all 14 screens', 'Affects all 14 screens', 'Global - 14 screens') },
    ),
    safe(
      'k5',
      'Check all 14 screens',
      V('Looks at every screen to make sure they still match.', 'Checks all 14 screens.', 'Visual check · 14 screens.'),
      'Check · 14 screens',
    ),
  ],
  outcome: { approve: sharedButton.outcome!.approve!, safer: sharedButton.outcome!.safer! },
}

/* ------------------------------------------------------------------ *
 * "Make the header smaller on phones" - it can only get smaller if the
 * menu is hidden. Nobody said that; it finds out, and asks.
 * ------------------------------------------------------------------ */

const menuWontFit: Decision = {
  question: V('A smaller header can’t fit all 5 of your menu links.', 'A smaller header can’t fit all 5 menu links.', 'Nav overflows at the target height.'),
  understood: V('You want the header smaller on phones, and your site to still look like yours.', 'Smaller header on phones, same look.', 'Reduce mobile header height; preserve design.'),
  action: V('I can put your links inside a menu button, or keep them all and make the text smaller.', 'Put the links in a menu button, or keep them and make the text smaller.', 'Collapse nav into a hamburger, or reduce nav type size.'),
  explain: {
    happens: V(
      'I can put your links inside a menu button, so the header is as small as possible. Or I can keep all the links showing, with smaller text.',
      'Two ways: put the links inside a menu button (smallest header), or keep them all showing with smaller text.',
      'Nav wraps to 2 rows at 390px. Options: hamburger (56px header) or 12px nav type (72px header).',
    ),
    risky: V('Easy to undo, but visitors will have to tap a button to find your pages.', 'Easy to undo - but your links get one tap further away.', 'Reversible; nav discoverability drops.'),
    assumed: V(
      'You said “keep it looking like my site” - hiding the menu changes how people find their way around.',
      '“Keep it looking like my site” - hiding the menu changes that.',
      'Design constraint vs. height target conflict.',
    ),
    headsUp: V(
      'Hiding the links changes how your site looks, and you asked me to keep that - so I’m asking first.',
      'Hiding the links changes how your site looks, so I’m asking first.',
      'Hamburger conflicts with “keep it looking like my site”.',
    ),
  },
  evidence: {
    kind: 'variants',
    caption: '',
    variants: [
      { label: 'Links in a menu button', detail: 'Smallest header. Visitors tap to see the links.', style: 'burger' },
      { label: 'All links visible', detail: 'Smaller text. Header a little taller.', style: 'small' },
    ],
  },
  cost: {
    reversible: true,
    casualty: V('your visible menu, on all 6 pages', 'the visible menu on 6 pages', 'visible nav on 6 routes'),
    detail: V('Easy to undo.', 'Reversible.', 'Reversible.'),
  },
  safer: {
    label: V('Keep all links visible', 'Keep all links visible', 'Keep nav, reduce type size'),
    detail: V('Every link stays visible, in smaller text. The header is a little taller.', 'Links stay visible, in smaller text.', 'Nav retained at 12px; 72px header.'),
    resultTitle: 'Kept all links visible - smaller text instead',
    resultNote: 'Every link still visible.',
  },
  approveResultNote: 'Putting the links in a menu button on phones.',
  confirmPhrase: 'hide the menu',
  simpleChoices: true,
  review: true,
  reviewLabel: 'Show me both',
  intended: true,
  chip: V('menu doesn’t fit', 'menu doesn’t fit', 'nav overflow'),
  approveLabel: 'Hide links in a menu button',
  dataFiles: [],
  outcome: {
    approve: 'Done - the header is smaller on phones, and your links are in a menu button. All 6 pages checked.',
    safer: 'Done - the header is smaller on phones, and all your links are still showing. All 6 pages checked.',
  },
}

export const smallerHeader: Scenario = {
  id: 'header',
  chip: 'Make the header smaller on phones',
  prompt: 'The header takes up too much space on phones. Make it smaller so more of the page shows, and keep it looking like my site.',
  failure: '',
  proves: '',
  reply: V(
    'On it. I’ll look at your header on a phone first, and check what fits.',
    'On it. I’ll check what fits on a phone before changing anything.',
    'Measuring the mobile header before editing.',
  ),
  steps: [
    safe('h1', 'Look at the header on a phone', V('Looks at your header on a phone-sized screen.', 'Checks the header at phone size.', 'Render header at 390px.'), 'Check · header at phone size'),
    safe(
      'h2',
      'Measure what fits',
      V('Checks if your logo and 5 links fit on one line.', 'Checks if the logo and 5 links fit on one line.', 'Measure nav + logo widths.'),
      'Measure · 5 links don’t fit on one line',
    ),
    {
      id: 'h3',
      title: 'Decide how to make it smaller',
      plainTitle: 'Decide how to make it smaller',
      plain: V('Decides what changes so the header fits.', 'Picks how to shrink the header.', 'Resolve height vs. nav constraint.'),
      tier: 'stop',
      triggers: [3],
      tool: 'Header · menu doesn’t fit',
      decision: menuWontFit,
      followUps: {
        safer: [
          safe('h4s', 'Make the link text smaller', V('Makes your 5 links a little smaller so they fit on one line.', 'Makes the link text smaller.', 'Nav font 14px → 12px.'), 'Edit Header.tsx · link text'),
          safe('h5s', 'Make the header smaller on phones', V('Makes the header shorter on small screens.', 'Reduces the header height.', 'Header 96px → 72px at <640px.'), 'Edit Header.tsx · phone size'),
          safe('h6s', 'Check all 6 pages on a phone', V('Looks at every page to make sure it looks right.', 'Checks all 6 pages.', 'Visual check · 6 routes.'), 'Check · 6 pages'),
        ],
      },
    },
    safe(
      'h4',
      'Put the links in a menu button',
      V('On phones, your 5 links move inside a menu button.', 'Moves the links into a menu button on phones.', 'Hamburger nav at <640px.'),
      'Edit Header.tsx · menu button',
      { note: V('All 6 pages', 'All 6 pages', '6 routes') },
    ),
    safe('h5', 'Make the header smaller on phones', V('Makes the header shorter on small screens.', 'Reduces the header height.', 'Header 96px → 56px at <640px.'), 'Edit Header.tsx · phone size'),
    safe('h6', 'Check all 6 pages on a phone', V('Looks at every page to make sure it looks right.', 'Checks all 6 pages.', 'Visual check · 6 routes.'), 'Check · 6 pages'),
  ],
  outcome: { approve: menuWontFit.outcome!.approve!, safer: menuWontFit.outcome!.safer! },
}

/* ------------------------------------------------------------------ *
 * designing for confusion - ask, don't guess
 * ------------------------------------------------------------------ */

/** A small plan where every step is easy to undo, so nothing stops you. */
const quickPlan = (id: string, chip: string, prompt: string, reply: Voiced, steps: StepSpec[], done: string): Scenario => ({
  id,
  chip,
  prompt,
  failure: '',
  proves: '',
  reply,
  steps,
  outcome: { approve: done, safer: done },
})

const easyReply = (what: string): Voiced =>
  V(
    `${what} it is. Everything here is easy to undo, so I won’t stop you - watch it run on the right.`,
    `${what}. Every step is reversible, so nothing will stop you. Plan is on the right.`,
    `${what}. All steps are reversible and version-controlled; no gates.`,
  )

const popColors = quickPlan(
  'pop-colors',
  'Make it pop - bolder colors',
  'Make it pop → bolder colors',
  easyReply('Bolder colors'),
  [
    safe('pc1', 'Read your color styles', V('Looks at the colors your site uses. Nothing is changed.', 'Reads the 14 colors in globals.css.', 'Reads 14 custom properties in globals.css.'), 'Read globals.css · 14 colors'),
    safe('pc2', 'Raise contrast on buttons and headings', V('Makes your buttons and headings stronger colors. Easy to undo.', 'Updates 6 colors in globals.css. Reversible in Git.', 'Edits 6 tokens in globals.css. git revert-able.'), 'Edit globals.css · 6 colors'),
    safe('pc3', 'Show a local preview', V('Opens a preview only you can see.', 'Starts a local preview.', 'next dev on localhost:3000.'), 'Preview · localhost:3000'),
  ],
  'Done - buttons and headings are bolder. Every change is one click from undone.',
)

const popType = quickPlan(
  'pop-type',
  'Make it pop - bigger type',
  'Make it pop → bigger type',
  easyReply('Bigger type'),
  [
    safe('pt1', 'Read your text styles', V('Looks at your font sizes. Nothing is changed.', 'Reads the type scale.', 'Reads the type scale in globals.css.'), 'Read globals.css · type scale'),
    safe('pt2', 'Make headings larger', V('Makes your headings bigger. Easy to undo.', 'Bumps h1–h3 one step up the scale.', 'h1–h3 font-size +1 step. git revert-able.'), 'Edit globals.css · 3 sizes'),
    safe('pt3', 'Show a local preview', V('Opens a preview only you can see.', 'Starts a local preview.', 'next dev on localhost:3000.'), 'Preview · localhost:3000'),
  ],
  'Done - headings are larger. Every change is one click from undone.',
)

const popMotion = quickPlan(
  'pop-motion',
  'Make it pop - more motion',
  'Make it pop → more motion',
  easyReply('More motion'),
  [
    safe('pm1', 'Read your page sections', V('Looks at how your pages are built. Nothing is changed.', 'Reads the 5 home page sections.', 'Parses 5 section components on /.'), 'Read src/pages/index.tsx'),
    safe('pm2', 'Fade sections in as you scroll', V('Adds a gentle fade as each part appears. Easy to undo.', 'Adds a scroll fade-in to 5 sections.', 'Adds an IntersectionObserver fade to 5 sections. Reversible.'), 'Edit index.tsx · +18 lines'),
    safe('pm3', 'Show a local preview', V('Opens a preview only you can see.', 'Starts a local preview.', 'next dev on localhost:3000.'), 'Preview · localhost:3000'),
  ],
  'Done - sections fade in as you scroll. Every change is one click from undone.',
)

const contactTo = (email: string) =>
  quickPlan(
    'contact',
    'Connect the contact form',
    `Connect the contact form → send to ${email}`,
    V(
      `Thanks - messages will go to ${email}. Everything here is easy to undo, so I won’t stop you.`,
      `Messages will go to ${email}. All steps are reversible, so no stops.`,
      `Target: ${email}. All steps reversible; no gates.`,
    ),
    [
      safe('cf1', 'Read the contact form', V('Looks at your contact form. Nothing is changed.', 'Reads ContactForm.tsx.', 'Reads src/components/ContactForm.tsx.'), 'Read ContactForm.tsx'),
      safe('cf2', `Send form messages to ${email}`, V(`Makes the form send each message to ${email}.`, `Wires the form’s submit to ${email}.`, `Sets the form action target to ${email}.`), 'Edit ContactForm.tsx · +9 lines'),
      safe('cf3', 'Show a local preview to try it', V('Opens a preview so you can send yourself a test.', 'Starts a local preview to test the form.', 'next dev on localhost:3000.'), 'Preview · localhost:3000'),
    ],
    `Done - the contact form now sends to ${email}. Try it in the preview.`,
  )

const stickyNav = quickPlan(
  'sticky',
  'Make the nav sticky',
  'Make the nav sticky → allow one header change',
  V(
    'The nav wins - I’ll change the header for this one thing only. It’s easy to undo, so I won’t stop you.',
    'Sticky nav it is: one line in Header.tsx, nothing else in the header. Reversible, no stops.',
    'Scoped exception: position: sticky on <nav> in Header.tsx only. Reversible; no gates.',
  ),
  [
    safe('sn1', 'Read the header', V('Looks at your header. Nothing is changed.', 'Reads Header.tsx.', 'Reads src/components/Header.tsx.'), 'Read Header.tsx'),
    safe('sn2', 'Make the nav stick to the top', V('Keeps the menu at the top while you scroll. One small change.', 'Adds position: sticky to the nav - 1 line.', 'nav { position: sticky; top: 0 } - 1 line.'), 'Edit Header.tsx · 1 line', {
      yourRule: V('you allowed one header change - the sticky nav', 'one header change allowed: the sticky nav', 'scoped exception: Header.tsx › nav only'),
    }),
    safe('sn3', 'Show a local preview', V('Opens a preview only you can see.', 'Starts a local preview.', 'next dev on localhost:3000.'), 'Preview · localhost:3000'),
  ],
  'Done - the nav sticks to the top. Nothing else in the header changed.',
)

const dnsPrep = quickPlan(
  'dns',
  'Prepare the domain settings',
  'Buy the domain → prepare the settings instead',
  V(
    'I’ll get everything ready so connecting your domain takes one paste. Nothing here is risky, so I won’t stop you.',
    'I’ll prepare the DNS records for you to paste in. All read-only or local - no stops.',
    'Generating DNS records for manual entry at the registrar. No external writes.',
  ),
  [
    safe('dn1', 'Read your hosting setup', V('Looks at where your site is hosted. Nothing is changed.', 'Reads the hosting config.', 'Reads vercel.json.'), 'Read vercel.json'),
    safe('dn2', 'Write the settings you’ll paste in', V('Writes down the two lines your domain needs.', 'Writes the A and CNAME records to domain-setup.md.', 'Writes A + CNAME records to domain-setup.md.'), 'Write domain-setup.md'),
    safe('dn3', 'Show you where to paste them', V('Tells you exactly where they go, step by step.', 'Lists where to paste them at your registrar.', 'Renders registrar instructions.'), 'Render instructions'),
  ],
  'Done - your domain settings are in domain-setup.md. Buy the domain, paste them in, and tell me when; I’ll check it’s connected.',
)

/* ------------------------------------------------------------------ *
 * the clarifications
 * ------------------------------------------------------------------ */

export type PreviewKind = 'colors' | 'type' | 'motion'

export type ClarifyOption = {
  label: string
  detail: string
  /** a tiny visual preview of what this option would look like */
  preview?: PreviewKind
  /** the plan this option starts; without one, the reply is the whole answer */
  scenario?: Scenario
  reply?: string
}

export type Clarify = {
  /** the edge case, as named in the case study */
  kind: 'vague' | 'missing' | 'clash' | 'cant'
  prompt: string
  title: string
  body: string
  options?: ClarifyOption[]
  /** one clear question, answered in a field */
  question?: { label: string; placeholder: string; answer: (text: string) => Scenario }
  /** for things it can't do - how the person can */
  how?: string[]
}

const vague: Clarify = {
  kind: 'vague',
  prompt: 'Make it pop.',
  title: '“Make it pop” could mean a few things.',
  body: 'I don’t want to pick one on my own. Which of these did you mean?',
  options: [
    { label: 'Bolder colors', detail: 'Stronger buttons and headings', preview: 'colors', scenario: popColors },
    { label: 'Bigger type', detail: 'Larger, heavier headings', preview: 'type', scenario: popType },
    { label: 'More motion', detail: 'Sections fade in on scroll', preview: 'motion', scenario: popMotion },
  ],
}

const missing: Clarify = {
  kind: 'missing',
  prompt: 'Connect the contact form.',
  title: 'Where should messages from the form go?',
  body: 'You didn’t say, and I won’t make up an email address.',
  question: {
    label: 'Send messages to',
    placeholder: 'e.g. hello@yourname.com',
    answer: (text) => contactTo(text.trim()),
  },
}

const clash: Clarify = {
  kind: 'clash',
  prompt: 'Don’t touch the header, and make the nav sticky.',
  title: 'These two clash.',
  body: 'The nav lives inside the header, so making it sticky means changing the header. Which one wins?',
  options: [
    {
      label: 'Keep the header untouched',
      detail: 'Skip the sticky nav for now',
      reply: 'Okay - the header stays exactly as it is, and there’s no sticky nav. I’ve pinned “don’t touch the header” and will check it before every step.',
    },
    { label: 'Make the nav sticky', detail: 'Allow this one header change only', scenario: stickyNav },
  ],
}

const cant: Clarify = {
  kind: 'cant',
  prompt: 'Buy the domain.',
  title: 'I can’t do that. Here’s how you can.',
  body: 'Buying a domain means paying and signing up outside this project. I never handle payments, and I won’t pretend I can.',
  how: [
    'Search for the name at any domain registrar.',
    'Buy it there yourself - it takes about five minutes.',
    'Paste in the settings I prepare, and I’ll check it’s connected.',
  ],
  options: [{ label: 'Prepare the settings for me', detail: 'Everything ready for one paste', scenario: dnsPrep }],
}

/* ------------------------------------------------------------------ *
 * routing a /plan request to the case study
 * ------------------------------------------------------------------ */

export type CaseStudyMatch = { type: 'plan'; scenario: Scenario } | { type: 'clarify'; clarify: Clarify }

export function matchCaseStudy(task: string): CaseStudyMatch | null {
  const t = task.toLowerCase()
  if (/checkout/.test(t)) return { type: 'plan', scenario: checkoutButton }
  if (/header/.test(t) && /(smaller|small|phone|mobile)/.test(t)) return { type: 'plan', scenario: smallerHeader }
  if (/\bpop\b/.test(t)) return { type: 'clarify', clarify: vague }
  if (/contact\s*form/.test(t)) return { type: 'clarify', clarify: missing }
  if (/header/.test(t) && /(nav|sticky)/.test(t)) return { type: 'clarify', clarify: clash }
  if (/\b(buy|purchase|register)\b.*\bdomain\b|\bdomain\b.*\b(buy|purchase)\b/.test(t)) return { type: 'clarify', clarify: cant }
  return null
}

/** The home screen's examples. */
export const CASE_TASKS = [
  {
    label: 'Make the checkout button bigger',
    prompt:
      '/plan The checkout page doesn’t feel prominent enough. Make the checkout button bigger and improve its visibility while keeping the rest of the website consistent.',
  },
  {
    label: 'Make the header smaller on phones',
    prompt: '/plan The header takes up too much space on phones. Make it smaller so more of the page shows, and keep it looking like my site.',
  },
]
