# Vitest Best Practices Skill

An agent skill that runs Vitest work as a disciplined workflow. You give the agent a goal, constraints, and a success check. The skill has it select a playbook, investigate, make the smallest well-supported change, verify the actual result, and bring back evidence you can review. An inconclusive check is reported as unresolved, with the missing proof named, and never as a pass.

All Vitest guidance comes from the official Vitest documentation, pinned in [`sources.json`](sources.json) (currently `v5.1.1`).

## Installation

```bash
npx skills add https://github.com/just-joshn/vitest-best-practices-skill
```

## Layout

| Path | What it is | Written by |
| --- | --- | --- |
| [`vitest-best-practices/SKILL.md`](vitest-best-practices/SKILL.md) | The coordinator. It runs the workflow chart and sets the skill's opinions: principles, preferred defaults, and rejected approaches. It also defines statuses and the report format. | Hand |
| [`vitest-best-practices/playbooks/`](vitest-best-practices/playbooks) | One workflow per kind of Vitest task. Each step cites the docs or is marked as a process step. | Hand, checked |
| [`vitest-best-practices/references/`](vitest-best-practices/references) | Verbatim excerpts of the Vitest docs, grouped by topic. The playbooks cite these. | Generated |

## How claims stay tied to the docs

Playbooks may paraphrase, but every step about Vitest ends with a citation:

```
[label](../references/<dir>/<file>.md "verbatim quote from that file")
```

`node scripts/build.mjs --vitest <vitest checkout> --check` exits 1 when any of these is true:

- A reference file differs from the generated copy, or contains a line that is not verbatim docs text or generated navigation.
- A citation's quote is not found character for character in the cited reference file, or is shorter than 20 characters.
- A playbook step has no citation and does not start with `Process: `, or a `Process: ` step names a Vitest identifier.
- A backticked identifier in `SKILL.md` or a playbook does not appear in the Vitest docs.
- A playbook has prose paragraphs, wrapped items, numbered lists with gaps, or sections other than the six required ones.
- A reference file is not linked by any playbook, or a playbook is not linked by `SKILL.md`.

The script cannot judge whether a quote actually supports its step. That needs a human or an independent reviewer. [`AUTHORING.md`](AUTHORING.md) has the rules for writing playbooks.

## How references are built

`sources.json` lists the excerpts for each reference file. An excerpt is a whole docs page (`"guide/mocking/modules.md"`) or one section selected by its exact heading (`"api/test.md :: ## test.skip"`). Pages are resolved as VitePress renders them. YAML frontmatter is removed, `<!--@include: file-->` is inlined, and `<<< file` becomes a fenced code block of that file.

## Verification

```bash
git clone https://github.com/vitest-dev/vitest /tmp/vitest
git -C /tmp/vitest checkout "$(jq -r .commit sources.json)"
node scripts/build.mjs --vitest /tmp/vitest --check
```

CI runs this and [agnix](https://github.com/agent-sh/agnix) on every push.

## Updating to newer Vitest docs

Set `ref` and `commit` in `sources.json`, check out that commit, and run the build without `--check`. A renamed heading fails with the selector that broke. A changed sentence fails every citation that quoted it. Fix those, then run `--check`.

## License

The repository is MIT licensed. See [LICENSE](LICENSE). The reference files are copied from the Vitest documentation, which is MIT licensed by VoidZero Inc. and Vitest contributors. See [LICENSE-vitest-docs.md](LICENSE-vitest-docs.md).
