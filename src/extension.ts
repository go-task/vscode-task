import * as vscode from 'vscode';
import { TaskExtension } from './task';

export function activate(context: vscode.ExtensionContext) {

	// Create a new instance of Tagger
	let taskExtension: TaskExtension = new TaskExtension();

	// Registration
	taskExtension.registerCommands(context);

	// Refresh the tasks list
	taskExtension.update().catch((err: string) => {
		console.error(err);
	});
}

export function deactivate() { }
