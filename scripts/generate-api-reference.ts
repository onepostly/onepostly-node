#!/usr/bin/env npx tsx
/**
 * Regenerate the README API reference section (between the GENERATED
 * markers) from the OpenAPI spec, so the published method tables can never
 * drift from the live contract. Run manually or from the generate workflow.
 */
import { readFile, writeFile } from "node:fs/promises";

const DEFAULT_SPEC_URL = "https://api.onepostly.com/openapi.json";
const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);
const BEGIN = "<!-- BEGIN GENERATED API REFERENCE -->";
const END = "<!-- END GENERATED API REFERENCE -->";

interface Operation {
  id: string;
  summary: string;
}

interface ParsedArgs {
  spec: string | null;
  readme: string;
}

interface OpenApiSpec {
  tags?: Array<{ name: string }>;
  paths?: Record<string, Record<string, { tags?: string[]; operationId?: string; summary?: string }>>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = { spec: null, readme: "README.md" };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--spec") args.spec = argv[(i += 1)];
    else if (argv[i] === "--readme") args.readme = argv[(i += 1)];
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  return args;
}

async function loadSpec(args: ParsedArgs): Promise<OpenApiSpec> {
  if (args.spec) return JSON.parse(await readFile(args.spec, "utf8")) as OpenApiSpec;
  const res = await fetch(DEFAULT_SPEC_URL);
  if (!res.ok) throw new Error(`Failed to fetch spec from ${DEFAULT_SPEC_URL}: ${res.status}`);
  return (await res.json()) as OpenApiSpec;
}

function collectGroups(spec: OpenApiSpec): Map<string, Operation[]> {
  const groups = new Map<string, Operation[]>();
  for (const methods of Object.values(spec.paths ?? {})) {
    for (const [verb, op] of Object.entries(methods)) {
      if (!HTTP_METHODS.has(verb) || !op.tags?.[0] || !op.operationId) continue;
      const tag = op.tags[0];
      if (!groups.has(tag)) groups.set(tag, []);
      groups
        .get(tag)!
        .push({ id: op.operationId, summary: (op.summary ?? "").replace(/\|/g, "\\|").trim() });
    }
  }
  return groups;
}

function apiReference(spec: OpenApiSpec): string {
  const groups = collectGroups(spec);
  const declared = (spec.tags ?? []).map((t) => t.name).filter((t) => groups.has(t));
  const rest = [...groups.keys()].filter((t) => !declared.includes(t));
  const lines: string[] = [];
  for (const tag of [...declared, ...rest]) {
    const instance = tag.charAt(0).toLowerCase() + tag.slice(1);
    lines.push(`### ${tag}Api`, "", "| Method | Description |", "| --- | --- |");
    for (const op of groups.get(tag)!) {
      lines.push(`| \`${instance}.${op.id}()\` | ${op.summary} |`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

const args = parseArgs(process.argv);
const spec = await loadSpec(args);
const readme = await readFile(args.readme, "utf8");
const begin = readme.indexOf(BEGIN);
const end = readme.indexOf(END);
if (begin === -1 || end === -1 || end < begin) {
  console.error(`README is missing the ${BEGIN} / ${END} markers.`);
  process.exit(1);
}
const updated =
  readme.slice(0, begin + BEGIN.length) + "\n\n" + apiReference(spec) + "\n" + readme.slice(end);
await writeFile(args.readme, updated);
console.log(`API reference regenerated in ${args.readme}.`);
