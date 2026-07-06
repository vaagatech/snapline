import type { AuthAdapter } from '@vaagatech/snapline-auth-adapters';
import type { SnaplineOptions } from '@vaagatech/snapline-engine';
import type { FixtureLayout } from './fixture-layout.js';

type FixturePresetRef = string;

export interface FixtureFileNames {
  caseMetaFile?: string;
  expectedFile?: string;
  liveFile?: string;
  queryFile?: string;
  variablesFile?: string;
  restInputFile?: string;
  soapInputFile?: string;
}

export interface FixtureCaseMeta
  extends Omit<SnaplineOptions, 'transformations' | 'dataMapping'>,
    FixtureFileNames {
  name: string;
  expectMatch: boolean;
  failureType?: 'dataMapping' | 'transformation' | 'auth';
  expectedDiffPath?: string;
  skipAuth?: boolean;
  expectStatus?: number;
  dataPath?: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
  protocol?: 'rest' | 'graphql' | 'soap';
  soapAction?: string;
  transformations?: SnaplineOptions['transformations'] | FixturePresetRef;
  dataMapping?: SnaplineOptions['dataMapping'] | FixturePresetRef;
}

/** Scenario-level defaults; individual `case.json` fields override these when set. */
export interface FixtureCaseDefaults
  extends Omit<SnaplineOptions, 'transformations' | 'dataMapping'>,
    FixtureFileNames {
  transformations?: SnaplineOptions['transformations'] | FixturePresetRef;
  dataMapping?: SnaplineOptions['dataMapping'] | FixturePresetRef;
}

export interface FixtureCasePresetMaps {
  transformations?: Record<string, SnaplineOptions['transformations']>;
  dataMapping?: Record<string, SnaplineOptions['dataMapping']>;
}

export interface RunApiFixtureCasesOptions {
  suiteName: string;
  fixturesRoot: string;
  baseUrl: string;
  auth?: AuthAdapter;
  authHeaders?: Record<string, string>;
  layout?: FixtureLayout;
  defaults?: FixtureCaseDefaults & {
    endpoint?: string;
    protocol?: 'rest' | 'graphql' | 'soap';
    dataPath?: string;
  };
  presets?: FixtureCasePresetMaps;
  caseIds?: string[];
}

export interface RunSnaplineFixtureCasesOptions {
  suiteName: string;
  fixturesRoot: string;
  layout?: FixtureLayout;
  defaults?: FixtureCaseDefaults;
  presets?: FixtureCasePresetMaps;
  caseIds?: string[];
}
