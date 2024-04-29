import { Project } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { Job, JobPermission } from 'projen/lib/github/workflows-model';

export function addMergeJob(project: Project, upgradeBranches: string[]) {
  const condition = upgradeBranches.map(branch => `github.base_ref == '${branch}'`).join(' || ');
  const mergeJob: Job = {
    runsOn: ['ubuntu-latest'],
    permissions: {
      pullRequests: JobPermission.WRITE,
      contents: JobPermission.WRITE,
    },
    if: `contains(github.event.pull_request.labels.*.name, 'auto-merge') && (${condition})`,
    steps: [
      {
        run: 'gh pr merge --auto --merge "$PR_URL"',
        env: {
          PR_URL: '${{github.event.pull_request.html_url}}',
          GITHUB_TOKEN: '${{secrets.GITHUB_TOKEN}}',
        },
      },
    ],
  };

  const github = GitHub.of(project);
  if (!github) {
    throw new Error(
      'Auto merge is currently only supported for GitHub projects',
    );
  }

  const workflow = new GithubWorkflow(github, 'auto-merge');
  workflow.on({
    pullRequestTarget: {
      types: [
        'labeled',
        'opened',
        'synchronize',
        'reopened',
        'ready_for_review',
      ],
    },
  });

  workflow.addJobs({ automerge: mergeJob });
}