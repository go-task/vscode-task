export interface Taskfile {
    tasks: Task[];
}

export interface Task {
    name: string;
    desc: string;
    summary: string;
    up_to_date: boolean;
}
