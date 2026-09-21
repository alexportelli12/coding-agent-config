# Report: recurring review/remediation loops in `/implement`

*Analysis basis: live OpenCode DB (`~/.local/share/opencode/opencode.db`), 448 sessions in the last 30 days, 43 top-level `/implement` sessions, 209 engineering-reviewer/ui-reviewer subagent sessions. No session data modified. No configuration changed in this repository — analysis only.*

---

## 1. Executive summary

The evidence shows a real, recurring over-review pattern, but it is **not primarily a remediation-regression problem**. It is an **orchestrator framing problem**: after initial review + remediation, `/implement`'s text ("engineering review again") and the orchestrator's own prompts ("Perform a *fresh* engineering review… report high/medium findings only") convert every confirmation pass into an unconstrained fresh discovery review. Under that prompt pressure, reviewers reliably produce at least one new `medium` every pass, each new medium triggers another remediation + another fresh review, and the written "at most two remediation passes" limit is not enforced by anything and was violated in practice (7 engineering passes on a single change).

Worst observed case: the Phase 1 cart implementation (Sep 21, `ses_f3c8c5b7`) ran **~7 engineering + ~5 UI review calls (~1.2M+ reviewer input tokens, roughly 90–100 minutes of reviewer wall time) for a single feature**, with one narrow concern (mutation-failure signalling) oscillating across 6 passes in both directions (silent → toast → duplicated-overload → silent again → focus stolen → focus lost on removal). Reviewer input across 30 days totals **~22.5M tokens (~1.3M output)**.

A scoped **discovery review → remediation → confirmation review → stop (exception: material regression / correctness-safety / blocking)** model is supported by the evidence and would have collapsed the worst session to 2 engineering + 2 UI passes while still catching the one genuinely material finding (itself traceable to remediation interplay and to a low finding from pass 1).

## 2. Current workflow behaviour

- `commands/implement.md:172-193` — review triggered for substantial/user-facing work; reviewers get fresh evidence only, never remediation transcripts. This isolation is good for pass 1 but provides no confirmation-mode counterpart.
- `commands/implement.md:196-218` — every finding investigated; high/medium must resolve; "low: report, but do not automatically churn code". **"Rerun only affected gates: engineering remediation: engineering review again"** (lines 211-213) — the word "again", plus the absence of any scoped confirmation definition, means "re-run the full review". The two-pass limit (lines 215-218) counts *remediation passes*, nothing counts review passes, and each fresh review that yields new mediums legitimately restarts remediation — so the effective loop is unbounded in practice.
- `agent/engineering-reviewer.md` / `agent/ui-reviewer.md` — both define **only one mode**: full independent judgement of the current diff. There is no confirmation/verification mode. `engineering-reviewer.md:52` instructs full scope-relevant evaluation every time.
- `skills/workflow-for-alex/SKILL.md:147-155` ("Orchestration economy") already states "remediation loops remain bounded" — the governance intent exists; the enforcement wording does not.
- Severity-escalation pressure: re-review prompts like *"Report high/medium findings only, then low residual risks"* nudge reviewers to upgrade or reframe leftover observations. Example: the `guardrails.ts:170-175` type-cast risk was a **low** at 13:16 and a **medium** at 13:40 with no change in between.

## 3. Evidence from real sessions

Aggregate: **43 `/implement` sessions in 30 days; 209 reviewer sessions → ~4.9 reviewer calls per implement** (a bounded design would be ~2–4). Reviewer input tokens alone ~22.5M over the window; per-review input typically 30k–130k tokens.

### Case A — Phase 1 cart (`ses_f3c8c5b7`, Sep 21 12:12→14:52) — the worst loop

| # | Time | Reviewer | Findings | Notes |
|---|------|----------|----------|-------|
| 1 | 12:36 | eng | 1 medium + 5 low | Full discovery review. Low: "filterVerified runtime guard does not exclude the new cart component"; medium: untested cart wiring |
| 2 | 12:39 | UI | 2 medium + 6 low | Escape/outside-click dismissal + screen-reader announce missing → these get fixed |
| 3 | 12:51 | eng | 1 medium | "Outside-click dismissal steals focus" — **regression introduced by pass-2 remediation**. Prompt: "Perform a **fresh** engineering review" |
| 4 | 13:01 | UI | 1 medium + 2 low | Toggle button hides state from SR users (new) |
| 5 | 13:16 | eng | 1 medium | "Mutation failures are silent" (pass-1 low, now escalated). Prompt: "Report high/medium findings only" |
| 6 | 13:22 | eng | 2 medium | Toast fix creates "two competing feedback channels" — *regression of pass-5 remediation* |
| 7 | 13:27 | eng ("Confirm final implementation") | 1 medium | "Header cart-dropdown mutation failures are now **completely silent**" — confirmation still ran as a fresh full review |
| 8 | 13:31 | eng | 2 medium | "Toast handling duplicated across siblings / inconsistent signalling" — third side of the same oscillation |
| 9 | 13:40 | eng | 1 medium | "Approve final cart change" title, yet still returns a medium (guardrail cast, previously low) |
| 10 | 13:47 | UI | **1 high + 3 medium + 1 low** | High: "Backend guardrail strips the cart component" — descendant of the pass-1 low via remediation interplay; toast icon / stepper focus mediums |
| 11 | 14:03 | eng | 2 medium + 4 low | "structuredCart reports cart unavailable during mutations" (already flagged low at 13:44) |
| 12 | 14:12 | eng + UI | 1 low / 4 medium | UI mediums: badge contrast, LIVE badge, truncated titles, dead "Continue shopping" link |
| 13 | 14:34 | eng + UI | 2 medium + 1 medium | eng: "stale cart facts fed to assistant after failure" — rewording of the 13:44/14:12 low; UI: "focus lost when controls removed" — same focus family as pass 3 |

