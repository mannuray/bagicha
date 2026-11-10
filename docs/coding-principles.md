# Coding principles

> Bagicha note: the ADR links and `@optimiser/*` packages cited below belong to
> the project this rule set came from and don't exist in this repo. Follow the
> principle; see `docs/superpowers/specs/2026-11-10-backend-cleanup-design.md`
> §6 for how each rule maps onto Bagicha (e.g. "tenant-scoped" → "user-owned").

A self-contained rule set for **writing** a new domain module or
macro-service in this codebase — or in any codebase — and for
**reviewing** one (§8 turns every rule below into a review question).
Every rule is either a general engineering principle stated concretely
enough to be checkable, or a specific mechanism this project already
decided and proved works (cited). Written so a team new to this repo, or
a different team entirely, can drop this file into their own
prompt/instructions and use it without needing the rest of this repo's
context — whether that prompt is driving an authoring session or a
review pass.

Every rule is a `MUST` unless marked `SHOULD`. A `MUST` you can't satisfy
is a signal to stop and ask, not to work around silently — true whether
you're the one writing the code or the one reviewing it.

## 1. Design — SOLID, made concrete

Each letter below is named explicitly, with a real example — not just the
textbook definition restated.

- **Single Responsibility** — a class/function has one reason to change.
  If describing what it does needs "and," it's two classes. Concretely:
  a service that both applies a business rule and runs raw persistence
  queries has two reasons to change — a rule changes, or the storage
  shape changes — split them (see the persistence rule below). This
  project's own design proved the payoff: `evaluate()` and
  `buildListQuery()` in the identity evaluator are two separate
  functions, not one, specifically because they have different reasons
  to change (single-record explainability vs. bulk-query performance).
- **Open/Closed** — add new behavior by adding new code that plugs into
  an existing extension point, never by modifying that extension point's
  own implementation every time a new case shows up. The tenant-hooks
  interface is the canonical example: a new tenant's custom logic is a
  *new implementation* of an existing typed interface, never a change to
  the interface or its dispatcher.
  ([`ADR-0015`](../adr/0015-tenant-hooks.md)) `reconcileRecordShares()`
  is a second, concrete proof from this project's own identity design:
  it needed zero changes when reused for a second, unrelated trigger
  (Team-membership change vs. supervisor-chain change) — it was designed
  generically enough from the start, closed for modification, open for
  reuse.
- **Liskov Substitution** — any class extending a shared base (a
  repository extending `TenantScopedRepository`, a class implementing a
  shared hook interface) must be fully substitutable wherever the base
  type is expected: never narrow what inputs it accepts, never throw on
  something the base contract allows callers to rely on.
- **Interface Segregation** — one module per domain concept, exposing
  only an `index.ts` barrel to sibling modules — never import a
  sibling's internal file directly. A sibling depends on the sibling's
  published interface, never its implementation.
  ([`ADR-0014`](../adr/0014-macro-service-modularity.md))
- **Dependency Inversion** — constructor-inject every dependency; never
  `new` a collaborator inside a method, never reach for a
  singleton/global. Also what makes a class testable by direct
  instantiation with stub dependencies, no framework required (see §3).

Two more general design rules, not tied to one SOLID letter specifically:

