import { bootstrapScenario } from '@vaagatech/snapline-demo-shared';
import scenario from './scenario.js';

const exitCode = await bootstrapScenario(scenario);
process.exitCode = exitCode;
