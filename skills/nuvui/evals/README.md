# Evals

Tasks to try the skill on, in `evals.json`. They're how a change to the skill is checked: by what an agent that has it goes on to write.

## What a task is

- `prompt`: one line, as a person would ask.
- `project`: the packages the project has installed.
- `expect`: things that should be in what the agent writes, each a regular expression with the reason for it.
- `reject`: things that shouldn't be.
- `ask`, on a few: something the agent should ask the person and not decide.

The patterns are a first look, and no more. One that matches doesn't mean the screen is right, and what the agent wrote still has to pass the project's lint and typecheck, render, and work with a keyboard.

## Running one by hand

1. Make a small app, with Vite or Next.js, and install the packages in `project`.
2. Install the skill into it: `pnpm dlx skills add Nuvraxis/nuvui`.
3. Give the agent the `prompt`, and nothing else.
4. Read what it wrote against `expect` and `reject`. Run the app's typecheck. Look at the screen, in dark mode and at 320 pixels wide.

## When the agent gets one wrong

That's the point of these. Find what in the skill would have stopped it: a rule that's missing, one that's there and too easy to pass over, a reference that didn't say. Change the skill, and try again. If the mistake is one that other tasks would make too, add a task for it here.

Don't add a pattern only to make a task pass.
