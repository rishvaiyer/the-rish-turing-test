# the-rish-turing-test

Text with "Rish" — except sometimes it's really her, and sometimes it's an AI
clone trained on her actual texting style. Friends try to guess which.

Built as a real-life Turing test: the AI answers as Rish using a persona
built from her real texts (short, lowercase, run-on, warm even mid-vent).
Rish can secretly jump in through an admin page and answer for real —
friends never see whether a given reply came from her or the clone.

## How it works

- A friend opens the chat page and starts texting "Rish"
- Every message triggers a short delay (2–6s, feels human), then the AI
  replies in Rish's voice — unless Rish beats it to the punch
- Rish has a private `/admin.html` page showing every live conversation. If
  she sends a reply there before the AI's timer fires, her real reply goes
  out instead and the AI never answers that message
- The friend just sees one continuous conversation with "Rish" — no visible
  seam between the two

## 1. Check you have Node.js

```bash
node --version
```

Need v18 or newer. If that errors, install from [nodejs.org](https://nodejs.org/)
(the LTS version) and try again.

## 2. Clone and install

```bash
git clone https://github.com/rishvaiyer/the-rish-turing-test.git
cd the-rish-turing-test
npm install
```

## 3. Get a Claude API key

Go to [console.anthropic.com](https://console.anthropic.com/) → API Keys →
create one. This costs a few cents per conversation, not dollars — no need
to worry about the bill.

## 4. Configure

```bash
cp .env.example .env
open -e .env
```

Fill in:
- `ANTHROPIC_API_KEY` — the key from step 3
- `ADMIN_KEY` — a secret only you know, this is what lets you intercept
  chats at `/admin.html`. Pick something a friend snooping wouldn't guess.

Save and close.

## 5. Run it

```bash
npm start
```

- Send friends: **http://localhost:3000** (or your Mac's local IP if
  they're on the same Wi-Fi, or deploy it — see below — if they're not)
- Your private admin page: **http://localhost:3000/admin.html** — enter
  your `ADMIN_KEY`, watch conversations roll in live, and type a reply in
  any session to answer as the real you instead of the AI

## Deploying so friends outside your house can use it

Running `npm start` on your laptop only works for people on your same
Wi-Fi. To let anyone text "Rish" from anywhere, deploy it to a small free
host like [Render](https://render.com/) or [Railway](https://railway.app/) —
both support "point at a GitHub repo, set the same environment variables
from `.env`, done." Neither is set up in this repo yet; ask if you want
that wired up.

## The persona

`persona.js` holds the style rules and real example texts the AI uses to
sound like Rish. It's intentionally small right now — built from one quick
conversation. To make the clone sharper, add more real examples to that
file in the same `Q: ... / A: "..."` format. More (and more varied)
examples = a clone that's harder to catch.

## Ethics note

This only works because it's consensual and everyone playing knows the
rules going in — friends are told up front they might be talking to a
clone, and they're guessing on purpose. That framing is the whole point;
don't repurpose this persona/API pairing to impersonate someone to people
who don't know it's a game.
