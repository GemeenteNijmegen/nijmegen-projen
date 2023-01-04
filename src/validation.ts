import * as fs from 'fs';
import * as path from 'path';
import { Component } from 'projen';
import { GitHub } from 'projen/lib/github';
import { NodeProject } from 'projen/lib/javascript';
import { CombinedProjectOptions } from './shared';

const SECRET_NPM_TOKEN = 'NPM_TOKEN';
const SECRET_PROJEN_GITHUB_TOKEN = 'PROJEN_GITHUB_TOKEN';
const SECRET_SLACK_WEBHOOK = 'SLACK_WEBHOOK_URL';

export function addRepositoryValidationJob(project: NodeProject, options: CombinedProjectOptions) {

  // Check if github is enabled
  const github = GitHub.of(project);
  if (!github) {
    throw new Error('Validation workflow is currently only supported for GitHub projects');
  }

  /**
   * Add the validation step to all workflows, it should be fast
   * enough not to bother during the github builds.
   */
  project.buildWorkflow?.addPostBuildSteps({
    name: 'Check repository configuration',
    run: 'node ./.github/workflows/validate-repository.js',
  });

  new ValidateRepositoryScript(project, options);

}


class ValidateRepositoryScript extends Component {

  private readonly options: CombinedProjectOptions;

  constructor(project: NodeProject, options: CombinedProjectOptions) {
    super(project);
    this.options = options;
  }

  public synthesize(): void {
    const outdir = this.project.outdir;
    const filePath = path.join(outdir, '.github/workflows/validate-repository.js');
    fs.writeFileSync(filePath, this.constructScript());
  }

  private constructScript() {
    const lines : Array<string> = [];

    // Script setup
    lines.push('const fs = require(\'fs\');');
    lines.push('let problems = 0;');
    lines.push('function check(fn, message){');
    lines.push('  const r = fn();');
    lines.push('  problems += r ? 0 : 1;');
    lines.push('  console.log(`${r ? \'✅\' : \'❗️\'}  ${message}`);');
    lines.push('}');

    // Default checks
    lines.push(`check(() => process.env.${SECRET_PROJEN_GITHUB_TOKEN}, 'PROJEN_GITHUB_TOKEN');`);
    lines.push('check(() => fs.existsSync(\'./.github/workflows/release.yml\'), \'Release workflow\');');

    // Emergency workflow
    if (this.options.enableEmergencyProcedure) {
      lines.push(`check(() => process.env.${SECRET_SLACK_WEBHOOK}, 'Emergency workflow endpoint');`);
      lines.push('check(() => fs.existsSync(\'./.github/workflows/emergency.yml\'), \'Emergency workflow\');');
    } else {
      this.warn('Emergency workflow is not enabled, is this intentional?');
    }

    // Release to NPM
    if (this.options.releaseToNpm) {
      lines.push(`check(() => process.env.${SECRET_NPM_TOKEN}, 'NPM publish token');`);
    }

    // Auto-merge dependencies
    if (this.options.enableAutoMergeDependencies) {
      lines.push('check(() => fs.existsSync(\'./.github/workflows/auto-merge.yml\'), \'Auto-merge workflow\');');
    } else {
      this.warn('Auto-merging of dependencies is not enabled, is this intentional?');
    }

    // Upgrade workflow(s)
    const branchNames = this.options.depsUpgradeOptions?.workflowOptions?.branches;
    if (this.options.depsUpgrade && branchNames) {
      branchNames.forEach(b => {
        lines.push(`check(() => fs.existsSync('./.github/workflows/upgrade-${b}.yml'), 'Upgrade workflow');`);
      });
    } else {
      this.warn('No dependency upgrade branche configured, is this intentional?');
    }

    // Script exit
    lines.push('process.exit(problems);');

    return lines.join('\n');
  }

  private warn(msg: string) {
    console.warn(`❗️ ${msg}`);
  }

}