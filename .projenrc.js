const { cdk } = require('projen');
const { NpmAccess } = require('projen/lib/javascript');

const organizationName = '@gemeentenijmegen';
const projectName = 'projen-project-type';
const packageName = `${organizationName}/${projectName}`;

const project = new cdk.JsiiProject({
  author: organizationName,
  repository: 'https://github.com/GemeenteNijmegen/modules-projen.git',
  defaultReleaseBranch: 'main',
  name: projectName,
  license: 'EUPL-1.2',
  release: true,
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,
  devDeps: [
    '@types/jest@28.1.1', // Pin and exclude as jsii complains about dependencies otherwise...
  ],
  //deps: ['projen'],
  peerDeps: ['projen'], // Make sure the consuming library will provide a projen version.
  packageName: packageName,
  depsUpgradeOptions: {
    exclude: ['@types/jest'],
  },
  scripts: {
    extract: 'cd dist/js && rm -rf package && tar -xzvf modules-projen@*',
  },
});

project.synth();