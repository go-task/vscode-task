import * as vscode from 'vscode';
import { log } from './utils/log.js';
import { TaskExtension } from './task.js';

export async function activate(context: vscode.ExtensionContext) {
	log.info("Extension activated");

	// Create a new instance of Tagger
	let taskExtension: TaskExtension = new TaskExtension();

	// Registration
	taskExtension.registerTaskProvider(context);
	taskExtension.registerCommands(context);
	taskExtension.registerListeners(context);

	// Refresh the tasks list
	await taskExtension.refresh();
}

export function deactivate() { }