- **MUST** separate persistence from business logic — a service class
  calls a repository, it never runs a raw query inline. The repository
  is the only thing that knows the storage shape; the service is the
  only thing that knows the business rule.
  ([`ADR-0012`](../adr/0012-persistence-pattern.md)'s `TenantScopedRepository`)
- **MUST** keep the module dependency graph a DAG — no cycles. If two
  modules need each other's data, one owns it and the other references
  it by id; never a circular import to make both sides convenient.

## 2. API shape and error handling

- **MUST** use domain-prefixed routes, never a macro-service name in the
  path — a macro-service is a deployment grouping, invisible externally,
  so regrouping domains later costs nothing at the API boundary.
  ([`ADR-0029`](../adr/0029-api-gateway-routing.md))
- **MUST** return every response through one consistent envelope shape
  (success/error, consistent metadata) — never a bespoke response shape
  per endpoint. ([`ADR-0008`](../adr/0008-api-response-envelope.md))
- **MUST** validate every incoming DTO at the boundary — reject invalid
  input before it reaches business logic, not partway through.
  ([`ADR-0004`](../adr/0004-validation-class-validator.md))
- **MUST** distinguish operational errors (bad input, not found,
  conflict — expected, loggable at `warn`) from programmer errors (a
  bug — unexpected, loggable at `error`, pages someone). One error
  hierarchy, not ad hoc `throw new Error(string)`.
  ([`ADR-0007`](../adr/0007-error-handling.md))
- **MUST** carry a machine-readable `reason` code on every thrown error,
  not just a human message — a caller needs to branch on *why* a request
  failed (validation vs. conflict vs. not-found vs. forbidden)
  programmatically, without parsing English.
- **MUST** pair every route needing authorization with both an
  authentication guard and a permission guard — never one without the
  other, never permission logic inlined in a controller.
  ([`ADR-0010`](../adr/0010-authorization-convention.md))
- **MUST** report per-item outcomes on any bulk/batch operation — success,
  skipped, and failed items each identified individually. A batch
  endpoint that returns one boolean for N items is misreporting, not
  simplifying.

## 3. Testability — write code that *could* be tested, whether or not it is yet

The instruction here isn't "write tests." It's: write every class so a
test *could* be added in five minutes if someone needed to, whether or
not that test exists today.

- **MUST** make every dependency swappable via constructor injection —
  proven in this project by direct instantiation with stub dependencies,
  no test framework DI needed
  (`TenantContextProvider`, `@optimiser/rate-limit`, both verified this
  way — [`ADR-0028`](../adr/0028-cicd-secrets-testing.md)).
- **MUST NOT** put side effects in a constructor — construction should be
  cheap and pure; anything that touches I/O belongs in a method, called
  explicitly.
- **MUST NOT** rely on module-level mutable state (a singleton counter, a
  cached value outside any class) — it silently couples every caller
  together and can't be reset between test runs.
- **SHOULD** keep a function's observable behavior a pure function of its
  inputs plus its injected dependencies — no hidden reads of `Date.now()`,
  `Math.random()`, or ambient config buried inside business logic;
  inject a clock/id-generator/config object instead.
- **It is fine if the actual `.spec.ts` file doesn't exist yet** — that's
  a scheduling choice, not a design flaw. A class that violates the rules
  above is a design flaw regardless of whether a test currently exists
  for it.

## 4. Observability — present from the first commit, not added before ship

- **MUST** use structured logging with fixed fields
  (`timestamp, level, service, version, env, message` plus
  `traceId`/`spanId`) — never `console.log`, never string-interpolated
  variable data in a log message (pass it as the structured object
  instead). ([`ADR-0005`](../adr/0005-logging-pino.md))
- **MUST** wire OpenTelemetry auto-instrumentation via the two-file
  `instrumentation.ts`/`main.ts` split from the service's first commit —
  this is not optional boilerplate; importing it from inside `main.ts`
  instead breaks tracing silently, with no error to alert anyone.
  ([`ADR-0006`](../adr/0006-observability-opentelemetry.md))
- **MUST** wrap any expensive or external call (a third-party API, an
  AI provider) in a manual span via the shared `withSpan()` helper, not a
  hand-rolled `tracer.startActiveSpan()` block — hand-rolled span
  management reliably misses at least one exit path and leaks an
  unclosed span.
- **MUST** emit a custom business metric for anything a future incident
  review would want graphed (queue depth, cache hit rate, a domain
  counter) — via the shared meter helper, not a one-off ad hoc counter.
- **MUST** include enough context on every log line to filter by tenant
  and trace a single request end-to-end (`tenantId`, `userId` where
  applicable, `traceId`) — a log line that can't be tied back to a
  request or a tenant is close to useless during an incident.

## 5. Security, from the start — not retrofitted after an incident

- **MUST** fail closed on anything authorization-related — an evaluator
  error or an ambiguous state denies access, it never defaults to allow.
  Fail-*open* is reserved for genuinely non-critical conveniences (a rate
  limiter degrading gracefully on a Redis outage is a deliberate,
  narrow exception — [`ADR-0009`](../adr/0009-rate-limiting.md) — not a
  general license to fail open elsewhere).
- **MUST** default every new capability, field, or permission to
  **off/hidden/no-access** until explicitly granted — never default-open
  and rely on someone remembering to lock it down later. (`fieldState()`'s
  default is `hidden`; a freshly created profile grants nothing until
  configured.)
- **MUST** route every tenant-scoped query through the shared scoped
  repository — never a raw query that bypasses tenant isolation, even
  once, even for a "quick" admin script.
  ([`ADR-0012`](../adr/0012-persistence-pattern.md))
- **MUST** rate-limit anything with real external cost or abuse
  potential (AI calls, bulk operations, anything hitting a third-party
  quota). ([`ADR-0009`](../adr/0009-rate-limiting.md))
- **MUST** keep secrets in the platform's secret store only — created at
  deploy time from CI's own encrypted variables, never committed to git,
  never templated into a Helm values file.
  ([`ADR-0028`](../adr/0028-cicd-secrets-testing.md))
- **MUST** validate and sanitize input at every trust boundary (API
  request, webhook payload, tenant-authored configuration) — never trust
  that an earlier layer already checked it.

## 6. Scaling — designed in, not bolted on after a slow-query incident

- **MUST** paginate every list endpoint by default — no endpoint returns
  an unbounded result set because "it's small today."
- **MUST** consider indexes at schema-design time, as part of the design
  review — not as a reactive fix once a query is measured slow in
  production.
- **MUST** make any queue/job-consumer idempotent and safely retriable —
  check whether a step already completed before re-running it. Retries
  *will* happen (a worker crash, a network blip); a consumer that isn't
  safe to run twice is a production incident waiting for a redeploy.
- **MUST** use optimistic concurrency (a `version` field + conditional
  update) on any resource multiple humans can edit concurrently — a
  stale write must be rejected or surfaced for explicit reconciliation,
  never silently overwrite a newer version.
- **SHOULD** push anything unbounded or slow (bulk imports, cross-record
  fan-out, report generation) onto a queue rather than a synchronous
  request/response cycle.

## 7. A few more habits worth keeping

- **MUST** give every security-relevant mutation an audit trail entry,
  written at the time of the mutation with a snapshot of the affected
  data — never reconstructed after the fact from a reference that might
  already point at nothing (e.g. after a delete).
- **MUST NOT** build an abstraction for a requirement nobody has actually
  asked for yet. Three similar lines of code are better than a
  premature abstraction guessing at a future need that may never arrive.
- **MUST** expose a health-check endpoint and wire graceful shutdown
  (drain in-flight requests, close connections cleanly) on every
  service — baseline requirements for correct Kubernetes liveness/
  readiness probes and zero-downtime rolling updates, not nice-to-haves.
- **SHOULD** prefer the longer-proven major version of a dependency over
  the newest one, unless a specific need justifies the newer one — and
  verify the current version live rather than trusting memory when the
  choice actually matters.
- **SHOULD** write the one-line "why" as a comment only when it's
  genuinely non-obvious (a hidden constraint, a workaround for a specific
  bug, something that would surprise a future reader) — never a comment
  restating what well-named code already says.

## 8. Review checklist — the same rules, as questions

One question per rule above, same grouping, meant to be scanned against
a diff — not re-derived from the prose each time. A "no" is a review
comment, not an automatic block; use judgment on what's blocking versus
worth a follow-up ticket. If a "no" is intentional (a documented
exception), that belongs in the PR description, not silently waved
through.

**Design**
- [ ] Does each changed/new class have one clear reason to change?
- [ ] Is new behavior added via a new implementation of an existing
      extension point, rather than by editing a shared dispatcher's
      internals for this one case?
- [ ] Does every class extending a shared base honor that base's
      contract — no narrowed inputs, no surprise throws a caller
      couldn't have expected?
- [ ] Does a module import a sibling only via its `index.ts`?
- [ ] Is every dependency constructor-injected — nothing `new`'d inline,
      nothing pulled from a singleton/global?
- [ ] Does business logic go through a repository, with no raw
      persistence query inline?
- [ ] Does this change keep the module dependency graph acyclic?

**API & errors**
- [ ] Are the new/changed routes domain-prefixed, never macro-service-
      prefixed?
- [ ] Does every response go through the shared envelope?
- [ ] Is every incoming DTO validated at the boundary?
- [ ] Does every thrown error use the shared hierarchy with a `reason`
      code — no raw `throw new Error(string)`?
- [ ] Is every authorization-sensitive route guarded by both an auth
      check and a permission check?
- [ ] Does a bulk/batch endpoint report per-item outcomes, not one
      aggregate boolean for N items?

**Testability**
- [ ] Could this class be instantiated directly with stub dependencies,
      no framework required?
- [ ] Any side effect hiding inside a constructor?
- [ ] Any hidden `Date.now()`/`Math.random()`/ambient config reached
      from inside business logic instead of injected?

**Observability**
- [ ] Structured logging only — no `console.log` anywhere in the diff?
- [ ] Do the new log lines/spans carry tenant/user/trace context?
- [ ] Is an expensive or external call wrapped in `withSpan()`, not a
      hand-rolled span?
- [ ] Is there a metric for anything a future incident review would
      want graphed?

**Security**
- [ ] Does an auth/evaluator failure path deny by default, not allow?
- [ ] Does a new field/permission/capability default to off/hidden
      until explicitly granted?
- [ ] Does every tenant-scoped query in the diff go through the shared
      scoped repository — no raw query that bypasses it?
- [ ] Is anything newly abusable or costly rate-limited?
- [ ] Are secrets fully absent from the diff — no literal value,
      nothing baked into a config/Helm-values file?

**Scaling**
- [ ] Does a new list endpoint paginate by default?
- [ ] Were indexes considered for any new query shape this diff
      introduces?
- [ ] Is a new queue/job consumer idempotent — does it check its own
      completion before re-running a step?
- [ ] Does a resource multiple humans can edit concurrently use
      optimistic concurrency?

**Habits**
- [ ] Does a security-relevant mutation write an audit event with a
      snapshot, at write time?
- [ ] Is there a new abstraction in this diff with only one real
      caller — built ahead of an actual second need, not because one
      exists yet?
- [ ] Does a new service expose `/health` and wire graceful shutdown?

## How to use this file

For a new module in this repo: read the cited ADR for any rule that
seems to conflict with what you're about to build — the ADR has the
full reasoning, this file has the compressed rule. For a review, work
through §8 against the diff directly, only dropping into the numbered
sections above when a checklist item needs the fuller reasoning to
judge whether a "no" actually matters here. For a team outside
this repo: every rule above stands on its own without the citations;
treat the cited ADRs as *this project's* specific implementation of a
principle that applies more broadly.
