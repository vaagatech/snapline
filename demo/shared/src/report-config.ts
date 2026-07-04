import type { ReportConfig, ReportFormat } from '@vaagatech/snapline-core';

const VALID_FORMATS = new Set<ReportFormat>(['json', 'html', 'text']);

function parseFormat(value: string | undefined): ReportFormat | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.toLowerCase() as ReportFormat;
  return VALID_FORMATS.has(normalized) ? normalized : undefined;
}

function defaultOutputPath(format: ReportFormat): string {
  const extension = format === 'text' ? 'txt' : format;
  return `./reports/test-report.${extension}`;
}

export function resolveReportConfig(argv: string[] = process.argv): ReportConfig | undefined {
  const envFormat = parseFormat(process.env.REPORT_FORMAT);
  const envOutput = process.env.REPORT_OUTPUT;

  let cliFormat: ReportFormat | undefined;
  let cliOutput: string | undefined;

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
    }
  }

  const format = cliFormat ?? envFormat;
  if (!format) {
    return undefined;
  }

  return {
    format,
    outputPath: cliOutput ?? envOutput ?? defaultOutputPath(format),
  };
}
