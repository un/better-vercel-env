# agents.md

Notes and working conventions for building this project.

## Plans and Discussions

- Plans live in `/plans`.
- The code repository lives in `/`. so the plans is a sub folder of the main repository.
- Plan filename format:
  - `plans/{date}{increment}-{plan-name}.md`
  - Example: `plans/26013101-initial-draft-plan.md`
- Sub-discussions for a plan live in a folder next to the plan file:
  - `plans/{date}{increment}-{plan-name}/{discussion-point}.md`
  - Example: `plans/26013101-initial-draft-plan/auth-token-model.md`
- `{date}` is `YYMMDD`.
- `{increment}` is a 2-digit sequence for that date (01, 02, ...).
- `{plan-name}` and `{discussion-point}` are kebab-case.

When asked by the user, make a steps.json file
create a sub folder matching the plan file name and make a steps.json file

​
You will break down the whole project into tiny accomplishable steps that will be carried out by sub agent llms
​
for each step
Give it a serial number
give it a name
a description of the task and light guidance of how to do it
a list of success factors
and a completed boolean
​
Also add a learnings.md file to that folder
after each agent is done, it should prepend that file with new learnings if there are any, and before any agent starts it should read that file.
