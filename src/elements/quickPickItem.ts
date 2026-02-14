import * as vscode from 'vscode';
import { TaskDefinition } from '../models/taskDefinition.js';

export class QuickPickTaskItem implements vscode.QuickPickItem {
    definition: TaskDefinition;
    kind: vscode.QuickPickItemKind;

    constructor(definition: TaskDefinition) {
        this.definition = definition;
        this.kind = vscode.QuickPickItemKind.Default;
    }

    get description(): string {
        return this.definition.description;
    }

    get label(): string {
        return this.definition.name;
    }
}

export class QuickPickTaskSeparator implements vscode.QuickPickItem {
    label: string;
    kind: vscode.QuickPickItemKind;

    constructor(location: string) {
        this.label = location;
        this.kind = vscode.QuickPickItemKind.Separator;
    }
}
