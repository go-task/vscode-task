import * as cp from 'child_process';
import * as vscode from 'vscode';
import * as models from '../models';
import * as path from 'path';
import * as fs from 'fs';

class TaskfileService {
    private static _instance: TaskfileService;
    private static outputChannel: vscode.OutputChannel;

    private constructor() {
        TaskfileService.outputChannel = vscode.window.createOutputChannel('Task');
    }

    public static get Instance() {
        return this._instance ?? (this._instance = new this());
    }

    public async init(dir: string): Promise<void> {
        return await new Promise((resolve) => {
            let command = 'task --init';
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
                console.log(filename);
                await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(filename), { preview: false });
                return;
            }
        }
    }

    public async read(dir: string): Promise<models.Taskfile> {
        return await new Promise((resolve) => {
            let command = 'task --list-all --json';
            cp.exec(command, { cwd: dir }, (_, stdout: string) => {
                var taskfile: models.Taskfile = JSON.parse(stdout);
                taskfile.workspace = dir;
                return resolve(taskfile);
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
                return resolve();
            });
        });
    }

    public async goToDefinition(task: models.Task, preview: boolean = false): Promise<void> {
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
            await vscode.commands.executeCommand('vscode.open', file, options);
        } catch (err) {
            console.error(err);
        }
    }
}

export const taskfile = TaskfileService.Instance;
