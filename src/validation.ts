import { NodeProject } from 'projen/lib/javascript';
import { GemeenteNijmegenCdkLib } from './project-cdk-lib';
import { GemeenteNijmegenJsii } from './project-jsii-lib';
import { GemeenteNijmegenTsPackage } from './project-ts-lib';
import { CombinedProjectOptions } from './shared';

export function addRepositoryValidationJob(project: NodeProject, options: CombinedProjectOptions) {

  // Default values
  const enableEmergencyProcedure = options.enableEmergencyProcedure ?? true;
  const enableAutoMergeDependencies = options.enableAutoMergeDependencies ?? true;
  const depsUpgrade = options.depsUpgrade ?? true;
  const releaseToNpm = options.releaseToNpm ?? false;

  // Emergency workflow
  if (!enableEmergencyProcedure) {
    warn('Emergency workflow is not enabled, is this intentional?');
  }

  // Auto-merge dependencies
  if (!enableAutoMergeDependencies) {
    warn('Auto-merging of dependencies is not enabled, is this intentional?');
  }

  const isLibProject =
    project instanceof GemeenteNijmegenCdkLib
    || project instanceof GemeenteNijmegenJsii
    || project instanceof GemeenteNijmegenTsPackage;
  if (!releaseToNpm && isLibProject) {
    warn('No publishing to NPM is configured, is this intentional?');
  }

  // Upgrade workflow(s)
  const branchNames = options.depsUpgradeOptions?.workflowOptions?.branches;
  if (!depsUpgrade || !branchNames) {
    warn('No dependency upgrade branche configured, is this intentional?');
  }

}

function warn(msg: string) {
  console.warn(`❗️ ${msg}`);
}
