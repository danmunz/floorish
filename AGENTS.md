# AGENTS.md — Floorish Development Guidelines

## Commit Discipline

- **Atomic commits**: Each commit should represent a single, self-contained change. Do not combine unrelated changes in one commit.
- **Descriptive messages**: Use clear, imperative commit messages (e.g., "Add grid snapping to furniture placement", not "updates" or "fix stuff").
- **New branches for significant changes**: Create a feature or fix branch for any non-trivial work. Branch names should be descriptive (e.g., `feat/export-pdf`, `fix/calibration-rounding`). Push the branch and open a pull request — do not merge into `main` automatically. The PR should be left open for review.
- **No commits to main without test coverage**: Every commit merged to `main` must include passing tests that cover the changed functionality. Run `npm test` before pushing. If adding new logic, add corresponding tests in the relevant `*.test.ts` / `*.test.tsx` file.

## README Maintenance

- **README must stay current**: Any PR, merge, or commit to `main` that changes user-facing behavior, adds features, or modifies setup steps must include a corresponding update to `README.md`.
- The CI pipeline enforces this: the deploy workflow rebuilds and redeploys on every push/merge to `main`.

## Testing

- Tests use **Vitest** with **React Testing Library** and **jsdom**.
- Test files live alongside the code they test (e.g., `geometry.test.ts` next to `geometry.ts`).
- Run tests: `npm test` (single run) or `npm run test:watch` (watch mode).
- All tests must pass before merging to `main`.

## Deployment

- The app is deployed to **GitHub Pages** via GitHub Actions.
- Every push or merge to `main` triggers a build-and-deploy pipeline.
- The pipeline runs tests first — a failing test suite blocks deployment.
