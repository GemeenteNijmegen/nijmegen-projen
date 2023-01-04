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

  test('cdk-app project does not publish to NPM', () => {
    const project = new GemeenteNijmegenCdkApp({
      cdkVersion: '2.1.0',
      defaultReleaseBranch: 'main',
      name: 'test project',
    });
    const snapshot = synthSnapshot(project);
    expect(snapshot['.github/workflows/release.yml']).not.toContain('Publish to npm');
  });

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
  });

  test('ts-lib project publish to NPM', () => {
    const project = new GemeenteNijmegenTsPackage({
      defaultReleaseBranch: 'main',
      name: 'test project',
    });
    const snapshot = synthSnapshot(project);
    expect(snapshot['.github/workflows/release.yml']).toContain('Publish to npm');
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
  });

});

describe('NijmegenProject auto-merge workflow', () => {
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

});

describe('NijmegenProject repo conf validation workflow', () => {


  // Log all warn messages
  let logs: string[] = [];
  beforeEach(() => {
    logs = [];
    console.warn = (...data: any[]) => {
      if (data && data.length > 0 && data[0]) {
        logs.push(data[0].toString());
      }
      console.log(data);
    };
  });

  test('Contains no validation logging on defaults', () => {
    const project = new GemeenteNijmegenCdkApp({
      cdkVersion: '2.51.0',
      defaultReleaseBranch: 'main',
      name: 'test project',
    });

    synthSnapshot(project);
    expect(logs).not.toContain('❗️ Emergency workflow is not enabled, is this intentional?');
    expect(logs).not.toContain('❗️ Auto-merging of dependencies is not enabled, is this intentional?');
    expect(logs).not.toContain('❗️ Emergency workflow is not enabled, is this intentional?');
  });

  test('Contains validation logging on overwritten defaults', () => {
    const project = new GemeenteNijmegenCdkApp({
      cdkVersion: '2.51.0',
      defaultReleaseBranch: 'main',
      name: 'test project',
      enableAutoMergeDependencies: false,
      enableEmergencyProcedure: false,
      depsUpgrade: false,
    });

    synthSnapshot(project);
    expect(logs).toContain('❗️ Emergency workflow is not enabled, is this intentional?');
    expect(logs).toContain('❗️ Auto-merging of dependencies is not enabled, is this intentional?');
    expect(logs).toContain('❗️ Emergency workflow is not enabled, is this intentional?');
  });


  test('Contains no validation logging on defaults', () => {
    const project = new GemeenteNijmegenTsPackage({
      defaultReleaseBranch: 'main',
      name: 'test project',
    });

    synthSnapshot(project);
    expect(logs).not.toContain('❗️ No publishing to NPM is configured, is this intentional?');
    expect(logs).not.toContain('❗️ Emergency workflow is not enabled, is this intentional?');
    expect(logs).not.toContain('❗️ Auto-merging of dependencies is not enabled, is this intentional?');
    expect(logs).not.toContain('❗️ Emergency workflow is not enabled, is this intentional?');
  });

  test('Contains validation logging on overwritten defaults', () => {
    const project = new GemeenteNijmegenTsPackage({
      defaultReleaseBranch: 'main',
      name: 'test project',
      enableAutoMergeDependencies: false,
      enableEmergencyProcedure: false,
      releaseToNpm: false,
      depsUpgrade: false,
    });

    synthSnapshot(project);
    expect(logs).toContain('❗️ No publishing to NPM is configured, is this intentional?');
    expect(logs).toContain('❗️ Emergency workflow is not enabled, is this intentional?');
    expect(logs).toContain('❗️ Auto-merging of dependencies is not enabled, is this intentional?');
    expect(logs).toContain('❗️ Emergency workflow is not enabled, is this intentional?');
  });

  test('Contains no validation logging on disabled validation', () => {
    const project = new GemeenteNijmegenTsPackage({
      defaultReleaseBranch: 'main',
      name: 'test project',
      enableRepositoryValidation: false,
    });

    synthSnapshot(project);
    expect(logs).not.toContain('❗️ No publishing to NPM is configured, is this intentional?');
    expect(logs).not.toContain('❗️ Emergency workflow is not enabled, is this intentional?');
    expect(logs).not.toContain('❗️ Auto-merging of dependencies is not enabled, is this intentional?');
    expect(logs).not.toContain('❗️ Emergency workflow is not enabled, is this intentional?');
  });

});