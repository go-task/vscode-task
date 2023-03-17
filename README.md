# Task for Visual Studio Code

This extension integrates your Taskfile into Visual Studio Code.

## Features

- View tasks in the activity bar
- Run tasks from the activity bar and command palette
- Go to definition
- Multi-root workspace support
- Ability to initialize a Taskfile in the current workspace
  - If no Taskfile is detected a button will appear in the activity bar

## Roadmap

- Run last task command
- Loading icon when a task is running in tree view
- Stream output to output channel instead of waiting for command to finish
- Switch between nested/flat task view
- Refresh up-to-date status when a task's sources change
- Status polling to update up-to-date status
- Support global tasks
- Install Task via command palette
  - Prompt if a Taskfile is detected and Task is not installed
