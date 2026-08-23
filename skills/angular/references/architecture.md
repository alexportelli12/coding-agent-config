# Architecture

Reason about Angular architecture within the workspace that actually exists.
Do not impose a universal modulith, vertical-slice, Nx, or four-layer layout.

## Map the Existing System

- Inspect workspace configuration, project boundaries, route and lazy-loading
  structure, path mappings, local instructions, and the closest feature before
  adding a boundary.
- Treat documented architecture and an intentional local pattern as stronger
  evidence than a framework-general preference. A repository can contain more
  than one valid style for historical or product reasons; extend the relevant
  one unless the task explicitly changes architecture.
- Separate evidence from inference. A directory name or import frequency does
  not by itself prove ownership or intended dependency direction.

## Boundaries and Direction

- Align feature or domain boundaries with ownership, change frequency, route
  lifecycle, and product language. A boundary earns its cost when it limits
  coupling or gives a team a useful contract.
- Prefer dependencies on stable public contracts over another feature's
  implementation details. Keep dependency direction understandable and avoid
  cycles; use the repository's architecture tooling or compiler configuration
  to enforce mechanical boundaries where available.
- Encapsulate internals when the workspace has a public/internal convention.
  Barrel files, package exports, path aliases, or explicit entry points are
  useful only when they are consistent with the local module system. Do not add
  aliases and `index.ts` files as ceremony.
- Keep shared code genuinely generic and stable. A `shared` folder is not a
  safe place for feature-specific behavior that has lost an owner.

## Layering and Abstractions

It can be useful to distinguish feature orchestration, presentational UI, data
access, and pure utilities, but use those responsibilities to clarify a local
design rather than to require four folders everywhere.

- Add a service or facade when it owns injected dependencies, lifecycle,
  coordination, or a stable feature contract. Do not create a pass-through
  service with no ownership benefit.
- Add state boundaries when state is shared or has a meaningful lifecycle; keep
  local state local. Coordinate with `state-management.md`.
- Keep transport details behind the established data boundary and avoid
  allowing a page to become a cross-feature integration hub. Coordinate with
  `data-access.md`.
- Make lazy boundaries reflect loading, ownership, and navigation behavior. Do
  not lazy-load arbitrary files or reorganize routes solely to satisfy a folder
  taxonomy.

## Evolving Safely

- Prefer a bounded change that follows an existing boundary. If a new feature
  exposes a real architectural gap, document the decision in the repository's
  established form and migrate affected consumers deliberately.
- Keep public APIs narrow and remove accidental exports. Before changing one,
  search its consumers and decide whether compatibility, a staged migration, or
  a direct change matches the task.
- Do not rely on prose to enforce naming, formatting, import restrictions,
  circular-dependency checks, or other deterministic rules. Preserve the
  reasoning behind those boundaries, and let repository tooling report the
  violations.
