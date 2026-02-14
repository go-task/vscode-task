// Namespace represents an individual Taskfile namespace and is used for
// decoding the JSON output from `task --list --json`.
export interface Namespace {
    tasks: Task[];
    namespaces: Map<string, Namespace>;
    location: string; // The location of the actual Taskfile
}

// Task represents an individual Taskfile task and is used for decoding
// the JSON output from `task --list --json`.
export interface Task {
    name: string;
    desc: string;
    summary: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    up_to_date: boolean | undefined;
    location: Location;
}

// Location represents the location of a task in a Taskfile and is used for
// decoding the JSON output from `task --list --json`.
export interface Location {
    taskfile: string;
    line: number;
    column: number;
}
