const { execSync } = require("child_process");

const PROJEN_PR_TITLE_WORKFLOW_TITLE = 'Validate PR title';
const EMERGENCY_WORKFLOW_NAME = 'emergency';
const PROJEN_UPGRADE_WORKFLOW_PREFIX = 'upgrade-';
const PROJEN_RELEASE_WORKFLOW = 'release';
const PROJEN_BUILD_WORKFLOW = 'build';
const PROJEN_PR_TITLE_WORKFLOW_NAME = 'pull-request-lint';

const SECRET_NPM_TOKEN = 'NPM_TOKEN';
const SECRET_PROJEN_GITHUB_TOKEN = 'PROJEN_GITHUB_TOKEN';
const SECRET_SLACK_WEBHOOK = 'SLACK_WEBHOOK_URL';

class ValidateRepository {

  constructor() {
    this.problems = [];
  }

  foundProblem(message) {
    this.problems.push(message);
  }

  logProblems() {
    if (this.problems.length > 0) {
      console.info("Repository contains configuration problems:");
      this.problems.forEach(p => console.info(` - ${p}`));
    } else {
      console.info("Repository does not contain any configuration problems");
    }
    return this.problems.length;
  }

  execCommand(command, asJson) {
    const buff = execSync(command);
    const str = buff.toString();
    return asJson ? JSON.parse(str) : str;
  }

  getRepositoryInformation() {
    const repo = this.execCommand(`gh api /repos/{owner}/{repo}`, true);
    return {
      defaultBranch: repo.default_branch,
    };
  }

  getBranches() {
    const branches = this.execCommand(`gh api /repos/{owner}/{repo}/branches`, true);
    return branches;
  }

  getWorkflows() {
    const workflows = this.execCommand(`gh api /repos/{owner}/{repo}/actions/workflows --jq '.workflows.[].name'`, false);
    return workflows;
  }

  getWorkflowSecrets() {
    const workflowSecrets = this.execCommand(`gh api /repos/{owner}/{repo}/actions/secrets --jq '.secrets.[].name'`, false);
    return workflowSecrets;
  }

  checkBranch(branches, branchName, requiredStatusChecks) {

    const branch = branches.find(b => b.name == branchName);

    if (!branch) {
      this.foundProblem(`Repository does not contain a branch named ${branchName}`);
      return;
    }

    if (!branch.protected) {
      this.foundProblem(`Branch ${branchName} is not protected`);
      return;
    }

    const requiredCheckNames = branch.protection?.required_status_checks?.contexts ?? [];

    if (!requiredCheckNames && requiredStatusChecks.length > 0) {
      this.foundProblem(`Branch protection of ${branchName} is enabled but no status checks are defined`);
      return;
    }

    if (requiredStatusChecks) {
      requiredStatusChecks.forEach(checkName => {
        if (!requiredCheckNames?.includes(checkName)) {
          this.foundProblem(`Branch protection of ${branchName} does not require ${checkName} to pass`);
        }
      });
    }

  }

  checkList(items, itemsToBePresent, itemName) {
    itemsToBePresent.forEach(item => {
      if (!items.includes(item)) {
        this.foundProblem(`Repository does not have ${itemName} ${item}`);
      }
    });
  }

  /**
   * Run the checks on this repository
   * @param {boolean} checkPublishToNpm 
   * @param {boolean} checkAcceptanceBranch 
   * @param {boolean} checkEmergencyWorkflow
   * @param {string | undefined} upgradeWorkflowBranch
   */
  check(checkPublishToNpm, checkAcceptanceBranch, checkEmergencyWorkflow, upgradeWorkflowBranch) {

    /**
     * Obtain repo information
     */
    const info = this.getRepositoryInformation();
    const branches = this.getBranches();
    const workflows = this.getWorkflows();
    const secrets = this.getWorkflowSecrets();

    /**
     * Determine the configuration to validate
     */
    const branchesToBePresent = [info.defaultBranch];
    if (checkAcceptanceBranch) {
      branchesToBePresent.push('acceptance');
    }

    const workflowsToBePresent = [
      PROJEN_RELEASE_WORKFLOW,
      PROJEN_BUILD_WORKFLOW,
      PROJEN_PR_TITLE_WORKFLOW_NAME,
    ];
    if(checkEmergencyWorkflow){
      workflowsToBePresent.push(EMERGENCY_WORKFLOW_NAME);
    }
    if(upgradeWorkflowBranch && upgradeWorkflowBranch != ''){
      workflowsToBePresent.push(`${PROJEN_UPGRADE_WORKFLOW_PREFIX}${upgradeWorkflowBranch}`);
    }

    const secretsToBePresent = [SECRET_PROJEN_GITHUB_TOKEN];
    if(checkEmergencyWorkflow){
      secretsToBePresent.push(SECRET_SLACK_WEBHOOK);
    }
    if (checkPublishToNpm) {
      secretsToBePresent.push(SECRET_NPM_TOKEN);
    }
    
    /**
     * Perform validation
     */
    branchesToBePresent.forEach(b => this.checkBranch(branches, b, [PROJEN_BUILD_WORKFLOW, PROJEN_PR_TITLE_WORKFLOW_TITLE]))
    this.checkList(workflows, workflowsToBePresent, 'workflow');
    this.checkList(secrets, secretsToBePresent, 'secret');

    return this.logProblems();
  }

}

const checkPublishToNpm = process.env.CHECK_PUBLISH_TO_NPM == 'true' ? true : false;
const checkAcceptanceBranch = process.env.CHECK_ACCEPTANCE_BRANCH == 'true' ? true : false;
const checkEmergencyWorkflow = process.env.CHECK_EMERGENCY_WORKFLOW == 'true' ? true : false;
const upgradeWorkflowBranch = process.env.CHECK_UPGRADE_WORKFLOW_BRANCH;

const nrOfProblems = new ValidateRepository().check(
  checkPublishToNpm,
  checkAcceptanceBranch,
  checkEmergencyWorkflow,
  upgradeWorkflowBranch,
)
process.exit(nrOfProblems);