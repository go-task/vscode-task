import * as vscode from 'vscode';
import * as models from '../models';

export class QuickPickTaskItem implements vscode.QuickPickItem {
    constructor(taskfile: models.Taskfile, task: models.Task) {
        this.taskfile = taskfile;
        this.task = task;
        this.label = task.name;
        this.description = task.desc;
        this.kind = vscode.QuickPickItemKind.Default;
    }
    taskfile: models.Taskfile;
    task: models.Task;
    label: string;
    description: string;
    kind: vscode.QuickPickItemKind;
}

export class QuickPickTaskSeparator implements vscode.QuickPickItem {
    constructor(taskfile: models.Taskfile) {
        this.label = taskfile.location;
        this.kind = vscode.QuickPickItemKind.Separator;
    }
    label: string;
    kind: vscode.QuickPickItemKind;
}
