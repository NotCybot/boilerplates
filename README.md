# boilerplates

Docker Compose stacks from my homelab.

## Read this first

The real projects are hosted on a private, self-hosted GitLab instance for
security and privacy reasons. That instance is not reachable from the internet
and is the source of truth. This repository is a sanitized export of it, not a
mirror: it is updated by hand and can lag behind.

Before publishing, everything that identifies the real environment was replaced:

| Original                    | Here                                      |
| --------------------------- | ----------------------------------------- |
| Domains                     | `example.com`, `example.org`              |
| Internal IP addresses       | `192.0.2.x` (RFC 5737 documentation range) |
| Mail addresses, SMTP host   | `user@example.com`, `smtp.example.com`    |
| Secrets, tokens, passwords  | empty, or `${VARIABLE}` read from `.env`  |
| Some hostnames              | generic names (`pi01`, `nas01`)           |

Nothing here works unchanged. Replace the placeholders with your own values.
`192.0.2.x` addresses in particular are not routable anywhere, so a stack that
still contains one is not configured yet.

## Architecture

Everything runs on a single Proxmox VE host (`pve01`).

- **Docker VM** (`portainer-pi`): runs the Compose stacks in this repository.
  Traefik on the same VM terminates TLS and routes to the services.
- **Database VM** (`pg01`): NixOS, runs the central PostgreSQL instances.
  Stacks that need a database (`authentik`, `coder`, `sure`) connect to it over
  the network with `sslmode=require` instead of running their own Postgres
  container. `DB_HOST` in those stacks points at this VM. The NixOS
  configuration is not part of this repository.

## Contents

| Directory            | What it is                                                          |
| -------------------- | ------------------------------------------------------------------- |
| `adguard-sync`       | AdGuard Home config sync between two instances                      |
| `authentik`          | Authentik identity provider                                         |
| `coder`              | Coder remote development environments                               |
| `couchdb`            | CouchDB                                                             |
| `free-games-claimer` | Free Games Claimer                                                  |
| `gatus`              | Gatus health checks with Discord alerts, plus a watchdog instance   |
| `gitlab`             | GitLab CE                                                           |
| `gitlab-runner`      | GitLab Runner, Docker executor                                      |
| `homarr`             | Homarr dashboard                                                    |
| `monitoring`         | Prometheus, Grafana, Loki, Alloy, Alertmanager                      |
| `openwebui`          | Open WebUI                                                          |
| `renovate`           | Mend Renovate CE                                                    |
| `renovate-pipeline`  | Renovate as a GitLab CI pipeline, with the shared preset            |
| `sure`               | Sure personal finance app                                           |
| `tautulli`           | Tautulli                                                            |
| `technitium`         | Technitium DNS server                                               |
| `traefik`            | Traefik reverse proxy with file provider config and error pages     |
| `vaultwarden`        | Vaultwarden                                                         |

Each directory corresponds to one GitLab project. Comments are in English or
German, as written.

## What is missing

- Per-project `.gitlab-ci.yml` and `renovate.json`. They include CI/CD
  components from the private instance and do nothing outside it. The one CI
  file that is kept (`renovate-pipeline/ci`) still references
  `components/security/secret-scan`; remove that include or supply your own.
- `.env` files. Use the `.env.example` / `example.env` in each directory where
  one exists; otherwise the required variables are the `${...}` references in
  `docker-compose.yml`.

## Use

```bash
cd <directory>
cp .env.example .env   # if present, then fill it in
docker compose config  # must pass before you start anything
docker compose up -d
```

Most stacks expect an external Docker network for Traefik and Traefik labels on
the service. Check `networks:` and `labels:` and adjust or remove them.

Image tags are pinned to the versions that were running at export time. Check
for newer releases before deploying.

Provided as is, without support.
