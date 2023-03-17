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
        return this._instance ?? (this._instance = new this());
    }

    public async read(dir: string): Promise<models.Taskfile> {
        return await new Promise((resolve) => {
            let command = 'task --list-all --json';
            cp.exec(command, { cwd: dir }, (_, stdout: string) => {
                var taskfile: models.Taskfile = JSON.parse(stdout);
                taskfile.workspace = dir;
                resolve(taskfile);
            });
        });
    }

    public async runTask(taskName: string, dir?: string): Promise<void> {
        return await new Promise((resolve) => {
            let command = `task ${taskName}`;
            cp.exec(command, { cwd: dir }, (_, stdout: string, stderr: string) => {
                TaskfileService.outputChannel.append(stderr);
                TaskfileService.outputChannel.append(stdout);
                TaskfileService.outputChannel.append("-----\n");
                TaskfileService.outputChannel.show();
                resolve();
            });
        });
    }

    public goToDefinition(task: models.Task, preview: boolean = false): void {
        if (task.location === undefined) {
            vscode.window.showErrorMessage(`Go to definition requires Task v3.23.0 or higher.`);
            return;
        }

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
            vscode.commands.executeCommand('vscode.open', file, options);
        } catch (err) {
            console.error(err);
        }
    }
}

export const taskfile = TaskfileService.Instance;
