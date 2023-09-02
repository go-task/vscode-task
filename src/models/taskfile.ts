export type TaskMapping = {
    [key: string]: TaskMapping | null;
};

export interface Taskfile {
    tasks: Task[];
    location: string; // The location of the actual Taskfile
    // The vscode workspace directory where the command was executed to find this taskfile
    // This is where tasks in this taskfile will be executed from.
    workspace: string;
}

export interface Task {
    name: string;
    desc: string;
    summary: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    up_to_date: boolean;
    location: Location;
}

export interface Location {
    taskfile: string;
    line: number;
    column: number;
}
