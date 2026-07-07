import type { ReportConfig, ReportFormat } from './types.js';

const VALID_FORMATS = new Set<ReportFormat>(['json', 'html', 'text']);

export interface ResolveReportConfigOptions {
  argv?: string[];
  /** Used when CLI/env do not set `--report-output` / `REPORT_OUTPUT`. */
  defaultOutputPath?: string | ((format: ReportFormat) => string);
}

function parseFormat(value: string | undefined): ReportFormat | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.toLowerCase() as ReportFormat;
  return VALID_FORMATS.has(normalized) ? normalized : undefined;
}

function builtInDefaultOutputPath(format: ReportFormat): string {
  const extension = format === 'text' ? 'txt' : format;
  return `./reports/test-report.${extension}`;
}

function resolveDefaultOutputPath(
  format: ReportFormat,
  custom?: string | ((format: ReportFormat) => string),
): string {
  if (typeof custom === 'function') {
    return custom(format);
  }

  if (custom) {
    return custom;
  }

  return builtInDefaultOutputPath(format);
}

/** Resolve report output from CLI flags (`--report-format`, `--report-output`) or env vars. */
export function resolveReportConfig(
  argvOrOptions: string[] | ResolveReportConfigOptions = process.argv,
): ReportConfig | undefined {
  const options: ResolveReportConfigOptions = Array.isArray(argvOrOptions)
    ? { argv: argvOrOptions }
    : argvOrOptions;
  const argv = options.argv ?? process.argv;

  const envFormat = parseFormat(process.env.REPORT_FORMAT);
  const envOutput = process.env.REPORT_OUTPUT;

  let cliFormat: ReportFormat | undefined;
  let cliOutput: string | undefined;
  let cliRedactFields: string[] | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }
    if (arg.startsWith('--report-format=')) {
      cliFormat = parseFormat(arg.split('=')[1]);
    } else if (arg === '--report-format') {
      cliFormat = parseFormat(argv[index + 1]);
    } else if (arg.startsWith('--report-output=')) {
      cliOutput = arg.split('=')[1];
    } else if (arg === '--report-output') {
      cliOutput = argv[index + 1];
    } else if (arg.startsWith('--report-redact-fields=')) {
      cliRedactFields = arg.split('=')[1]?.split(',').map((field) => field.trim()).filter(Boolean);
    } else if (arg === '--report-redact-fields') {
      cliRedactFields = argv[index + 1]?.split(',').map((field) => field.trim()).filter(Boolean);
    }
  }

  const envRedactFields = process.env.REPORT_REDACT_FIELDS?.split(',')
    .map((field) => field.trim())
    .filter(Boolean);

  const format = cliFormat ?? envFormat;
  if (!format) {
    return undefined;
  }

  const redactFields = cliRedactFields ?? envRedactFields;

  return {
    format,
    outputPath:
      cliOutput ?? envOutput ?? resolveDefaultOutputPath(format, options.defaultOutputPath),
    ...(redactFields?.length ? { redactFields } : {}),
  };
}
