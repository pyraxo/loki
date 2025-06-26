type State = {
  text: string;
  selection: TextSelection;
  insertText: string;
  insertMode: boolean;
  selectedFile: string | null;
  modifiedFiles: Record<string, boolean>;
  files: Record<string, LocalFile>;
}

type Actions = {
  setText: (text: string) => void;
  setFileText: (path: string, text: string) => void;
  updateSelection: (start: number, end: number) => void;
  setInsertText: (text: string) => void;
  setInsertMode: (mode: boolean) => void;
  resetSelection: () => void;
  setSelectedFile: (file: LocalFile) => void;
  resetSelectedFile: () => void;
  addModifiedFile: (path: string) => void;
  removeModifiedFile: (path: string) => void;
  clearModifiedFiles: () => void;
  setFiles: (files: Record<string, LocalFile>) => void;
  includeFile: (path: string, file: LocalFile) => void;
  dropFile: (path: string) => void;
  updateFile: (oldPath: string, newPath: string, file: LocalFile) => void;
}

interface Store extends State, Actions { }

export default Store;
