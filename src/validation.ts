import { GitHub } from 'projen/lib/github';
import { NodeProject } from 'projen/lib/javascript';
import { CombinedProjectOptions } from './shared';

export function addRepositoryValidationJob(options: CombinedProjectOptions) {

  // Emergency workflow
  if (!options.enableEmergencyProcedure) {
    warn('Emergency workflow is not enabled, is this intentional?');
  }

  // Auto-merge dependencies
  if (!options.enableAutoMergeDependencies) {
    warn('Auto-merging of dependencies is not enabled, is this intentional?');
  }

  // Upgrade workflow(s)
  const branchNames = options.depsUpgradeOptions?.workflowOptions?.branches;
  if (!options.depsUpgrade || !branchNames) {
    warn('No dependency upgrade branche configured, is this intentional?');
  }

}

function warn(msg: string) {
  console.warn(`❗️ ${msg}`);
}
