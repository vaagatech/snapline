import type { TestRunReport } from './types.js';

export interface HubConfig {
  hubUrl: string;
  label?: string;
  /** Logical project grouping for Hub UI filtering */
  project?: string;
  /** Searchable tags, e.g. ['node', 'demo'] */
  tags?: string[];
  fetchImpl?: typeof fetch;
}

export interface PushTestReportResult {
  id: string;
  url: string;
}

function normalizeHubUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function normalizeTags(tags?: string[]): string[] | undefined {
  if (!tags?.length) return undefined;
  const normalized = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
  return normalized.length ? normalized : undefined;
}

/** Push a TestRunReport to Snapline Hub for centralized storage and UI viewing. */
export async function pushTestReportToHub(
  report: TestRunReport,
  config: HubConfig,
): Promise<PushTestReportResult> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const hubUrl = normalizeHubUrl(config.hubUrl);
  const response = await fetchImpl(`${hubUrl}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...report,
      ...(config.label ? { label: config.label } : {}),
      ...(config.project ? { project: config.project } : {}),
      ...(normalizeTags(config.tags) ? { tags: normalizeTags(config.tags) } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Snapline Hub push failed (${response.status}): ${body}`);
  }

  const result = (await response.json()) as PushTestReportResult;
  return {
    id: result.id,
    url: `${hubUrl}${result.url}`,
  };
}

export interface ResolveHubConfigOptions {
  argv?: string[];
}

function parseTagsValue(value: string | undefined): string[] | undefined {
  if (!value?.trim()) return undefined;
  const tags = value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
  return tags.length ? tags : undefined;
}

/** Resolve hub URL from CLI (`--hub-url`) or env (`SNAPLINE_HUB_URL`). */
export function resolveHubConfig(
  argvOrOptions: string[] | ResolveHubConfigOptions = process.argv,
): HubConfig | undefined {
  const options: ResolveHubConfigOptions = Array.isArray(argvOrOptions)
    ? { argv: argvOrOptions }
    : argvOrOptions;
  const argv = options.argv ?? process.argv;

  let cliUrl: string | undefined;
  let cliLabel: string | undefined;
  let cliProject: string | undefined;
  let cliTags: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }
    if (arg.startsWith('--hub-url=')) {
      cliUrl = arg.split('=')[1];
    } else if (arg === '--hub-url') {
      cliUrl = argv[index + 1];
    } else if (arg.startsWith('--hub-label=')) {
      cliLabel = arg.split('=')[1];
    } else if (arg === '--hub-label') {
      cliLabel = argv[index + 1];
    } else if (arg.startsWith('--hub-project=')) {
      cliProject = arg.split('=')[1];
    } else if (arg === '--hub-project') {
      cliProject = argv[index + 1];
    } else if (arg.startsWith('--hub-tags=')) {
      cliTags = arg.split('=')[1];
    } else if (arg === '--hub-tags') {
      cliTags = argv[index + 1];
    }
  }

  const hubUrl = cliUrl ?? process.env.SNAPLINE_HUB_URL;
  if (!hubUrl) {
    return undefined;
  }

  return {
    hubUrl,
    label: cliLabel ?? process.env.SNAPLINE_HUB_LABEL,
    project: cliProject ?? process.env.SNAPLINE_HUB_PROJECT,
    tags: parseTagsValue(cliTags ?? process.env.SNAPLINE_HUB_TAGS),
  };
}
