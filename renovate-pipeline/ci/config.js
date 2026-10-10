// Renovate config — portable across GitLab (now) and Forgejo/Gitea (later).
// Platform plumbing (token, endpoint) comes from env; discovery logic lives here.
module.exports = {
  platform: 'gitlab',
  endpoint: process.env.RENOVATE_ENDPOINT, // e.g. https://gitlab.example.com/api/v4
  token: process.env.RENOVATE_TOKEN,       // GitLab PAT, scope: api (bot user)

  // Our GitLab resolves to a private IP. Renovate warns that a future major
  // defaults internalHostAccess to block, which would cut it off from the
  // platform itself. Allow this host explicitly, nothing else.
  hostRules: [
    { matchHost: 'gitlab.pve01.local.example.com', allowInternal: true },
  ],

  // Scan every repo in the homelab and components groups. Self-maintaining:
  // new repos picked up automatically. The bot needs Developer in both.
  autodiscover: true,
  autodiscoverFilter: ['homelab/**', 'components/**'],

  // Note: github.com read-only token for changelogs/release notes is supplied
  // via the GITHUB_COM_TOKEN env var in the CI job, not here.

  onboarding: true,
  // New repos onboard by extending the shared preset in this repo, so all
  // homelab repos inherit one source of truth. Adjust path if repo moves.
  onboardingConfig: {
    $schema: 'https://docs.renovatebot.com/renovate-schema.json',
    extends: ['local>homelab/renovate-pipeline'],
  },

  dependencyDashboard: true,
  semanticCommits: 'enabled',

  // Homelab-friendly throttling so MRs don't flood. Kept only here: the shared
  // preset used to repeat these with different numbers and, as repo config,
  // silently won.
  prConcurrentLimit: 5,
  prHourlyLimit: 2,

  // Without this the schedule below is interpreted as UTC.
  timezone: 'Europe/Berlin',

  // Limit MR creation to off-peak windows (scan can run anytime via schedule/manual).
  schedule: [
    'after 10pm every weekday',
    'before 5am every weekday',
    'every weekend',
  ],
};
