import { join } from 'node:path';
import type { FixtureCaseDefaults, FixtureCaseMeta } from './types.js';

export interface FixtureLayout {
  /** Subdirectory under `fixturesRoot` containing case folders. Default: `cases` */
  casesDir?: string;
  caseMetaFile?: string;
  expectedFile?: string;
  liveFile?: string;
  queryFile?: string;
  variablesFile?: string;
  restInputFile?: string;
  soapInputFile?: string;
}

export const DEFAULT_FIXTURE_LAYOUT = {
  casesDir: 'cases',
  caseMetaFile: 'case.json',
  expectedFile: 'expected.json',
  liveFile: 'live.json',
  queryFile: 'query.graphql',
  variablesFile: 'variables.json',
  restInputFile: 'input.json',
  soapInputFile: 'input.xml',
} as const satisfies FixtureLayout;

export type ResolvedFixtureLayout = {
  [K in keyof typeof DEFAULT_FIXTURE_LAYOUT]: string;
};

export function resolveFixtureLayout(
  layout?: FixtureLayout,
  defaults?: FixtureCaseDefaults,
  meta?: FixtureCaseMeta,
): ResolvedFixtureLayout {
  return {
    casesDir: layout?.casesDir ?? DEFAULT_FIXTURE_LAYOUT.casesDir,
    caseMetaFile:
      meta?.caseMetaFile ?? defaults?.caseMetaFile ?? layout?.caseMetaFile ?? DEFAULT_FIXTURE_LAYOUT.caseMetaFile,
    expectedFile:
      meta?.expectedFile ?? defaults?.expectedFile ?? layout?.expectedFile ?? DEFAULT_FIXTURE_LAYOUT.expectedFile,
    liveFile: meta?.liveFile ?? defaults?.liveFile ?? layout?.liveFile ?? DEFAULT_FIXTURE_LAYOUT.liveFile,
    queryFile: meta?.queryFile ?? defaults?.queryFile ?? layout?.queryFile ?? DEFAULT_FIXTURE_LAYOUT.queryFile,
    variablesFile:
      meta?.variablesFile ?? defaults?.variablesFile ?? layout?.variablesFile ?? DEFAULT_FIXTURE_LAYOUT.variablesFile,
    restInputFile:
      meta?.restInputFile ?? defaults?.restInputFile ?? layout?.restInputFile ?? DEFAULT_FIXTURE_LAYOUT.restInputFile,
    soapInputFile:
      meta?.soapInputFile ?? defaults?.soapInputFile ?? layout?.soapInputFile ?? DEFAULT_FIXTURE_LAYOUT.soapInputFile,
  };
}

export function caseFilePath(caseDir: string, fileName: string): string {
  return join(caseDir, fileName);
}
