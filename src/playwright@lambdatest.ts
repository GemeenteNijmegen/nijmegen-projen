import { Component, Project } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { Job, JobPermission } from 'projen/lib/github/workflows-model';

export function addPlaywrightJob(project: Project) {
  const mergeJob: Job = {
    runsOn: ['ubuntu-latest'],
    permissions: {
      pullRequests: JobPermission.WRITE,
      contents: JobPermission.WRITE,
    },
    timeoutMinutes: 60,
    env: {
      CI: 'true',
      LT_ACCESS_KEY: '${{ secrets.LAMBDATEST_USERNAME }}',
      LT_USERNAME: '${{ secrets.LAMBDATEST_ACCESSKEY }}',
      ENVIRONMENT: '${{github.ref}}',
    },
    steps: [
      {
        uses: 'actions/checkout@v4',
      },
      {
        uses: 'actions/setup-node@v4',
        with: {
          'node-version': 'lts/*',
        },
      },
      {
        name: 'Install dependencies',
        run: 'npm ci',
      },
      {
        name: 'Install Playwright Browsers',
        run: 'npx playwright install --with-deps',
      },
      {
        name: 'Run Playwright Tests',
        run: 'npx playwright test',
      },
      {
        uses: 'actions/upload-artifact@v4',
        if: 'always()',
        with: {
          'name': 'playwright-report',
          'path': 'test/playwright/report/',
          'retention-days': 30,
        },
      },
    ],
  };

  const github = GitHub.of(project);
  if (!github) {
    throw new Error(
      'Playwright workflow is currently only supported for GitHub projects',
    );
  }

  const workflow = new GithubWorkflow(github, 'playwright');
  workflow.on({
    workflowDispatch: {},
    schedule: [
      { cron: '02 03 * * *' },
    ],
  });

  workflow.addJobs({ automerge: mergeJob });
}


export class PlaywrightConfiguration extends Component {

  synthesize(): void {
    // TODO create files
  }
}