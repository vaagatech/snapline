import { bootstrapScenario } from '@vaagatech/demo-shared';
import scenario from './scenario.js';

const exitCode = await bootstrapScenario(scenario);
process.exitCode = exitCode;
