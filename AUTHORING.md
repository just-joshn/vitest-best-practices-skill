# Authoring playbooks

Playbooks live in `vitest-best-practices/playbooks/`. `scripts/build.mjs --check` enforces every rule marked **(checked)**. Use `vitest-best-practices/playbooks/fix-flaky-test.md` as the model.

## Structure

- Line 1 is `# <Title>`. **(checked)**
- The `##` sections are exactly these, in this order **(checked)**:
  1. `## When to use`
  2. `## Investigate and establish evidence`
  3. `## Design and implement`
  4. `## Verify behavior and challenge findings`
  5. `## Acceptance evidence`
  6. `## References`
- `## Investigate and establish evidence` includes a `Process: Delegate ...` step that names the work to hand to a subagent. **(checked)**
- Every other line is blank or a single-line list item (`- ` or `1. `). No paragraphs, code blocks, tables, or wrapped items. **(checked)**
- Numbered lists count up from 1 with no gaps. **(checked)**

## Every step is cited or marked as process

- A step that says anything about Vitest (an API, option, flag, command, default, or behavior) ends with a citation **(checked)**:

  ```
  [label](../references/<dir>/<file>.md "verbatim quote")
  ```

  - The quote must appear character for character in the docs text of the cited reference file. Copy it from the file. Never retype it. **(checked)**
  - The quote is at least 20 characters and contains no `"`. **(checked)**
  - The quote must directly support the step. If no sentence in the references supports the step, delete the step.
- A step that says nothing about Vitest starts with `Process: ` and contains no backticks. **(checked)**
- A `## When to use` item starts with `When ` and contains no backticks, or is cited. **(checked)**
- Every backticked identifier outside a citation must appear in the Vitest docs. **(checked)**

## What not to write

- No step drawn from memory, other tools, blog posts, or general testing lore. If the references do not say it, it does not go in.
- In a cited step, no adjectives that judge Vitest features ("best", "recommended", "preferred") unless the quoted docs use them.
- In a cited step, no defaults, version numbers, or option values unless the quote contains them.
- The skill's own engineering judgments (what to prefer, require, delegate, or reject) are `Process: ` steps. They must not state how Vitest behaves. `SKILL.md` holds the shared ones under Principles, Preferences and defaults, and Reject. A playbook adds only what is specific to it.
- No step that the evidence for a playbook's goal would not need. Short playbooks are better.
- Keep the docs' hedges and conditions. If the docs say "many", "most", "can", or "when X", the step says it too. The independent audit's most common finding was a step that dropped one. For example, the docs say "Many AI tools pick up on these automatically", so a step may not say "AI tools read it".
- Quote the sentence that states the step, not the heading, code line, or lead-in next to it.

## References section

- List every reference file the playbook relies on, one link per item, as `- [name.md](../references/<dir>/<file>.md)`. **(checked)**
- Taken together, the playbooks must link every reference file. **(checked)**
