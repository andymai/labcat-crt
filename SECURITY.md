# Security Policy

## Reporting a Vulnerability

Use [GitHub Security Advisories](https://github.com/andymai/labcat-crt/security/advisories/new) for private disclosure. Include description, repro steps, impact, and any suggested fix.

## Supply Chain

In response to the 2025–2026 wave of npm and GitHub Actions supply-chain attacks (Shai-Hulud worm, chalk/debug compromise, tj-actions tag retag, prt-scan AI campaign), the build is configured to fail closed on the patterns those attacks exploited:

| Defense | Where | What it blocks |
|---|---|---|
| `minimumReleaseAge: 10080` (7d cooldown) | `pnpm-workspace.yaml` | Fresh malicious uploads. Would have blocked axios, chalk/debug, durabletask. |
| `ignoreScripts: true` + `allowBuilds` allowlist | `pnpm-workspace.yaml` | Postinstall lifecycle scripts — Shai-Hulud's primary spread vector. |
| All GitHub Actions pinned to commit SHA | `.github/workflows/*.yml` | Tag-retag attacks (tj-actions class). |
| OSV scan against `pnpm-lock.yaml` (PRs report-only, main blocking) | `.github/workflows/osv-scan.yml` | Known-CVE versions in the lockfile. |
| Dependabot cooldown (7d default / 14d major) for npm + github-actions | `.github/dependabot.yml` | Fresh malicious version proposals. |
