import { awscdk } from 'projen';
import { JobPermission } from 'projen/lib/github/workflows-model';
import combine from './combine';
import { EmergencyProcedure } from './emergeny';
import { addMergeJob } from './mergejob';
import { addRepositoryValidationJob, RepositoryValidationJobProps } from './validation';

const cfnDiffLabel: string = 'cfn-diff';
const acceptanceBranchName = 'acceptance';

export interface GemeenteNijmegenCdkAppOptions extends
  awscdk.AwsCdkTypeScriptAppOptions {
  /**
   * Enable cfn-lint in the github build workflow
   * @default true
   */
  readonly enableCfnLintOnGithub?: boolean;

  /**
   * Enable CloudFormation template diff comments on PRs
   * @default false
   */
  readonly enableCfnDiffWorkflow?: boolean;

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
  readonly repositoryValidationOptions?: RepositoryValidationJobProps;
}

/**
 * GemeenteNijmegenCdkApp projen project type for Gemeente Nijmegen CDK apps
 */
export class GemeenteNijmegenCdkApp extends awscdk.AwsCdkTypeScriptApp {

  constructor(options: GemeenteNijmegenCdkAppOptions) {

    const enableCfnLintOnGithub = options.enableCfnLintOnGithub ?? true;
    const enableCfnDiffWorkflow = options.enableCfnDiffWorkflow ?? false;
    const enableEmergencyProcedure = options.enableEmergencyProcedure ?? true;
    const enableAutoMergeDependencies = options.enableAutoMergeDependencies ?? true;
    const enableRepositoryValidation = options.enableRepositoryValidation ?? true;

    /**
     * Add lint script to projen scripts only if
     * there are no scripts or the lint script is not set
     */
    options = {
      ...options,
      scripts: {
        lint: 'cfn-lint cdk.out/**/*.template.json -i W3005 W2001',
        ...options.scripts,
      },
    };

    /**
     * Set default license
     */
    options = {
      license: 'EUPL-1.2',
      ...options,
    };

    /**
     * Set default release settings
     */
    const upgradeLabels = ['cfn-diff'];
    if (enableAutoMergeDependencies) {
      upgradeLabels.push('auto-merge');
    }
    options = {
      release: true,
      // defaultReleaseBranch: 'production', // Cannot set this one as it is required in awscdk project type
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

    /**
     * Setup cfn lint for usage in github workflows
     */
    if (enableCfnLintOnGithub) {
      const setupCfnLint = {
        name: 'Setup cfn-lint',
        uses: 'scottbrenner/cfn-lint-action@v2',
      };
      const cfnLint = {
        name: 'CloudFormation lint',
        run: 'npx projen lint',
      };
      options = {
        ...options,
        workflowBootstrapSteps: combine(options.workflowBootstrapSteps, setupCfnLint),
        postBuildSteps: combine(options.postBuildSteps, cfnLint),
      };
    }


    /**
     * Setup for the cloud formation diff workflow step
     */
    if (enableCfnDiffWorkflow) {

      // Add cfn-diff label to upgrade deps PRs
      options = {
        ...options,
        depsUpgradeOptions: {
          ...options.depsUpgradeOptions,
          workflowOptions: {
            ...options.depsUpgradeOptions?.workflowOptions,
            labels: combine(options.depsUpgradeOptions?.workflowOptions?.labels, cfnDiffLabel),
          },
        },
      };

      const storeArtifacts = {
        name: 'Save CloudFormation templates',
        run: 'mkdir -p dist && tar -czvf ./dist/cdk.out.tar.gz ./cdk.out',
      };
      options = {
        ...options,
        postBuildSteps: combine(options.postBuildSteps, storeArtifacts),
      };
    }

    /**
     * Construct the actual projen project
     */
    super(options);

    /**
     * Further modifications to the project after construction
     */
    if (enableCfnDiffWorkflow) {
      this.enableCfnDiffWorkflow();
    }

    /**
     * Enable the emergency procedure when needed
     */
    if (enableEmergencyProcedure) {
      new EmergencyProcedure(this);
    }

    /**
     * Enable auto-merging dependency updates
     */
    if (enableAutoMergeDependencies) {
      addMergeJob(this, acceptanceBranchName);
    }

    /**
     * Enable auto-merging dependency updates
     */
    if (enableRepositoryValidation) {
      const repositoryValidationOptions = {
        publishToNpm: false,
        checkAcceptanceBranch: true,
        emergencyWorkflow: true,
        upgradeBranch: acceptanceBranchName,
        ...options.repositoryValidationOptions
      }
      addRepositoryValidationJob(this, repositoryValidationOptions);
    }

  }

  /**
   * A job to build the base branch and execute a diff on the build cdk.out and base
   * branch cdk.out. A comment is added to the PR indicating if there are differences
   * in the CloudFormation templates.
   */
  enableCfnDiffWorkflow() {
    const comment = 'between CloudFormation templates on base branch and this branch.';

    if (!this.buildWorkflow) {
      throw 'Buildworkflow is undefined could not setup cfn-diff workflow';
    }

    this.buildWorkflow.addPostBuildJob('cfn-diff', {
      permissions: {
        contents: JobPermission.READ,
        pullRequests: JobPermission.WRITE,
      },
      if: "${{ contains( github.event.pull_request.labels.*.name, '" + cfnDiffLabel + "' ) }}",
      runsOn: ['ubuntu-latest'],
      steps: [
        {
          name: 'Keep build CloudFormation templates',
          run: [
            'tar -xzvf ./dist/cdk.out.tar.gz -C ../',
            'mv ../cdk.out ../cdk.out.source',
          ].join(' && '),
        },
        {
          name: 'Checkout',
          uses: 'actions/checkout@v2',
          with: {
            ref: '${{ github.base_ref }}',
            repository: '${{ github.event.pull_request.head.repo.full_name }}',
          },
        },
        {
          name: 'Setup cfn-lint',
          uses: 'scottbrenner/cfn-lint-action@v2',
        },
        {
          name: 'Install dependencies',
          run: 'yarn install --check-files',
        },
        {
          name: 'Build',
          run: 'yarn build',
        },
        {
          name: 'Prepare CloudFormation template directories',
          run: 'mv ../cdk.out.source cdk.out.source && mv cdk.out cdk.out.base',
        },
        {
          name: 'CloudFormation diff',
          run: [
            'git diff --no-index --output diff.txt cdk.out.source cdk.out.base || true',
            'cat diff.txt',
            '[ -s diff.txt ] && msg="Differences" || msg="No differences"',
            'echo "Creating a comment on the PR..."',
            `gh pr comment $PR --body "$(echo $msg) ${comment} \n <details><pre>$(cat diff.txt)</pre></details>" -R $GITHUB_REPOSITORY`,
          ].join('; '),
          env: {
            GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
            GITHUB_REPOSITORY: '${{ github.repository }}',
            PR: '${{ github.event.pull_request.number }}',
          },
        },
      ],
    });
  }


}