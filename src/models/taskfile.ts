import { Namespace } from "./models.js";
import { TaskDefinition } from "./taskDefinition.js";
import * as path from 'path';

export class Taskfile {
    namespace: Namespace;
    private definitions: Map<string, TaskDefinition>;

    constructor(model: Namespace | string) {
        if (typeof model === 'string') {
            this.namespace = JSON.parse(model) as Namespace;
        } else {
            this.namespace = model;
        }
        this.definitions = new Map(
            Taskfile.getTaskDefinitionsFromNamespace(this.namespace, this.workspace).
            map(definition => [definition.task, definition])
        );
    }

    public get location(): string {
        return this.namespace.location;
    }

    public get workspace(): string {
        return path.dirname(this.location);
    }

    // We have an additional workspace parameter to so that we can always pass
    // in the root workspace as the current workspace being passed may not be
    // populated.
    public static getTaskDefinitionsFromNamespace(namespace: Namespace, workspace: string): TaskDefinition[] {
        let definitions: TaskDefinition[] = [];

        // Recursively handle nested namespaces
        if (namespace.namespaces) {
            for (const [_, childNamespace] of Object.entries(namespace.namespaces)) {
                let d = Taskfile.getTaskDefinitionsFromNamespace(childNamespace, workspace);
                definitions = definitions.concat(d);
            }
        }

        // Add the tasks in this namespace
        if (namespace.tasks) {
            for (const task of namespace.tasks) {
                const definition = new TaskDefinition(task, workspace);
                definitions.push(definition);
            }
        }

        return definitions;
    }

    public getTaskNames(): string[] {
        return Array.from(this.definitions.keys());
    }

    public getTaskDefinitions(): TaskDefinition[] {
        return Array.from(this.definitions.values());
    }

    public getTask(name: string): TaskDefinition | undefined {
        return this.definitions.get(name);
    }
}
