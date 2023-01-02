import { AwsCdkConstructLibraryOptions } from 'projen/lib/awscdk';
import { JsiiProjectOptions } from 'projen/lib/cdk';
import { NodeProject, NodeProjectOptions, NpmAccess } from 'projen/lib/javascript';
import { TypeScriptProjectOptions } from 'projen/lib/typescript';
import combine from './combine';
import { EmergencyProcedure } from './emergeny';
import { addMergeJob } from './mergejob';
import { addRepositoryValidationJob, RepositoryValidationOptions } from './validation';

const acceptanceBranchName = 'acceptance';

export interface GemeenteNijmegenOptions {

  /**
   * Enable an additional workflow that allows branch protection bypass
   * and will inform the team trough slack.
   * @default true
   */
  readonly enableEmergencyProcedure?: boolean;
  /**
   * Enable an additional workflow that auto-merges PR's with the 'auto-merge'
   * label. NB: Auto-merge must be on in github settings, and branch protection
   * with checks enabled is required to prevent merges of unsuccesful jobs.
   *
   * @default true
   */
  readonly enableAutoMergeDependencies?: boolean;

  /**
   * Enable an additional workflow that checks if the Github repository is
   * configured according to the desired configuration for Gemeente Nijmegen.
   * This includes emergency workflow, correct secrets, branch protection etc.
   */
  readonly enableRepositoryValidation?: boolean;

  /**
   * Properties for configuring the repsitory validation workflow.
   */
  readonly repositoryValidationOptions?: RepositoryValidationOptions;
}

export function setDefaultValues(
  options: NodeProjectOptions,
  gemeenteNijmegenOptions: GemeenteNijmegenOptions,
) {

  /**
   * Set default license
   */
  options = {
    license: 'EUPL-1.2',
    ...options,
  };

  /**
   * Default release options
   */
  const upgradeLabels: string[] = [];
  if (gemeenteNijmegenOptions.enableAutoMergeDependencies) {
    upgradeLabels.push('auto-merge');
  }
  options = {
    release: true,
    // defaultReleaseBranch: 'production', // Cannot set this one here as it is required in awscdk project type
    majorVersion: 0,
    depsUpgradeOptions: {
      workflowOptions: {
        labels: upgradeLabels,
        branches: [acceptanceBranchName],
      },
    },
    ...options,
  };

  /**
   * Set default github options (Adds docs: as acceptable prefix for PR linting)
   */
  options = {
    githubOptions: {
      pullRequestLintOptions: {
        semanticTitleOptions: {
          types: ['fix', 'feat', 'chore', 'docs'],
        },
      },
    },
    ...options,
  };

  /**
   * Set default gitignore
   */
  options = {
    ...options,
    gitignore: combine(options.gitignore,
      'test-reports/junit.xml',
      'test/__snapshots__/*',
      '.env',
      '.vscode',
      '.DS_Store',
    ),
  };
}

type NpmPackageOptions =
  TypeScriptProjectOptions
  | AwsCdkConstructLibraryOptions
  | JsiiProjectOptions;

export function setDefaultValuesNpmPublish(
  options: NpmPackageOptions,
  ourOptions: GemeenteNijmegenOptions,
) {
  // Set defaults for publishing to npm.js
  options = {
    repository: 'https://github.com/GemeenteNijmegen',
    release: true,
    releaseToNpm: true,
    npmAccess: NpmAccess.PUBLIC,
    ...options,
  };

  // Set defaults for validation with npm publish
  ourOptions = {
    repositoryValidationOptions: {
      publishToNpm: true,
      ...ourOptions.repositoryValidationOptions,
    },
    ...ourOptions,
  };
}

export function setupSharedConfiguration(
  project: NodeProject,
  options: GemeenteNijmegenOptions,
) {

  const enableEmergencyProcedure = options.enableEmergencyProcedure ?? true;
  const enableAutoMergeDependencies = options.enableAutoMergeDependencies ?? true;
  const enableRepositoryValidation = options.enableRepositoryValidation ?? true;

  /**
   * Enable the emergency procedure when needed
   */
  if (enableEmergencyProcedure) {
    new EmergencyProcedure(project);
  }

  /**
   * Enable auto-merging dependency updates
   */
  if (enableAutoMergeDependencies) {
    addMergeJob(project, acceptanceBranchName);
  }

  /**
   * Enable repo configuration validation workflow
   */
  if (enableRepositoryValidation) {
    const repositoryValidationOptions = {
      publishToNpm: false,
      checkAcceptanceBranch: true,
      emergencyWorkflow: true,
      upgradeBranch: acceptanceBranchName,
      ...options.repositoryValidationOptions,
    };
    addRepositoryValidationJob(project, repositoryValidationOptions);
  }
}