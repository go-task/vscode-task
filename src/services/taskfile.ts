import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as models from '../models';
import * as path from 'path';
import * as fs from 'fs';
import * as semver from 'semver';
import { log, settings } from '../utils';
import { Octokit } from 'octokit';
import { Endpoints } from "@octokit/types";
import stripAnsi = require('strip-ansi');

const octokit = new Octokit();
type ReleaseRequest = Endpoints["GET /repos/{owner}/{repo}/releases/latest"]["parameters"];
type ReleaseResponse = Endpoints["GET /repos/{owner}/{repo}/releases/latest"]["response"];

const minimumRequiredVersion = '3.23.0';
const minimumRequiredVersionForSorting = '3.24.0';
const minimumRequiredVersionForExitCodes = '3.24.0';

// General exit codes
const errCodeOK = 0;
const errCodeUnknown = 1;

// Taskfile related exit codes
const errCodeTaskfileNotFound = 100;
const errCodeTaskfileAlreadyExists = 101;
const errCodeTaskfileInvalid = 102;

// Task related exit codes
const errCodeTaskNotFound = 200;
const errCodeTaskRunError = 201;
const errCodeTaskInternal = 202;
const errCodeTaskNameConflict = 203;
const errCodeTaskCalledTooManyTimes = 204;

class TaskfileService {
    private static _instance: TaskfileService;
    private static outputChannel: vscode.OutputChannel;
    private lastTaskName: string | undefined;
    private lastTaskDir: string | undefined;
    private version: semver.SemVer | undefined;

    private constructor() {
        TaskfileService.outputChannel = vscode.window.createOutputChannel('Task');
    }

    public static get instance() {
        return this._instance ?? (this._instance = new this());
    }

    private command(command?: string): string {
        if (command === undefined) {
            return settings.path;
        }
        return `${settings.path} ${command}`;
    }

    public async checkInstallation(checkForUpdates?: boolean): Promise<string> {
        if (checkForUpdates === undefined) {
            checkForUpdates = settings.checkForUpdates;
        }
        return await new Promise((resolve) => {
            let command = this.command('--version');
            cp.exec(command, (_, stdout: string, stderr: string) => {

                // If the version is a devel version, ignore all version checks
                if (stdout.includes("devel")) {
                    log.info("Using development version of task");
                    this.version = new semver.SemVer("999.0.0");
                    return resolve("ready");
                }

                // Get the installed version of task (if any)
                this.version = this.parseVersion(stdout);

                // If there is an error fetching the version, assume task is not installed
                if (stderr !== "" || this.version === undefined) {
                    log.error(this.version ? stderr : "Version is undefined");
                    vscode.window.showErrorMessage("Task command not found.", "Install").then(this.buttonCallback);
                    return resolve("notInstalled");
                }

                // If the current version is older than the minimum required version, show an error
                if (this.version && this.version.compare(minimumRequiredVersion) < 0) {
                    log.error(`Task v${minimumRequiredVersion} is required to run this extension. The current version is v${this.version}`);
                    vscode.window.showErrorMessage(`Task v${minimumRequiredVersion} is required to run this extension. The current version is v${this.version}.`, "Update").then(this.buttonCallback);
                    return resolve("outOfDate");
                }

                // If a newer version is available, show a message
                // TODO: what happens if the user is offline?
                if (checkForUpdates) {
                    this.getLatestVersion().then((latestVersion) => {
                        if (this.version && latestVersion && this.version.compare(latestVersion) < 0) {
                            log.info(`A new version of Task is available. Current version: v${this.version}, Latest version: v${latestVersion}`);
                            vscode.window.showInformationMessage(`A new version of Task is available. Current version: v${this.version}, Latest version: v${latestVersion}`, "Update").then(this.buttonCallback);
                        }
                        return resolve("ready");
                    }).catch((err) => {
                        log.error(err);
                        return resolve("notInstalled");
                    });
                }

                return resolve("ready");
            });
        });
    }

    buttonCallback(value: string | undefined) {
        if (value === undefined) {
            return;
        }
        if (["Update", "Install"].includes(value)) {
            vscode.env.openExternal(vscode.Uri.parse("https://taskfile.dev/installation"));
            return;
        }
    }

    async getLatestVersion(): Promise<semver.SemVer | null> {
        log.info(`Calling GitHub to get the latest version`);
        let request: ReleaseRequest = {
            owner: 'go-task',
            repo: 'task'
        };
        let response: ReleaseResponse = await octokit.rest.repos.getLatestRelease(request);
        return Promise.resolve(semver.parse(response.data.tag_name));
    }

    parseVersion(stdout: string): semver.SemVer | undefined {
        // Extract the version string from the output
        let matches = stdout.match(/(\d+\.\d+\.\d+)/);
        if (!matches || matches.length !== 2) {
            return undefined;
        }
        // Parse the version string as a semver
        let version = semver.parse(matches[1]);
        if (!version) {
            return undefined;
        }
        return version;
    }

    public async init(dir: string): Promise<void> {
        log.info(`Initialising taskfile in: "${dir}"`);
        return await new Promise((resolve) => {
            let command = this.command('--init');
            cp.exec(command, { cwd: dir }, (_, stdout: string, stderr: string) => {
                if (stderr) {
                    vscode.window.showErrorMessage(stderr);
                }
                this.open(dir).then(() => {
                    return resolve();
                });
            });
        });
    }

