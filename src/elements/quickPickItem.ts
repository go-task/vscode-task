import * as vscode from 'vscode';
import { Taskfile, Task } from '../models/taskfile.js';

export class QuickPickTaskItem implements vscode.QuickPickItem {
    constructor(taskfile: Taskfile, task: Task) {
        this.taskfile = taskfile;
        this.task = task;
        this.label = task.name;
        this.description = task.desc;
        this.kind = vscode.QuickPickItemKind.Default;
    }
    taskfile: Taskfile;
    task: Task;
    label: string;
    description: string;
    kind: vscode.QuickPickItemKind;
}

export class QuickPickTaskSeparator implements vscode.QuickPickItem {
    constructor(taskfile: Taskfile) {
        this.label = taskfile.location;
        this.kind = vscode.QuickPickItemKind.Separator;
    }
    label: string;
    kind: vscode.QuickPickItemKind;
}
