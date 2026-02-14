import { Endpoints } from "@octokit/types";
import * as cp from 'child_process';
import * as fs from 'fs';
import { Octokit } from 'octokit';
import * as path from 'path';
import * as semver from 'semver';
import * as vscode from 'vscode';
import { TreeSort, settings } from '../utils/settings.js';
import { log } from '../utils/log.js';
import { Taskfile } from "../models/taskfile.js";
import { TaskDefinition } from "../models/taskDefinition.js";

const octokit = new Octokit();
type ReleaseRequest = Endpoints["GET /repos/{owner}/{repo}/releases/latest"]["parameters"];
type ReleaseResponse = Endpoints["GET /repos/{owner}/{repo}/releases/latest"]["response"];

const minimumRequiredVersion = '3.45.3';

// Exit codes
const errCodeTaskfileInvalid = 102;

class TaskfileService {
    private static _instance: TaskfileService;
    private lastTaskDefinition: TaskDefinition | undefined;
    private version: semver.SemVer | undefined;
	private previousSelection: string | undefined;
	private previousSelectionTimestamp: number | undefined;

    public static get instance() {
        return this._instance ?? (this._instance = new this());
    }

    private command(command?: string, cliArgs?: string): string {
        if (command === undefined) {
            return settings.path;
        }
        if (cliArgs === undefined) {
            return `${settings.path} ${command}`;
        }
        return `${settings.path} ${command} -- ${cliArgs}`;
    }

    public async checkInstallation(checkForUpdates?: boolean): Promise<string> {
        if (checkForUpdates === undefined) {
            checkForUpdates = settings.checkForUpdates;
        }
        return await new Promise((resolve) => {
            let command = this.command('--version');
            // Determine the root of the working directory of the project
            let workspaceFolders = vscode.workspace.workspaceFolders;
            let cwd = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : undefined;

            cp.exec(command, { cwd }, (_, stdout: string, stderr: string) => {
                // If the version is a devel version, ignore all version checks
                if (stdout.includes("+")) {
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

    public async read(dir: string, nesting: boolean, status: boolean): Promise<Taskfile | undefined> {
        log.info(`Searching for taskfile in: "${dir}"`);
        return await new Promise((resolve, reject) => {
            let flags = [
                "--list-all",
                "--json"
            ];
            // Optional flags
            if (settings.tree.sort !== TreeSort.default) {
                flags.push(`--sort ${settings.tree.sort}`);
            }
            if (nesting) {
                flags.push(`--nested`);
            }
            if (!status) {
                flags.push(`--no-status`);
            }
            let command = this.command(`${flags.join(' ')}`);
            cp.exec(command, { cwd: dir }, (err: cp.ExecException | null, stdout: string, stderr: string) => {
                if (err) {
                    log.error(err);
                    let shouldDisplayError = false;
                    if (err.code) {
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
                const taskfile: Taskfile = new Taskfile(stdout);
                if (taskfile.workspace !== dir) {
                    log.info(`Ignoring taskfile: "${taskfile.location}" (outside of workspace)`);
                    return reject();
                }
                log.info(`Found taskfile: "${taskfile.location}"`);
                return resolve(taskfile);
            });
        });
    }

    public async runLastTask(): Promise<void> {
        if (this.lastTaskDefinition === undefined) {
            vscode.window.showErrorMessage(`No task has been run yet.`);
            return;
        }
        await this.runTask(this.lastTaskDefinition);
    }

    public async runTask(definition: TaskDefinition, cliArgs?: string[]): Promise<void> {
        vscode.tasks.executeTask(definition.toTask(cliArgs)).then((v) => {
            console.log(`Task started: ${v.task.name}`);
        });
    }

    public async goToDefinition(definition: TaskDefinition, preview: boolean = false): Promise<void> {
		const currentTime = Date.now();
		const doubleClicked = this.previousSelection !== undefined && this.previousSelectionTimestamp !== undefined
			&& this.previousSelection === definition.task
			&& (currentTime - this.previousSelectionTimestamp) < settings.doubleClickTimeout;
        if (doubleClicked) {
            this.previousSelection = undefined;
            this.previousSelectionTimestamp = undefined;
            return this.runTask(definition);
        }

        log.info(`Navigating to "${definition.name}" definition in: "${definition.location.taskfile}"`);

        let position = new vscode.Position(definition.location.line - 1, definition.location.column - 1);
        let range = new vscode.Range(position, position);

        // Create the vscode URI from the Taskfile path
        let file = vscode.Uri.file(definition.location.taskfile);

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

        this.previousSelection = definition.name;
        this.previousSelectionTimestamp = currentTime;
    }
}

export const taskfileSvc = TaskfileService.instance;
