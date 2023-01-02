import { AwsCdkTypeScriptApp, AwsCdkTypeScriptAppOptions } from 'projen/lib/awscdk';
import combine from './combine';
import { GemeenteNijmegenOptions, setDefaultValues, setupSharedConfiguration } from './shared';

export interface GemeenteNijmegenCdkAppOptions extends AwsCdkTypeScriptAppOptions, GemeenteNijmegenOptions {
  /**
   * Enable cfn-lint in the github build workflow
   * @default true
   */
  readonly enableCfnLintOnGithub?: boolean;
}

/**
 * GemeenteNijmegenCdkApp projen project type for Gemeente Nijmegen CDK apps
 *
 * @pjid cdk-app
 */
export class GemeenteNijmegenCdkApp extends AwsCdkTypeScriptApp {

  constructor(options: GemeenteNijmegenCdkAppOptions) {

    const enableCfnLintOnGithub = options.enableCfnLintOnGithub ?? true;

    setDefaultValues(options, options); // Well this looks wierd...

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
     * Set additinal gitignore for cdk app
     */
    options = {
      ...options,
      gitignore: combine(options.gitignore,
        'test/playwright/report',
        'test/playwright/screenshots',
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
     * Construct the actual projen project
     */
    super(options);

    /**
     * Setup all shared configuration for this project e.g.
     * validate-repository workflow, auto-merge dependencies,
     * emergency workflow.
     */
    setupSharedConfiguration(this, options);

  }

}