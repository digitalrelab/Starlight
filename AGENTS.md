## Verification

- Typecheck: `vp check`.
- Let the user eye-ball when it's visual.
- Do not write unit tests.

## Docs

- Docs hold only rules the code can't show, and licenses. No descriptions, tours, procedures or examples that restate code.
- State the general rule, not the case that prompted it.
- No code comments.

## Design

- No filled or primary buttons.

## Git

- Commits and PR titles follow Conventional Commits: `type(scope): summary`.
- Don't add yourself as co-author.

## Releases

- Never replace the macOS signing certificate: installed apps reject updates signed by any other.

## Pull Requests

Body follows this structure, in lean language, nothing more:

```
## What
<the technical pitch, two sentences at most>

## Why it matters
<the value, to someone who doesn't read code, two sentences at most>

## Before vs after
<plain English; a table when comparing more than one thing>

## Tradeoffs
<what was chosen or excluded, and what it costs>

## Rollout
<migrations, secrets, flags, deploy order>

## Follow-ups
<work this PR leaves for later>
```

Omit Tradeoffs, Rollout and Follow-ups when there's nothing concrete to say. Describe the branch as it stands, not the conversation that produced it. When the branch changes, rewrite the body to match. Never append updates.
