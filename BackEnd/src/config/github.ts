import { Octokit } from '@octokit/rest';

// Create GitHub client with token
export const createGitHubClient = (token: string) => {
  return new Octokit({
    auth: token,
  });
};

// Get pull request files
export const getPullRequestFiles = async (
  owner: string,
  repo: string,
  pullNumber: number,
  token: string
) => {
  try {
    const octokit = createGitHubClient(token);

    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    // Filter for code files only (ignore images, etc.)
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rb', '.php', '.cpp', '.c', '.cs', '.swift', '.kt'];
    
    const codeFiles = files.filter(file => {
      const ext = file.filename.substring(file.filename.lastIndexOf('.'));
      return codeExtensions.includes(ext);
    });

    return codeFiles;

  } catch (error) {
    console.error('Error fetching PR files:', error);
    throw error;
  }
};

// Get file content from GitHub
export const getFileContent = async (
  owner: string,
  repo: string,
  path: string,
  ref: string,
  token: string
) => {
  try {
    const octokit = createGitHubClient(token);

    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref, // branch or commit SHA
    });

    // GitHub returns base64 encoded content
    if ('content' in data && data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return content;
    }

    return null;

  } catch (error) {
    console.error('Error fetching file content:', error);
    throw error;
  }
};

// Post review comment to GitHub
export const postReviewComment = async (
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  token: string
) => {
  try {
    const octokit = createGitHubClient(token);

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber, // PRs are issues in GitHub API
      body,
    });

    console.log(`Posted review comment to PR #${pullNumber}`);

  } catch (error) {
    console.error('Error posting review comment:', error);
    throw error;
  }
};

// Format review findings as markdown
export const formatReviewAsMarkdown = (review: any): string => {
  let markdown = `## 🤖 CodePro AI Review\n\n`;
  markdown += `**Quality Score:** ${review.qualityScore}/100\n\n`;
  markdown += `**Summary:** ${review.summary}\n\n`;
  markdown += `**Files Analyzed:** ${review.filesAnalyzed}\n`;
  markdown += `**Issues Found:** ${review.issuesFound}\n\n`;

  if (review.findings && review.findings.length > 0) {
    markdown += `---\n\n### Issues Found\n\n`;

    // Group by severity
    const critical = review.findings.filter((f: any) => f.severity === 'critical');
    const high = review.findings.filter((f: any) => f.severity === 'high');
    const medium = review.findings.filter((f: any) => f.severity === 'medium');
    const low = review.findings.filter((f: any) => f.severity === 'low');

    const addFindings = (findings: any[], emoji: string, label: string) => {
      if (findings.length > 0) {
        markdown += `#### ${emoji} ${label} (${findings.length})\n\n`;
        findings.forEach((finding: any, index: number) => {
          markdown += `**${index + 1}. ${finding.title}** (\`${finding.file}\`:${finding.line})\n`;
          markdown += `- **Category:** ${finding.category}\n`;
          markdown += `- **Issue:** ${finding.description}\n`;
          if (finding.suggestion) {
            markdown += `- **Suggestion:** ${finding.suggestion}\n`;
          }
          if (finding.codeSnippet) {
            markdown += `\`\`\`\n${finding.codeSnippet}\n\`\`\`\n`;
          }
          markdown += `\n`;
        });
      }
    };

    addFindings(critical, '🚨', 'Critical Issues');
    addFindings(high, '⚠️', 'High Priority');
    addFindings(medium, '⚡', 'Medium Priority');
    addFindings(low, 'ℹ️', 'Low Priority / Info');

  } else {
    markdown += `### ✅ No Issues Found\n\n`;
    markdown += `Great job! The code looks clean.\n\n`;
  }

  markdown += `---\n`;
  markdown += `*Powered by CodePro AI - Gemini Pro 2.0*`;

  return markdown;
};