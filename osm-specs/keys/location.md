# Key: `location` — Physical Placement

> Source: https://wiki.openstreetmap.org/wiki/Tag:location%3Dunderground

## Description

The `location=*` tag describes the physical placement of a feature relative to the ground surface. It is used when the feature's position cannot be inferred from other structural tags (e.g. `tunnel=*`, `bridge=*`).

## Element Types

- **Nodes / ways / areas / multipolygon relations**: may be used

## Values

| Value | Meaning | Rendering |
|-------|---------|-----------|
| `location=underground` | Feature is buried below the ground surface | Not rendered |
| `location=underwater` | Feature is submerged below the water surface | Not rendered |
| `location=overhead` | Feature is elevated above the ground but has no bridge structure | Rendered as elevated mesh (no deck) |
| `location=overground` | Feature is explicitly at ground level (surface) | Rendered normally |

## Status

De facto

---

## `location=underground`

The primary use case. Indicates infrastructure that is physically buried without necessarily having a mapped tunnel structure (e.g. the tunnel relation exists separately, or there is no tunnel at all).

**Common pairings:**

| Feature tag | Combined with | Example |
|-------------|--------------|---------|
| `highway=*` | `location=underground` | Underground city-centre road |
| `railway=subway` | `location=underground` | Metro/subway line section |
| `railway=rail` | `location=underground` | Underground intercity rail |
| `power=cable` | `location=underground` | Buried high-voltage cable |
| `man_made=pipeline` | `location=underground` | Buried pipeline |
| `amenity=*` | `location=underground` | Underground waste container |

**Distinction from `tunnel=yes`:**

- `tunnel=yes` implies a physical tunnel structure (arch, bore, portal) is present.
- `location=underground` states only that the feature runs underground — no structural assumption.
- Both signals result in the same rendering outcome: the feature is not rendered.

## `location=overhead`

Used for lines or cables that are elevated above ground but lack a formal bridge structure. Common for overhead power lines and aerial tramways where the support pylons are mapped separately.

**Common pairings:** `power=line`, `aerialway=cable_car`.

## Relation to Other Tags

| Tag | Purpose | When to use |
|-----|---------|-------------|
| `location=underground` | Feature is buried below ground | Infrastructure without explicit tunnel tag |
| `tunnel=yes` | Feature passes through a tunnel structure | Roads, rails in a physical tunnel bore |
| `layer=-1` | Relative vertical order at a crossing | Tunnels, underpasses at road junctions |
| `level=-1` | Feature is on an underground floor | Indoor-mapped basement features |

`layer=-1` alone does **not** mean underground — it is a crossing-order hint. Always combine with `tunnel=*` or `location=underground` to signal underground placement.

---

## Rendering Implications

| Tag combination | Rendering decision |
|----------------|--------------------|
| `location=underground` | Not rendered |
| `location=underwater` | Not rendered |
| `location=overhead` | Rendered as elevated geometry (no deck mesh) |
| `location=overground` | Rendered normally |
| `tunnel=yes` (any `layer`) | Not rendered |
| `layer < 0` only (no tunnel/location tag) | Render conservatively — `layer` alone is an ordering hint, not a hide signal |
