# Renovate Pipeline

Self-hosted Renovate as a CI pipeline. Autodiscovers every repo in the GitLab
groups `homelab` and `components` and opens dependency-update merge requests in each.

## Files

| File                | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `ci/config.js`      | Renovate config (portable). Discovery, throttling, schedule. |
| `ci/.gitlab-ci.yml` | GitLab CI job (platform plumbing).                           |
| `../.gitlab-ci.yml` | Root, includes `ci/.gitlab-ci.yml`.                          |
| `../default.json`   | Shared preset all homelab repos extend on onboarding.        |
| `../renovate.json`  | This repo's own config. Extends the preset, like every other. |

## Setup

1. **Bot user + token.** Create a GitLab user for Renovate, add it to the
   `homelab` and `components` groups with at least _Developer_ (better _Maintainer_) role.
   Create a Personal Access Token with scope **`api`**.

2. **GitHub.com token (read-only).** Create a github.com PAT with **no scopes**
   (or just `public_repo`). Renovate uses it to fetch changelogs/release notes
   and dodge github.com API rate limits — it does **not** push changes.

3. **CI/CD variables** (Settings → CI/CD → Variables, mask them):
   - `RENOVATE_TOKEN` = the GitLab PAT (scope `api`).
   - `RENOVATE_ENDPOINT` = `https://gitlab.example.com/api/v4` (your instance).
   - `GITHUB_COM_TOKEN` = the github.com read-only PAT above.

4. **Schedule** (Settings → CI/CD → Pipeline schedules): add a cron schedule,
   e.g. nightly `0 2 * * *`. (Renovate's own `schedule` in `config.js` limits the
   windows in which MRs are actually created.)

5. **Manual run:** CI/CD → Pipelines → _Run pipeline_.

## Test before going live (dry run)

Add a temporary CI/CD variable `RENOVATE_DRY_RUN=full`, run the pipeline, and
check the job log: it lists discovered repos and _would-be_ MRs without creating
anything. Remove the variable to go live.

Validate config syntax locally:

```sh
node -c ci/config.js
npx --yes renovate-config-validator ci/config.js
```

## Changing things

- **Group path:** edit `autodiscoverFilter` in `ci/config.js`.
- **Renovate version:** bump the pinned tag in `ci/.gitlab-ci.yml`
  (check https://hub.docker.com/r/renovate/renovate/tags).
- **MR throttling / schedule windows:** edit `ci/config.js`.

## Later: Forgejo/Gitea

1. Add `ci/.forgejo/workflows/renovate.yml` (Forgejo Actions) mirroring the job.
2. In `config.js`: set `platform: 'gitea'`, point `endpoint` at the Forgejo API,
   supply the token via env.
3. Discovery (`autodiscover` + `autodiscoverFilter`) stays the same.
