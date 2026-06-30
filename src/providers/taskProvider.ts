// Taking inspiration from:
// - https://code.visualstudio.com/api/extension-guides/task-provider
// - https://github.com/microsoft/vscode-extension-samples/blob/main/task-provider-sample/src/customTaskProvider.ts

import * as vscode from 'vscode';
import { Taskfile } from '../models/taskfile.js';
import { useDedicatedTerminal, buildTaskCommand } from '../utils/taskPresentation.js';
import { settings } from '../utils/settings.js';

export class TaskProvider implements vscode.TaskProvider<vscode.Task> {
    private _taskfiles: Taskfile[] = [];

    public setTaskfiles(taskfiles: Taskfile[]) {
        this._taskfiles = taskfiles;
    }

	public async provideTasks(): Promise<vscode.Task[]> {
        let tasks: vscode.Task[] = [];
        this._taskfiles.forEach(taskfile => {
            tasks = tasks.concat(taskfile.getTaskDefinitions().map(def => def.toTask()));
        });
        return Promise.resolve(tasks);
    }

	public resolveTask(_task: vscode.Task): vscode.Task | undefined {
        const taskName = _task.definition.task;
        if (taskName) {
            const definition = _task.definition;
            const cliArgs = Array.isArray(definition.args)
                ? definition.args.filter((arg: unknown): arg is string => typeof arg === 'string' && arg !== "")
                : [];
            const workspace = typeof definition.workspace === 'string' ? definition.workspace : undefined;
            const executionOptions = workspace ? {cwd: workspace} : undefined;
            return useDedicatedTerminal(new vscode.Task(
                definition,
                _task.scope ?? vscode.TaskScope.Workspace,
                taskName,
                'taskfile',
                new vscode.ShellExecution(
                    buildTaskCommand(settings.path, taskName, cliArgs),
                    executionOptions
                )
            ), _task.presentationOptions);
        }
        return undefined;
    }
}
