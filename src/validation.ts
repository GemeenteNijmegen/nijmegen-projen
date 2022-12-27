import { Project } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { Job, JobPermission } from 'projen/lib/github/workflows-model';
import { RepositoryValidationOptions } from './project';

export function addRepositoryValidationJob(project: Project, props: RepositoryValidationOptions) {
  const validationJob: Job = {
    runsOn: ['ubuntu-latest'],
    permissions: {
      actions: JobPermission.READ,
      checks: JobPermission.READ,
      contents: JobPermission.READ,
      deployments: JobPermission.READ,
      discussions: JobPermission.READ,
      issues: JobPermission.READ,
      packages: JobPermission.READ,
      pullRequests: JobPermission.READ,
      repositoryProjects: JobPermission.READ,
      securityEvents: JobPermission.READ,
      statuses: JobPermission.READ,
      pages: JobPermission.READ,
    },
    steps: [
      {
        name: 'Run validation checks',
        run: 'node ./node_modules/@gemeentenijmegen/modules-projen/lib',
        env: {
          CHECK_PUBLISH_TO_NPM: props.publishToNpm ? props.publishToNpm.toString() : 'true',
          CHECK_ACCEPTANCE_BRANCH: props.checkAcceptanceBranch ? props.checkAcceptanceBranch.toString() : 'true',
          CHECK_EMERGENCY_WORKFLOW: props.emergencyWorkflow ? props.emergencyWorkflow.toString() : 'true',
          CHECK_UPGRADE_WORKFLOW_BRANCH: props.upgradeBranch ?? '',
        },
      },
    ],
  };

  const github = GitHub.of(project);
  if (!github) {
    throw new Error(
      'Validation workflow is currently only supported for GitHub projects',
    );
  }

  const workflow = new GithubWorkflow(github, 'repository-validation');
  workflow.on({
    workflowDispatch: {},
    schedule: [{
      cron: '59 23 * * *',
    }],
  });

  workflow.addJobs({ automerge: validationJob });
}