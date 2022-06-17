const { cdk } = require('projen');
const { NpmAccess } = require('projen/lib/javascript');

const organizationName = '@gemeentenijmegen';
const projectName = 'nijmegen-projen';
const packageName = `${organizationName}/${projectName}`;

const project = new cdk.JsiiProject({
  author: organizationName,
  repository: 'https://github.com/GemeenteNijmegen/nijmegen-projen.git',
  defaultReleaseBranch: 'main',
  name: projectName,
  license: 'EUPL-1.2',
  release: true,
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,
  deps: ['projen'],
  peerDeps: ['projen'], // Make sure the consuming library will provide a projen version.
  packageName: packageName,
});

project.synth();