User messages in the orchestrator session were only "Continue"/"comtinue" — the orchestrator self-initiated passes 5–13. Engineering reviewer input alone ≈ 690k tokens; UI ≈ +500k.

### Case B — Grounded references (`ses_f3d45c5c5`, Sep 21) — 4 engineering passes

Pass 1 (1 medium + 3 low) → re-review: **2 new mediums + 4 low** (discovery override can discard an explicit model classification; newly narrowed budget path) → another re-review → "Final engineering review": 5 all-low. Severities decline monotonically; every pass after the second found nothing medium, yet each ran as a full review (~50–100k tokens each).

### Case C — Dead-end recovery (`ses_f3d198247` + continuation, Sep 21) — 4 engineering passes

08:16: 3 medium + 5 low → 08:42 re-review: 1 medium ("post-dead-end guard can trap fresh requests" — plausibly remediation-induced) → 08:48 "Final review": **4 low** → further passes (8 findings → 1 medium → 4 low). The loop ended only because the severity floor bottomed out.

### Case D — UX fixes from PR #19 eval (`ses_f4039257`, Sep 20) — the *healthy* instance

eng review (1 med + 4 low) → UI review (1 med + 4 low) → UI re-review: 1 medium (incomplete a11y remediation — genuinely unresolved) → **"UI re-review pass 2 confirm": 0 findings** → eng re-review confirm: 2 low only. This is exactly the shape the proposed model enforces; note it required a well-behaved orchestrator that day.

### Case E — Other confirmations that still ran fresh

- Eval harness (Sep 18): pass 1 = 1 medium + 4 low; remediation; pass 2 = **6 low only** — a fresh 73k-token full review whose entire yield was low polish.
- Portfolio experiment (Sep 19 23:38): 4 low → "Recheck review remediation" consumed **188k input tokens** for 1 low aggregate note.
- Jev vs Gemini (Sep 18): a genuine high was caught in pass 1 (correct behaviour), but the session then spawned two further engineering reviews (cleanup fix, batched report), each full-scope with 4–5 findings, mostly low.

## 4. Recurring failure patterns

1. **Re-reviews are fresh full reviews, not confirmations.** Every re-review prompt in the evidence says "fresh([ly]) … review the final implementation/diff"; reviewer coverage sections confirm full-diff inspection every pass.
2. **Severity drift / bar-raising.** Identical defects reappear with different severities ("guardrails cast": low→medium; "stale cart facts": low→low→medium; "silent failures" medium→medium→medium across three framings).
3. **Remediation oscillation, not simple regressions.** The mutation-failure concern cycled: banner (flagged) → toast (duplicated → inconsistent → icon undermines → Clear Cart bypass) → "completely silent". Each fresh pass correctly found the previous fix's side effects one layer at a time; serial per-fix remediation churn produced the loop.
4. **Low-severity findings drove implementation.** Outside-click/Escape fixes came from legitimate UI mediums, but touch targets near the "44px bar cited in UX-006", badge contrast, and copy items consumed 2+ dedicated passes at polish grade.
5. **Reviewer-boundary duplication.** The engineering reviewer produced a11y/UX findings (touch targets, focus loss) that belong to the UI reviewer; the UI reviewer found a backend issue (guardrail strips cart). Scope leakage pulls both gates onto the same ground repeatedly.
6. **The two-pass limit is fiction.** 7 engineering passes on Case A vs. the written limit of two. No layer counts cycles; each fresh review with new mediums is treated as a legitimate confirmation.
7. **Diminishing returns are visible and predictable:** in nearly every multi-pass session the yield pattern was medium → low-only → 0 (Cases B, C, E). Extra passes produced rewordings and residual lows, almost never new material issues.

## 5. Root-cause analysis

Primary root cause is **instructional, not model failure**:

- `implement.md` says "engineering review again" and never narrows confirmation scope; combined with the reviewer contract "Inspect repository evidence yourself… evaluate scope-relevant concerns" (`engineering-reviewer.md:52`), every confirmation has the same charter as a discovery review.
- The orchestrator names passes "Fresh final engineering review" and asks for "high/medium findings only" — a request that functionally obliges a fresh reviewer to widen scrutiny until a medium appears.
- There is no prohibition on re-opening previously reported informational lows on later passes, and no deduplication reference: the reviewer never sees the earlier finding ledger.
- Remediation regressions are real (pass-3 focus theft; the dead-end guard trap) but secondary: they were catchable in a single confirmation pass. The extra 3+ passes came from rediscovery framing, not from remediation difficulty.

