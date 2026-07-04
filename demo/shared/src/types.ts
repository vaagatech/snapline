import type { TestSuiteResult } from '@vaagatech/snapline-core';
import type { DemoDatabase } from './sqlite-setup.js';

export interface ScenarioContext {
  baseUrl: string;
  database: DemoDatabase;
}

export interface ScenarioModule {
  name: string;
  needsServer: boolean;
  needsDatabase: boolean;
  run: (context: ScenarioContext) => Promise<TestSuiteResult>;
}
