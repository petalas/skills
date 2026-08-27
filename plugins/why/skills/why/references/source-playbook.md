# Source playbooks

Assign one read-only investigator per available evidence lane. Adapt vendor examples to the tools the host actually exposes.

| Evidence lane                | Playbook                                               | Example capability                               |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Repository archaeology       | [`code-archaeology.md`](./sources/code-archaeology.md) | Git and a read-only repository CLI               |
| Issue tracking               | [`linear.md`](./sources/linear.md)                     | A user-scoped issue tracker                      |
| Documents                    | [`notion.md`](./sources/notion.md)                     | Local or user-scoped external documents          |
| Infrastructure observability | [`datadog.md`](./sources/datadog.md)                   | Metrics, logs, traces, dashboards, and incidents |
| Error tracking               | [`sentry.md`](./sources/sentry.md)                     | Errors, events, releases, and stack traces       |
| Product analytics            | [`databricks.md`](./sources/databricks.md)             | Read-only SQL over event data                    |

Search local ADRs, RFCs, product notes, and postmortems directly. Use an external document capability only for sources the user has placed in scope.

Use [`incident-postmortem.md`](./sources/incident-postmortem.md) as a cross-cutting angle when the target code is defensive.

Do not add workplace chat, private correspondence, or external publishing as a lane.
