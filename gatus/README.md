# gatus

Health checks for the homelab with Discord alerts. Checks go beyond "port is
open": response bodies, DNS answers per resolver, certificate expiry, and
heartbeats from jobs that must report in.

## Layout

- `config/config.yaml`: global settings and all endpoints for this site
- `watchdog/`: second instance on pi01 that watches this one
- `config/site-b.yaml.example`: checks for the second site over the VPN. Fill in,
  rename to `site-b.yaml`. Gatus merges every `*.yaml` in `config/`.
- `example.env`: required variables

## Deploy

1. Copy `example.env` to `.env` (or set the variables in Portainer) and fill it.
2. Under Portainer: copy `config/` to `/etc/dockercompose/gatus/config` and set
   `GATUS_CONFIG_DIR` to that path. Under Dockhand the relative default works.
3. `docker compose up -d`, then `docker logs gatus` must show
   `Validated N endpoints` and no errors.

### Where to run it

On `portainer-pi` (192.0.2.11), next to Traefik, which picks up the labels.
Trade-off: if that host dies, Gatus dies with it and no alert goes out.

Reachable at `https://status.example.com` and
`https://gatus.example.com`, both resolving internally via the
`*.example.com` wildcard in Technitium. Without Traefik or DNS:
`http://192.0.2.11:8080`.

**No login.** Gatus has nothing to change from the browser, so a password would
only guard the information, not the state. Instead the router carries an
`ipallowlist` middleware for RFC1918, because that information is worth
guarding: the page lists internal hosts, IPs, ports, and what is down right
now. `/metrics` is unauthenticated too and sits behind the same middleware.

Publishing this page later is therefore a deliberate step, not just a DNS
record: drop the middleware, and give every endpoint `hide-hostname`,
`hide-url` and `hide-conditions` first. The heartbeat API stays protected
either way, it needs the bearer token.

## Watchdog

`watchdog/` is a second, three-check Gatus for pi01 (192.0.2.12), the only
machine here that is not a pve01 guest. It watches the host of the main
instance, its port, and whether Traefik still serves. Without it, an outage of
portainer-pi takes out the monitoring too and no alert goes out.

Deploy it from the `watchdog/` directory with the same `.env`. It gets no
Traefik route on purpose: `http://192.0.2.12:8080`.

dns01 lives here because a container cannot reach the port its own host
publishes: from portainer-pi, `192.0.2.11:53` times out. Keep the rest of the
checks in the main instance, anything duplicated here alerts twice.

## Heartbeats

Jobs push their result; no push within the interval raises an alert. Add this
as the last step of a job, e.g. in `renovate-pipeline`:

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $GATUS_HEARTBEAT_TOKEN" \
  "https://status.example.com/api/v1/endpoints/heartbeats_renovate-nightly/external?success=true"
```

Key format is `<group>_<name>`. New job: add an entry under
`external-endpoints` in `config/config.yaml`.

## Known limits

- **Full internet outages do not reach Discord.** Discord is unreachable, and
  Gatus does not retry an alert it failed to send. The outage shows up in the
  history on the status page. A live alert needs a Gatus (or similar)
  outside this network watching in, e.g. at the second site.
- **Everything fails at once when dns02 is down.** It is the only resolver this
  container can use, see the comment in `docker-compose.yml`.

## Metrics

`metrics: true` exposes `/metrics`. Add a scrape job in `homelab/monitoring` to
get uptime and latency into Grafana.
