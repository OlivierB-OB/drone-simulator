# Relation - OpenStreetMap Wiki

## Overview

**Relations** constitute organized collections of objects including nodes, ways, and other relations. They form one of three core data elements in OpenStreetMap's data model, alongside nodes and ways.

A relation requires at minimum a `type=*` tag and a group of **members**—an ordered list containing one or more nodes, ways, or relations. This structure defines logical or geographic connections between different objects (such as a lake containing an island, or multiple roads comprising a bus route). Members may optionally possess a **role** indicating their function within the relation. Relations can include additional descriptive tags like `name=*`, `wikidata=*`, or `destination=*`.

> "As of January 2026, OpenStreetMap contains over 14 million relations"

## Contents

- [Usage](#usage)
- [Size](#size)
- [Roles](#roles)
- [Examples of Relations](#examples-of-relations)
- [Tools](#tools)
- [Navigation on Relations](#navigation-on-relations)
- [OSM XML](#osm-xml)
- [See Also](#see-also)

## Usage

Relations model logical and geographic relationships between objects. They are unsuitable for loosely associated but geographically dispersed items—for example, grouping all footpaths in England would be inappropriate.

The simplest relations contain only geometric members (nodes or ways). Relations may also incorporate child relations, informally termed "super-relations." While relations containing both geometric members and child relations are uncommon, they remain permissible.

For practical utility, relation trees should eventually include geometric members. Empty relations, though technically permitted, offer minimal value except as placeholders. The iD editor automatically removes empty relations created by member deletion.

## Size

A technical limit of 32,000 elements per relation exists. Experts recommend avoiding more than approximately 300 members per relation, as larger relations become increasingly difficult to manage, more prone to errors, and more resource-intensive.

Large relations sometimes prove inevitable. For instance, the boundary relation for Russia contains over 5000 ways as outer members.

## Roles

A **role** is an optional text field describing a member's function within a relation.

**Multipolygon Relations:** Use `outer` and `inner` roles to specify whether a way forms the exterior or interior boundary.

**Waterway Relations:** Use `main_stream` for the primary river course and `side_stream` for tributaries that rejoin the main flow.

## Examples of Relations

### Multipolygon

Multipolygons represent one of two methods for mapping areas in OpenStreetMap. While most areas use a single closed way, multipolygons become necessary for areas with inner rings (holes), multiple outer sections (exclaves), or exceeding ~2000 nodes.

Example: A lake with an island uses two ways—one marked `outer` for the lake boundary and one marked `inner` for the island (potentially tagged with `natural=bare_rock` if rocky).

### Bus Route

Bus route variations use relations with `type=route` and `route=bus` tags, along with recommended tags including `name=*`, `ref=*`, `from=*`, `to=*`, and `operator=*`.

Members follow this pattern:
- Stop nodes listed first with role 'stop', ordered by vehicle travel direction
- Ways added afterward, forming an ordered sequence connecting stops
- Ways receive no roles

### Other Examples

- `Relation:boundary` — administrative boundaries and protected areas
- `Relation:restriction` — turn restrictions and movement limitations
- Additional types available in Types of Relation

## Tools

- **iD Editor:** Guide for adding relations
- **JOSM:** Advanced relation editing capabilities
- **Potlatch 2:** Relation editing interface
- **Relatify:** Bus and tram route editing (PTv2 standard)
- **Relation Analyzer** — analyzes relations and searches by name/type/operator
- **Mapki's Deep Diff** — historical analysis of relation modifications
- **Relation Diff** — relation comparison utility
- **Rel2gpx** — exports relation ways to GPX format
- **OSM Inspector (Geofabrik)** — checks PTv2 route relation errors
- **Public Transport Network Analysis** — validates PT v2 relation integrity

## Navigation on Relations

OSRM and Valhalla routing engines utilize certain route relation roles to influence turn-by-turn guidance when representing bidirectional travel. Bicycle routers may prefer existing bicycle route relations as cycling usability indicators. Applications may follow pilgrimage routes or minimize numbered road route segments.

## OSM XML

Relations in OpenStreetMap XML format contain `member` elements and `tag` elements:

```xml
<relation id="13092746" visible="true" version="7"
  changeset="118825758" timestamp="2022-03-23T15:05:48Z">
  <member type="node" ref="5690770815" role="stop"/>
  <member type="node" ref="5751940550" role="stop"/>
  <member type="way" ref="96562914" role=""/>
  <tag k="from" v="Encre"/>
  <tag k="name" v="9-Montagnes de Guyane"/>
  <tag k="type" v="route"/>
  <tag k="route" v="bus"/>
</relation>
```

## See Also

- Relations Are Not Categories
- Empty Relations
- Video Examples

---

**Last Updated:** January 10, 2026

**License:** Creative Commons Attribution-ShareAlike 2.0
