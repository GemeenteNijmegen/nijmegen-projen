import { synthSnapshot } from 'projen/lib/util/synth';
import { GemeenteNijmegenCdkApp } from '../src';

beforeAll(() => {
  process.env.DO_NOT_GENERATE_FILES_IN_TEST = 'true';
});

describe('NijmegenProject', () => {
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