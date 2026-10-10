# gitlab-runner

Docker-executor GitLab Runner for the `homelab` group.

## Deployment

`config/config.toml` in this repo is a **template**. The live file lives at
`/etc/dockercompose/gitlab-runner/config/config.toml` and holds the real runner
token, which must never be committed.

**Do not copy this file over the live one** — that blanks the token and the
runner stops picking up jobs. Apply changes line by line on the host instead,
then restart:

```bash
docker compose up -d --force-recreate gitlab-runner
```

## DNS

Job containers get `dns` pointed at Technitium explicitly. The host resolves
through `127.0.0.1`, but Docker drops loopback nameservers and substitutes
public DNS, so without this setting nothing inside a job can resolve
`*.local.example.com` — not even the clone of the repo being built.

## Cleanup

There is no automatic image cleanup. Jobs get no `docker.sock`, so a job cannot
start containers on the host, and nothing else here prunes. Old images (previous
versions left behind by Renovate updates, job images) pile up until someone runs
`docker image prune -af --filter until=168h` on the host by hand.
