import { Component, Project } from 'projen';
import { GitHub, GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';

const JOBID = 'emergency-merge';
const RUNS_ON = 'ubuntu-latest';

const PULL_REQUEST_REF = '${{ github.event.pull_request.head.ref }}';
const PULL_REQUEST_REPOSITORY = '${{ github.event.pull_request.head.repo.full_name }}';

const SLACK_INFORM_PAYLOAD = `{
    "text": "EMERGENCY wijziging naar PRODUCTION door: \${{ github.actor }}\n\${{ github.event.pull_request.html_url || github.event.head_commit.url }}",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "EMERGENCY wijziging naar PRODUCTION door: \${{ github.actor }}\n\${{ github.event.pull_request.html_url || github.event.head_commit.url }}"
        }
      }
    ]
  }`;


export class EmergencyProcedure extends Component {
  private readonly workflow: GithubWorkflow;

  constructor(project: Project) {
    super(project);

    const github = GitHub.of(project);
    if (!github) {
      throw new Error(
        'BuildWorkflow is currently only supported for GitHub projects',
      );
    }

    this.workflow = new GithubWorkflow(github, 'emergency');

    /**
     * Martijn's solution used pullRequest and specifically on the production branche
     * However projen does not allow this as an configuration option. Therefore we'll
     * let the workflow trigger on labeling of the PR requirering an emergency merge.
     */
    this.workflow.on({
      pullRequest: {
        types: ['labeled'],
      },
      workflowDispatch: {},
    });

    this.setupEmergencyJob();

  }

  private setupEmergencyJob() {
    this.workflow.addJob(JOBID, {
      runsOn: [RUNS_ON],
      if: "contains(github.event.pull_request.labels.*.name, 'emergency')",
      permissions: {
        contents: JobPermission.READ,
      },
      steps: [
        {
          name: 'Checkout',
          uses: 'actions/checkout@v3',
          with: {
            ref: PULL_REQUEST_REF,
            repository: PULL_REQUEST_REPOSITORY,
          },
        },
        {
          name: 'Send custom JSON data to Slack workflow',
          id: 'slack',
          uses: 'slackapi/slack-github-action@v1.18.0',
          with: {
            payload: SLACK_INFORM_PAYLOAD,
          },
          env: {
            SLACK_WEBHOOK_URL: '${{ secrets.SLACK_WEBHOOK_URL }}',
            SLACK_WEBHOOK_TYPE: 'INCOMING_WEBHOOK',
          },
        },
        {
          name: 'Merge pull requests (automerge-action)',
          uses: 'pascalgn/automerge-action@v0.15.3',
          env: {
            GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
            MERGE_LABELS: 'emergency',
          },
        },
      ],
    });
  }

}