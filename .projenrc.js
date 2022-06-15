const { typescript } = require('projen');
const { NpmAccess } = require('projen/lib/javascript');

const projectName = '@gemeentenijmegen/nijmegen-projen';

const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: projectName,
  defaultReleaseBranch: 'main',
  license: 'EUPL-1.2',
  release: true,
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,
  deps: ['projen'],
  peerDeps: ['projen'], // Make sure the consuming library will provide a projen version.
  packageName: projectName,
});

project.synth();