import { awscdk } from 'projen';
import { JobPermission } from 'projen/lib/github/workflows-model';


export interface GemeenteNijmegenCdkAppCommonOptions {
  /**
     * Enable cfn-lint in the github build workflow
     */
  enableCfnLintOnGithub?: boolean;

  /**
     * Enable CloudFormation template diff comments on PRs
     */
  enableCfnDiffWorkflow?: boolean;
}

export interface GemeenteNijmegenCdkAppOptions extends
  awscdk.AwsCdkTypeScriptAppOptions,
  GemeenteNijmegenCdkAppCommonOptions {

}

function _combine<T>(a: T[] | undefined, ...b: T[]) {
  var old = a;
  if (!old) {
    old = [];
  }
  return old.concat(b);
}

export class GemeenteNijmegenCdkApp extends awscdk.AwsCdkTypeScriptApp {

  constructor(options: GemeenteNijmegenCdkAppOptions) {

    // Add lint script to projen scripts
    options = {
      ...options,
      scripts: {
        lint: 'cfn-lint cdk.out/**/*.template.json -i W3005 W2001',
        ...options.scripts,
      },
    };

    /**
     * Setup cfn lint for usage in github workflows
     */
    if (options.enableCfnLintOnGithub) {
      console.info('Setting up Github workflow to include CloudFormation lint...');
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
        workflowBootstrapSteps: _combine(options.workflowBootstrapSteps, setupCfnLint),
        postBuildSteps: _combine(options.postBuildSteps, cfnLint),
      };
    }

    /**
     * Setup for the cloud formation diff workflow step
     */
    if (options.enableCfnDiffWorkflow) {
      const storeArtifacts = {
        name: 'Save CloudFormation templates',
        run: 'mkdir -p dist && cp cdk.out/* dist/',
      };
      options = {
        ...options,
        postBuildSteps: _combine(options.postBuildSteps, storeArtifacts),
      };
    }

    /**
     * Construct the actual projen project
     */
    super(options);


    /**
     * Further modifications to the project after construction
     */
    if (options.enableCfnDiffWorkflow) {
      this.enableCfnDiffWorkflow();
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