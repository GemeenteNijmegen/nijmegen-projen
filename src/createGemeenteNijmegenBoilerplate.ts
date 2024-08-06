import { Construct } from 'constructs';
import PipelineStack from './boilerplate/pipeline';
import { TypescriptFile } from './TypescriptFile';

export function createGemeenteNijmegenBoilerplate(project: Construct) {
  return new TypescriptFile(project, 'src/PipelineStack.ts', PipelineStack);
}