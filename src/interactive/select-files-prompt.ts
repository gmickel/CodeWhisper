import path from 'node:path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

export async function selectFilesPrompt(
  basePath: string,
  invert: boolean,
): Promise<string[]> {
  const answer = await inquirer.prompt([
    {
      type: 'file-tree-selection',
      name: 'selectedFiles',
      message: `Select files and directories to be ${invert ? 'excluded' : 'included'}:`,
      pageSize: 20,
      root: basePath,
      multiple: true,
      enableGoUpperDirectory: false,
      onlyShowValid: false,
      hideChildrenOfValid: false,
      validate: () => true,
      transformer: (item: string) => path.basename(item),
    },
  ]);

  let selectedFilesOrDirs = Array.isArray(answer.selectedFiles)
    ? answer.selectedFiles.map((file: string) => path.relative(basePath, file))
    : [path.relative(basePath, answer.selectedFiles)];

  // Process the selected files/directories
  selectedFilesOrDirs = selectedFilesOrDirs.map((fileOrDir: string) => {
    const fullPath = path.join(basePath, fileOrDir);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
      return path.join(fileOrDir, '**/*');
    }
    return fileOrDir;
  });

  // If the top-level directory is selected, use '**/*' to include all files
  if (selectedFilesOrDirs.length === 1 && selectedFilesOrDirs[0] === '') {
    selectedFilesOrDirs = ['**/*'];
  }

  return selectedFilesOrDirs;
}