## 6. Recommended workflow changes (smallest viable)

1. **Add an explicit "confirmation review" mode to both reviewer agents**: input = original blocking findings (with text) + the remediation diff; charter = verify each blocking finding is resolved and inspect remediation for material regressions only; new findings reported only when they are material regressions, correctness/safety issues, or genuinely blocking.
2. **Rewrite the re-review step in `implement.md`**: replace "engineering review again" with "run the reviewer's confirmation review against the finding ledger", and count remediation cycles per gate: **max two cycles including those triggered by confirmation findings; a third only for a material regression, correctness/safety issue, or blocking requirement failure; otherwise record and stop.**
3. **Orchestrator prompt discipline**: do not send "fresh review" or "report high/medium only" on confirmation passes; do not auto-implement low findings on later cycles — lows are recorded once in the PR description and stay informational.
4. Keep both gates and reviewer isolation unchanged (that part demonstrably works; Case D shows the desired shape occurs naturally when prompted correctly).

## 7. Proposed review/remediation state model (candidate evaluation)

The candidate model matches the evidence-derived recommendation:

- **Initial review** — matches current good behaviour; every first pass found real mediums/highs, including the one genuine high in Case A. Keep unchanged.
- **Remediation batch high/medium together; lows informational** — already owned by `implement.md`; Case A's oscillation argues additionally for *batching* remediation instead of serial fix-then-review per finding.
- **Confirmation review with no unconstrained general re-review** — evidence-backed: every "final review" pass after the second in Cases B/C/E yielded lows only; scoped confirmation would have ended those loops.
- **Exceptional extra cycle only for material regression / correctness-safety / blocking** — this clause is where the model is possibly too terse. Case A pass 10's high (guardrail strips cart) would qualify, but it surfaced only because prior passes were fresh. A strictly narrow confirmation could miss such a class if it never verifies the artifact itself. Mitigation: confirmation must verify blocking findings against the repository artifact (not only the remediation diff), and informational lows stay ledgered for human PR review, which current `implement.md` completion already does.

Verdict: yes — the candidate model would have prevented the observed inefficient loops without hiding meaningful defects. Per-case: Case A drops from ~12 review passes to ~4; Cases B/C/E all terminate at pass 2; the real regression-class findings (focus theft, dead-end guard trap) and the genuine high remain detectable within confirmation scope, with lows recorded for human product review.

## 8. Files/instructions that would need modification

- `commands/implement.md`: "Review Remediation" section (rerun wording, cycle accounting, low-finding ledger discipline); "Independent Judgement" (state the two review modes when invoking reviewers); delivery gate references unchanged except confirmation status.
- `agent/engineering-reviewer.md`: add confirmation-review mode + its output contract (per-finding resolution status; regression-only new findings).
- `agent/ui-reviewer.md`: same.
- `AGENTS.md` and `skills/workflow-for-alex/SKILL.md`: no change required — they already own the principle ("remediation loops remain bounded"); `implement.md` is the single owner of the loop prose.

## 9. Risks / trade-offs — could this reduce quality?

- **Real residual risk**: a genuinely new medium defect could be missed if confirmation never looks beyond the remediation surface. Evidence counterweight: after initial review, latent material defects in these sessions were rare, and the one high in Case A was downstream of remediation/earlier flagging — exactly what a confirmation that verifies the artifact (not just the diff) covers.
- Severity oscillation shows reviewer calibration noise; a confirmation mode with a fixed ledger reduces that noise instead of reducing judgement.
- Deduplication loses only the 3rd+ rewordings of already-known families (silent-failure, live-store, focus families) — no evidence that skipping them subtracts protection.
- No quality loss identified from making lows informational; current completion flow already surfaces them in the PR description.

## 10. How the proposed model would have behaved on real loops

- **Case A (cart)**: pass 1 (eng 1med/5low + UI 2med/6low) → batched remediation → confirmation eng+UI against the ledger. Confirmation artifact verification would catch the outside-click focus theft (direct regression of the dismissal fix) as the one material regression; the "guardrail strips cart component" high is verifiable while confirming the `filterVerified` finding. Result: **2 eng + 2 UI passes instead of ~7 + ~4**, one residuals ledger in the PR instead of 25 re-reported lows.
- **Case B (grounded references)**: pass 1 (1 med) → remediation → confirmation finds the "discovery override" medium → remediation pass 2 (allowed) → confirmation #2 → stop. The all-low "final review" and the two subsequent fresh passes (~150k tokens) never happen.
- **Case D (PR #19 UX fixes)**: outcome already matches the proposed model exactly — evidence the model replicates the good instances rather than inventing a new regime.
- **Eval harness / portfolio / Jev-Gemini second passes**: full fresh re-reviews yielding lows-only would be replaced by a scoped confirmation (~1/3 of tokens; one bounded pass instead of a full review). No material defect in these cases would have been suppressed.
