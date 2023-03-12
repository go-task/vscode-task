import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as models from '../models';

class TaskfileService {
    private static _instance: TaskfileService;
    private static outputChannel: vscode.OutputChannel;

    private constructor() {
        TaskfileService.outputChannel = vscode.window.createOutputChannel('Task');
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public async read(): Promise<models.Taskfile> {
        return await new Promise((resolve, reject) => {
            let command = 'task --list-all --json';
            cp.exec(command, { cwd: getWorkspaceFolder() }, (err: cp.ExecException | null, stdout: string, stderr: string) => {
                if (err) {
                    console.log('error: ' + err);
                    reject();
                    return;
                }
                var taskfile: models.Taskfile = JSON.parse(stdout);
                resolve(taskfile);
            });
        });
    }

    public async runTask(taskName: string): Promise<void> {
        return await new Promise((resolve, reject) => {
            let command = `task ${taskName}`;
            cp.exec(command, { cwd: getWorkspaceFolder() }, (err: cp.ExecException | null, stdout: string, stderr: string) => {
                if (err) {
                    console.log('error: ' + err);
                    reject();
                    return;
                }
                TaskfileService.outputChannel.append(stderr);
                TaskfileService.outputChannel.append(stdout);
                TaskfileService.outputChannel.show();
                resolve();
            });
        });
    }
}

export const taskfile = TaskfileService.Instance;

function getWorkspaceFolder(): string | undefined {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return undefined;
    }
    return vscode.workspace.workspaceFolders[0].uri.path;
}
