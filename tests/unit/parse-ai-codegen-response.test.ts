import { describe, expect, it } from 'vitest';
import { parseAICodegenResponse } from '../../src/ai/parse-ai-codegen-response';

describe('parseAICodegenResponse', () => {
  it('should correctly parse a valid AI response', () => {
    const mockResponse = `
<file_list>
file1.js
file2.ts
</file_list>

<file>
<file_path>src/file1.js</file_path>
<file_content language="javascript">
console.log('Hello, World!');
</file_content>
<file_status>modified</file_status>
<explanation>
Updated console log message
</explanation>
</file>

<file>
<file_path>src/file2.ts</file_path>
<file_content language="typescript">
const greeting: string = 'Hello, TypeScript!';
console.log(greeting);
</file_content>
<file_status>new</file_status>
</file>

<git_branch_name>feature/new-greeting</git_branch_name>

<git_commit_message>Add new greeting functionality</git_commit_message>

<summary>
Added a new TypeScript file and modified an existing JavaScript file.
</summary>

<potential_issues>
None identified.
</potential_issues>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.fileList).toEqual(['file1.js', 'file2.ts']);
    expect(result.files).toHaveLength(2);
    expect(result.files[0]).toEqual({
      path: 'src/file1.js',
      language: 'javascript',
      content: "console.log('Hello, World!');",
      status: 'modified',
      explanation: 'Updated console log message',
    });
    expect(result.files[1]).toEqual({
      path: 'src/file2.ts',
      language: 'typescript',
      content:
        "const greeting: string = 'Hello, TypeScript!';\nconsole.log(greeting);",
      status: 'new',
    });
    expect(result.gitBranchName).toBe('feature/new-greeting');
    expect(result.gitCommitMessage).toBe('Add new greeting functionality');
    expect(result.summary).toBe(
      'Added a new TypeScript file and modified an existing JavaScript file.',
    );
    expect(result.potentialIssues).toBe('None identified.');
  });

  it('should handle responses with deleted files', () => {
    const mockResponse = `
<file_list>
file-to-delete.js
</file_list>

<file>
<file_path>src/file-to-delete.js</file_path>
<file_status>deleted</file_status>
</file>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.fileList).toEqual(['file-to-delete.js']);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toEqual({
      path: 'src/file-to-delete.js',
      language: '',
      content: '',
      status: 'deleted',
    });
  });

  it('should handle responses with no file changes (file list with only whitespace)', () => {
    const mockResponse = `
<file_list>

</file_list>

<git_branch_name>no-changes</git_branch_name>

<git_commit_message>No changes required</git_commit_message>

<summary>
No changes were necessary for this task.
</summary>

<potential_issues>
None
</potential_issues>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.fileList).toEqual([]);
    expect(result.files).toHaveLength(0);
    expect(result.gitBranchName).toBe('no-changes');
    expect(result.gitCommitMessage).toBe('No changes required');
  });

  it('should handle severely malformed responses', () => {
    const mockResponse = `
This is not even close to valid XML
<git_branch_name>This tag is not closed properly
<random_tag>Random content</random_tag>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.fileList).toEqual([]);
    expect(result.files).toHaveLength(0);
    expect(result.gitBranchName).toMatch(/^feature\/ai-task-\d+$/);
    expect(result.gitCommitMessage).toBe('Error: Malformed response');
    expect(result.summary).toBe('');
    expect(result.potentialIssues).toBe('');
  });

  it('should handle responses with missing sections', () => {
    const mockResponse = `
<file_list>
file1.js
</file_list>

<file>
<file_path>src/file1.js</file_path>
<file_content language="javascript">
console.log('Hello, World!');
</file_content>
<file_status>modified</file_status>
</file>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.fileList).toEqual(['file1.js']);
    expect(result.files).toHaveLength(1);
    expect(result.gitCommitMessage).toBe('');
    expect(result.summary).toBe('');
    expect(result.potentialIssues).toBe('');
  });

  it('should provide a default branch name when gitBranchName is empty', () => {
    const mockResponse = `
<file_list></file_list>
<git_branch_name></git_branch_name>
<git_commit_message>Some commit message</git_commit_message>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.gitBranchName).toMatch(/^feature\/ai-task-\d+$/);
  });

  it('should sanitize invalid branch names', () => {
    const mockResponse = `
<file_list></file_list>
<git_branch_name>invalid/branch/name!@#$%^&*()</git_branch_name>
<git_commit_message>Some commit message</git_commit_message>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.gitBranchName).toBe('invalid/branch/name----------');
  });

  it('should sanitize invalid branch names with a leading slash', () => {
    const mockResponse = `
<file_list></file_list>
<git_branch_name>/feature/invalid-branch-name-issue-123</git_branch_name>
<git_commit_message>Some commit message</git_commit_message>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.gitBranchName).toBe('feature/invalid-branch-name-issue-123');
  });

  it('should provide a default branch name when sanitized name is empty', () => {
    const mockResponse = `
<file_list></file_list>
<git_branch_name>!@#$%^&*()</git_branch_name>
<git_commit_message>Some commit message</git_commit_message>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.gitBranchName).toMatch(/^feature\/ai-task-\d+$/);
  });

  it('should handle responses with extra whitespace and newlines', () => {
    const mockResponse = `
    <file_list>
      file1.js
      file2.js
    </file_list>

    <file>
      <file_path>  src/file1.js  </file_path>
      <file_content language="javascript">

        console.log('Hello, World!');

      </file_content>
      <file_status>  modified  </file_status>
    </file>

    <git_branch_name>
      feature/whitespace
    </git_branch_name>

    <git_commit_message>
      Handle extra whitespace
    </git_commit_message>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.fileList).toEqual(['file1.js', 'file2.js']);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].path).toBe('src/file1.js');
    expect(result.files[0].content).toBe("console.log('Hello, World!');");
    expect(result.files[0].status).toBe('modified');
    expect(result.gitBranchName).toBe('feature/whitespace');
    expect(result.gitCommitMessage).toBe('Handle extra whitespace');
  });

  it('should handle responses with multiple files of the same name', () => {
    const mockResponse = `
<file_list>
file1.js
file1.js
</file_list>

<file>
<file_path>src/file1.js</file_path>
<file_content language="javascript">
console.log('First file');
</file_content>
<file_status>new</file_status>
</file>

<file>
<file_path>test/file1.js</file_path>
<file_content language="javascript">
console.log('Second file');
</file_content>
<file_status>new</file_status>
</file>
`;

    const result = parseAICodegenResponse(mockResponse);

    expect(result.fileList).toEqual(['file1.js', 'file1.js']);
    expect(result.files).toHaveLength(2);
    expect(result.files[0].path).toBe('src/file1.js');
    expect(result.files[1].path).toBe('test/file1.js');
  });
});
