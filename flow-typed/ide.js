declare type IDEWorkspace = {
  name: string;
  projects: Array<IDEProject>;
}

declare type IDEProject = {
  name: string;
  sources: Array<string>;
  libraries: Array<{id: string, path: string}>;
}
