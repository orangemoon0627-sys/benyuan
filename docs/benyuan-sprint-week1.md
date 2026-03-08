# "Benyuan" Sprint Plan - Week 1 to Week 2

This schedule assumes a small multi-agent team working in parallel against schema v0.1.

## T+0: Kickoff (Half Day)

Primary goal:
- freeze scope and ownership.

Outputs:
- `docs/benyuan-multi-agent-playbook.md`
- `docs/benyuan-shared-schema-v0.1.md`
- sprint task board created from this schedule

Owners:
- Orchestrator Agent

Exit condition:
- all agents align on the same MVP boundary: mode one + three dimensions + text-first results.

## T+1 Day

Primary goal:
- parallel start of product, measurement, and narrative tracks.

Outputs:
- MVP PRD v0.1
- user flow v0.1
- question bank draft v0.1
- report structure outline v0.1

Owners:
- Product Architect Agent
- Assessment Designer Agent
- Psychoanalysis Prompt Agent

Exit condition:
- there is one agreed page flow,
- there are enough draft questions to cover all three dimensions,
- report sections map cleanly to schema fields.

## T+2 Day

Primary goal:
- stabilize input model and safety policy.

Outputs:
- scoring mapping draft v0.1
- confidence logic draft v0.1
- safety taxonomy v0.1
- blocked/rewrite rule list v0.1

Owners:
- Assessment Designer Agent
- Safety and Ethics Agent

Exit condition:
- every draft question has a mapping strategy,
- high-risk language rules exist before prompt lock.

## T+3 Day

Primary goal:
- lock first-pass generation contract.

Outputs:
- analysis system prompt v0.1
- archetype naming rules v0.1
- tension library v0.1
- low-confidence fallback template v0.1

Owners:
- Psychoanalysis Prompt Agent
- Safety and Ethics Agent

Exit condition:
- at least three sample inputs can produce structurally valid reports,
- risky phrasing has rewrite coverage.

## T+4 Day

Primary goal:
- begin engineering integration.

Outputs:
- API contract implementation note
- analysis job lifecycle design
- DB/storage model draft
- result page wireframe/content map

Owners:
- Experience and Engineering Agent
- Product Architect Agent

Exit condition:
- submit/analyze/report flow is implementable without schema ambiguity.

## T+5 Day

Primary goal:
- first end-to-end internal pass.

Outputs:
- mock session submission working
- feature vector generation prototype
- prompt runner prototype
- result payload renderer stub

Owners:
- Experience and Engineering Agent
- Psychoanalysis Prompt Agent

Exit condition:
- one sample session can travel through the pipeline and return a renderable payload.

## T+6 Day

Primary goal:
- evaluation loop starts.

Outputs:
- golden sample set v0.1
- review rubric v0.1
- first failure log

Owners:
- Evaluation Agent
- Orchestrator Agent

Exit condition:
- team can say why an output is weak instead of just saying it "doesn't feel right".

## T+7 Day

Primary goal:
- tighten report quality and remove generic language.

Outputs:
- prompt revision v0.2
- question tweaks v0.2
- duplicate/empty phrase cleanup list

Owners:
- Psychoanalysis Prompt Agent
- Assessment Designer Agent
- Evaluation Agent

Exit condition:
- top three quality issues from day six are addressed.

## T+8 Day

Primary goal:
- harden result experience.

Outputs:
- result page structure finalized
- share card/content blocks finalized
- loading and async state copy finalized

Owners:
- Experience and Engineering Agent
- Product Architect Agent

Exit condition:
- the product feels intentional even before visual polish.

## T+9 Day

Primary goal:
- safety and regression pass.

Outputs:
- safety regression report
- blocked phrase verification
- confidence display rules finalized

Owners:
- Safety and Ethics Agent
- Evaluation Agent

Exit condition:
- risky edge cases have documented behavior.

## T+10 Day

Primary goal:
- internal pilot readiness review.

Outputs:
- MVP release checklist
- known issues list
- pilot feedback form
- next sprint backlog

Owners:
- Orchestrator Agent
- all agents contribute

Exit condition:
- system is ready for controlled pilot with clear limits and success metrics.

## Deliverable-to-Time Map

| Time Node | Deliverable | Primary Owner |
| --- | --- | --- |
| T+0 | Playbook + Shared Schema + Sprint Board | Orchestrator |
| T+1 | PRD v0.1 + User Flow + Question Draft + Report Outline | Product / Assessment / Prompt |
| T+2 | Scoring Draft + Confidence Logic + Safety Taxonomy | Assessment / Safety |
| T+3 | Prompt Pack v0.1 + Archetype Rules + Tension Library | Prompt / Safety |
| T+4 | API/Job/Storage Draft + Result Wireframe | Engineering / Product |
| T+5 | End-to-End Prototype | Engineering / Prompt |
| T+6 | Golden Set + Rubric + Failure Log | Evaluation |
| T+7 | Prompt v0.2 + Question v0.2 | Prompt / Assessment / Evaluation |
| T+8 | Result Experience Finalized | Engineering / Product |
| T+9 | Safety Regression Pass | Safety / Evaluation |
| T+10 | Pilot Readiness Pack | Orchestrator |

## Suggested Milestone Reviews

- Review 1: end of T+1
  - confirm scope and page flow.
- Review 2: end of T+3
  - confirm prompt and safety readiness.
- Review 3: end of T+5
  - confirm pipeline viability.
- Review 4: end of T+10
  - confirm pilot readiness.
