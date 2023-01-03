import { synthSnapshot } from 'projen/lib/util/synth';
import { GemeenteNijmegenCdkApp, GemeenteNijmegenCdkLib, GemeenteNijmegenJsii, GemeenteNijmegenTsPackage } from '../src';

beforeAll(() => {
  process.env.DO_NOT_GENERATE_FILES_IN_TEST = 'true';
});

describe('NijmegenProject Defaults', () => {

  const project = new GemeenteNijmegenTsPackage({ defaultReleaseBranch: 'main', name: 'test project' });
  const snapshot = synthSnapshot(project);

  test('EUPL-1.2 license default', () => {
    expect(snapshot.LICENSE).toContain('EUROPEAN UNION PUBLIC LICENCE v. 1.2');
  });

  test('Release', () => {
    expect(snapshot['.github/workflows/release.yml']).toBeDefined();
  });

  test('PR Linting', () => {
    const allowedLabels = ['fix', 'feat', 'chore', 'docs'];
    const PrLintWorkflow = snapshot['.github/workflows/pull-request-lint.yml'];
    expect(PrLintWorkflow).toBeDefined();
    allowedLabels.forEach(l => expect(PrLintWorkflow).toContain(l));
  });

  test('Upgrade acceptance', () => {
    const upgradeWorkflow = snapshot['.github/workflows/upgrade-acceptance.yml'];
    expect(upgradeWorkflow).toBeDefined();
    expect(upgradeWorkflow).toContain('auto-merge');
  });

  test('Git ignore', () => {
    const defaults = [
      'test-reports/junit.xml',
      'test/__snapshots__/*',
      '.env',
      '.vscode',
      '.DS_Store',
    ];
    const ignore = snapshot['.gitignore'];
    defaults.forEach(d => expect(ignore).toContain(d));
  });

});


describe('NijmegenProject NPM', () => {

  test('cdk-lib project publish to NPM', () => {
    const project = new GemeenteNijmegenCdkLib({
      cdkVersion: '2.1.0',
      defaultReleaseBranch: 'main',
      name: 'test project',
      author: 'test',
      authorAddress: 'test@example.com',
      repositoryUrl: 'github.com',
    });
    const snapshot = synthSnapshot(project);
    expect(snapshot['.github/workflows/release.yml']).toContain('Publish to npm');
    expect(snapshot['.github/workflows/repository-validation.yml']).toContain('CHECK_PUBLISH_TO_NPM: "true"');
  });

  test('ts-lib project publish to NPM', () => {
    const project = new GemeenteNijmegenTsPackage({
      defaultReleaseBranch: 'main',
      name: 'test project',
    });
    const snapshot = synthSnapshot(project);
    expect(snapshot['.github/workflows/release.yml']).toContain('Publish to npm');
    expect(snapshot['.github/workflows/repository-validation.yml']).toContain('CHECK_PUBLISH_TO_NPM: "true"');
  });

  test('jsii project publish to NPM', () => {
    const project = new GemeenteNijmegenJsii({
      defaultReleaseBranch: 'main',
      name: 'test project',
      author: 'test',
      authorAddress: 'test@example.com',
      repositoryUrl: 'github.com',
    });
    const snapshot = synthSnapshot(project);
    expect(snapshot['.github/workflows/release.yml']).toContain('Publish to npm');
    expect(snapshot['.github/workflows/repository-validation.yml']).toContain('CHECK_PUBLISH_TO_NPM: "true"');
  });

});

describe('NijmegenProject Workflows', () => {
  test('Contains automerge workflow by default', () => {
    const project = new GemeenteNijmegenCdkApp({ cdkVersion: '2.51.0', defaultReleaseBranch: 'main', name: 'test project' });

    const snapshot = synthSnapshot(project)['.github/workflows/auto-merge.yml'];
    expect(snapshot).toContain(
      'if: contains(github.event.pull_request.labels.*.name, \'auto-merge\') && github.base_ref == \'acceptance\'',
    );
  });

  test('Doesn\'t contain automerge workflow when option is set', () => {
    const project = new GemeenteNijmegenCdkApp({ cdkVersion: '2.51.0', defaultReleaseBranch: 'main', name: 'test project', enableAutoMergeDependencies: false });

    const snapshot = synthSnapshot(project);
    expect(snapshot).not.toHaveProperty('.github/workflows/auto-merge.yml');
  });

  test('Contains validation workflow by default', () => {
    const project = new GemeenteNijmegenCdkApp({ cdkVersion: '2.51.0', defaultReleaseBranch: 'main', name: 'test project' });

    const snapshot = synthSnapshot(project);
    expect(snapshot['.github/workflows/repository-validation.yml']).not.toBeUndefined();
  });

  test('Does not contain validation workflow when configured', () => {
    const project = new GemeenteNijmegenCdkApp({ cdkVersion: '2.51.0', defaultReleaseBranch: 'main', name: 'test project', enableRepositoryValidation: false });

    const snapshot = synthSnapshot(project);
    expect(snapshot['.github/workflows/repository-validation.yml']).toBeUndefined();
  });

  test('Repository validation workflow options', () => {
    const project = new GemeenteNijmegenCdkApp({
      cdkVersion: '2.51.0',
      defaultReleaseBranch: 'main',
      name: 'test project',
      enableRepositoryValidation: false,
      repositoryValidationOptions: {
        publishToNpm: true,
        checkAcceptanceBranch: true,
        emergencyWorkflow: true,
        upgradeBranch: 'main',
      },
    });

    const snapshot = synthSnapshot(project);
    expect(snapshot['.github/workflows/repository-validation.yml']).toBeUndefined();
  });


});