    public async open(dir: string): Promise<void> {
        let filenames = ['Taskfile.yml', 'Taskfile.yaml', 'taskfile.yml', 'taskfile.yaml'];
        for (let i = 0; i < filenames.length; i++) {
            let filename = path.join(dir, filenames[i]);
            if (fs.existsSync(filename)) {
                log.info(`Opening taskfile: "${filename}"`);
                await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filename), { preview: false });
                return;
            }
        }
    }

    public async read(dir: string): Promise<models.Taskfile | undefined> {
        log.info(`Searching for taskfile in: "${dir}"`);
        return await new Promise((resolve, reject) => {
            let additionalFlags = "";
            // Sorting
            if (settings.treeSort !== "default") {
                if (this.version && this.version.compare(minimumRequiredVersionForSorting) < 0) {
                    vscode.window.showWarningMessage(`Task version v${minimumRequiredVersionForSorting} is required to change the sort order. Falling back to "default".`, "Update").then(this.buttonCallback);
                } else {
                    additionalFlags = ` --sort ${settings.treeSort}`;
                }
            }
            let command = this.command(`--list-all --json${additionalFlags}`);
            cp.exec(command, { cwd: dir }, (err: cp.ExecException | null, stdout: string, stderr: string) => {
                if (err) {
                    log.error(err);
                    // TODO: Bump the minimum required version to remove this conditional
                    let shouldDisplayError = false;
                    if (err.code && this.version && this.version.compare(minimumRequiredVersionForExitCodes) >= 0) {
                        let exitCodesToDisplayErrorsFor = [
                            errCodeTaskfileInvalid,
                        ];
                        if (exitCodesToDisplayErrorsFor.includes(err.code)) {
                            shouldDisplayError = true;
                        }
                    } else {
                        if (err.message.toLowerCase().includes("failed to parse")) {
                            shouldDisplayError = true;
                        }
                    }
                    // Display an error message
                    if (shouldDisplayError) {
                        vscode.window.showErrorMessage(stderr);
                        return reject();
                    }
                    return resolve(undefined);
                }
                var taskfile: models.Taskfile = JSON.parse(stdout);
                if (path.dirname(taskfile.location) !== dir) {
                    log.info(`Ignoring taskfile: "${taskfile.location}" (outside of workspace)`);
                    return reject();
                }
                log.info(`Found taskfile: "${taskfile.location}"`);
                taskfile.workspace = dir;
                return resolve(taskfile);
            });
        });
    }

    public async runLastTask(): Promise<void> {
        if (this.lastTaskName === undefined) {
            vscode.window.showErrorMessage(`No task has been run yet.`);
            return;
        }
        await this.runTask(this.lastTaskName, this.lastTaskDir);
    }

    public async runTask(taskName: string, dir?: string): Promise<void> {
        if (settings.outputTo === "terminal") {
            log.info(`Running task: "${taskName}" in: "${dir}"`);
            var terminal: vscode.Terminal;
            if (vscode.window.activeTerminal !== undefined) {
                terminal = vscode.window.activeTerminal;
            } else {
                terminal = vscode.window.createTerminal("Task");
            }
            terminal.show();
            terminal.sendText(this.command(taskName));
        } else {
            return await new Promise((resolve) => {
                log.info(`Running task: "${taskName}" in: "${dir}"`);

                // Spawn a child process
                let child = cp.spawn(this.command(), [taskName], { cwd: dir });

                // Open the output
                TaskfileService.outputChannel.clear();
                TaskfileService.outputChannel.show();

                // Listen for stderr
                child.stderr.setEncoding('utf8');
                child.stderr.on("data", data => {
                    TaskfileService.outputChannel.append(stripAnsi(data.toString()));
                });

                // Listen for stdout
                child.stdout.setEncoding('utf8');
                child.stdout.on("data", data => {
                    TaskfileService.outputChannel.append(stripAnsi(data.toString()));
                });

                // When the task finishes, print the exit code and resolve the promise
                child.on('close', code => {
                    log.info(`Task completed with code ${code}`);
                    TaskfileService.outputChannel.append(`task: completed with code ${code}\n`);
                    this.lastTaskName = taskName;
                    this.lastTaskDir = dir;
                    return resolve();
                });
            });
        }
    }

    public async goToDefinition(task: models.Task, preview: boolean = false): Promise<void> {
        log.info(`Navigating to "${task.name}" definition in: "${task.location.taskfile}"`);

        let position = new vscode.Position(task.location.line - 1, task.location.column - 1);
        let range = new vscode.Range(position, position);

        // Create the vscode URI from the Taskfile path
        let file = vscode.Uri.file(task.location.taskfile);

        // Create the vscode text document show options
        let options: vscode.TextDocumentShowOptions = {
            selection: range,
            preview: preview
        };

        // Run the vscode open command with the range options
        try {
            await vscode.commands.executeCommand('vscode.open', file, options);
        } catch (err) {
            log.error(err);
        }
    }
}

export const taskfile = TaskfileService.instance;
