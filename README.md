# PLAN - see it before the AI agent acts

A prototype of **PLAN**, a layer inside Claude Code that shows the agent's plan first, flags the risky steps,
and lets you change or stop it before anything permanent happens. It is a simulated macOS desktop with the
chat on the left and the plan, as a step-by-step diagram, on the right.

Built for the MIT-ID Hackathon 2026. The idea: today's permission prompts only ask **"can I?"** The damage
hides in the other question, **"did I understand you?"** PLAN makes both visible, in plain language, at the
moment they matter.

## Run it

```bash
npm install
npm run dev     # http://localhost:5178
```

Optional: add a Gemini key (in the app, or `VITE_GEMINI_API_KEY`) so prompts outside the two demo tasks get a
generated plan. Without a key, a local fallback is used.

## What you will see

1. **Two quick questions** - how well you know code (changes the words, never the risk) and how often it
   should check in. Deleting or anything that cannot be undone always asks.
2. **"How I work in my-portfolio"** - the rules, stated up front: what it does alone, what it shows you
   first, what always stops, and what it never does.
3. **A plan** - safe steps run on their own. A step that is bigger than you asked for, broke something, or
   cannot be undone stops, in red, with a plain question, a short picture of what is involved, and real
   choices instead of yes/no.

Light and dark mode: the switch is at the bottom of the sidebar.

## The two demo tasks

The designer works on a portfolio that now has a small print shop. Each prompt leaves one decision unsaid. The
agent finds out while looking, stops, and asks.

### Make the checkout button bigger

> The checkout page doesn't feel prominent enough. Make the checkout button bigger and improve its visibility
> while keeping the rest of the website consistent.

| Step | What happens |
|---|---|
| Look at the checkout page, find the button | Runs on its own |
| Check where else this button is used | **Stops.** "This button is shared by 14 screens." *Review affected screens* shows all 14. Choose **Change everywhere** or **Checkout only** |
| Make the button bigger, check all 14 screens | The original plan, if you change everywhere |
| (Checkout only) | The plan is rewritten: a checkout-only version, used there only. Old and new plans are shown side by side |

### Make the header smaller on phones

> The header takes up too much space on phones. Make it smaller so more of the page shows, and keep it looking
> like my site.

| Step | What happens |
|---|---|
| Look at the header on a phone, measure what fits | Runs on its own - the 5 menu links need 2 lines |
| Decide how to make it smaller | **Stops.** "A smaller header can't fit all 5 menu links." *Show me both* puts the two headers side by side on a phone. Choose **Hide links in a menu button** or **Keep all links visible** |
| Hide the menu / make the header smaller / check all 6 pages | The original plan, or a revised one if you keep all links |

### When the request is not clear

Type these after `/plan` to see it ask instead of guess: `make it pop` (offers 3 options with previews),
`connect the contact form` (asks where messages go, never invents an email), `don't touch the header, and make
the nav sticky` (shows the clash, asks which wins), `buy the domain` ("I can't do that. Here's how you can.").

## How it decides

A step stops you if it is **irreversible**, **bigger than the ask**, **changes a safety setting**, or **touches
real data**. Bigger-than-the-ask and safety-setting steps can never be approved ahead of time. The check-in
setting changes how often it asks about everything else, never these.

## Layout

```
src/
  data/caseStudy.ts     the two tasks and the four "not clear" requests
  data/types.ts         the model: what a step, a decision and the evidence look like
  lib/useRun.ts         the engine: runs the plan, stops on risky steps, re-plans from your choice
  lib/plan.ts           which steps stop you, and how the check-in setting reshapes the plan
  components/           the Claude Code window, the plan diagram, steps, pictures of what is affected
  styles/               one file per surface, plus theme-light.css
```
