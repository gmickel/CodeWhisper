import inquirer from 'inquirer';
import type { FileInfo } from '../core/file-processor';

export async function interactiveFiltering(
  files: FileInfo[],
): Promise<FileInfo[]> {
  const { selectedFiles } = await inquirer.prompt<{
    selectedFiles: FileInfo[];
  }>([
    {
      type: 'checkbox',
      name: 'selectedFiles',
      message: 'Select files to include:',
      choices: files.map((file) => ({
        name: `${file.path} (${file.language})`,
        value: file,
        checked: true,
      })),
      pageSize: 20,
    },
  ]);

  return selectedFiles;
}
