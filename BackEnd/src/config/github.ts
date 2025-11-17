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
  // Get quality badge color based on score
  const getQualityBadge = (score: number): string => {
    if (score >= 90) return '![Quality](https://img.shields.io/badge/Quality-Excellent-brightgreen)';
    if (score >= 80) return '![Quality](https://img.shields.io/badge/Quality-Good-green)';
    if (score >= 60) return '![Quality](https://img.shields.io/badge/Quality-Fair-yellow)';
    if (score >= 40) return '![Quality](https://img.shields.io/badge/Quality-Needs%20Improvement-orange)';
    return '![Quality](https://img.shields.io/badge/Quality-Poor-red)';
  };

  const getQualityEmoji = (score: number): string => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '✅';
    if (score >= 60) return '⚠️';
    return '❌';
  };

  const qualityScore = review.qualityScore || 0;
  const qualityBadge = getQualityBadge(qualityScore);
  const qualityEmoji = getQualityEmoji(qualityScore);

  let markdown = `## 🤖 AI Code Review by CodePro\n\n`;
  markdown += `---\n\n`;
  
  // Stats Table - Eye-catching layout
  markdown += `| ${qualityEmoji} **Quality Score** | 📁 **Files Analyzed** | 🐛 **Issues Found** |\n`;
  markdown += `|:---:|:---:|:---:|\n`;
  markdown += `| **${qualityScore}/100** ${qualityBadge} | **${review.filesAnalyzed || 0}** | **${review.issuesFound || 0}** |\n\n`;

  // Summary Section
  if (review.summary) {
    markdown += `### 📋 Summary\n\n`;
    markdown += `> ${review.summary}\n\n`;
    markdown += `---\n\n`;
  }

  if (review.findings && review.findings.length > 0) {
    markdown += `## 🔍 Issues Found\n\n`;
    markdown += `<details>\n`;
    markdown += `<summary><b>📊 Click to view all issues (${review.findings.length} total)</b></summary>\n\n`;

    // Group by severity
    const critical = review.findings.filter((f: any) => f.severity === 'critical');
    const high = review.findings.filter((f: any) => f.severity === 'high');
    const medium = review.findings.filter((f: any) => f.severity === 'medium');
    const low = review.findings.filter((f: any) => f.severity === 'low');

    const addFindings = (findings: any[], emoji: string, label: string, color: string) => {
      if (findings.length > 0) {
        markdown += `### ${emoji} ${label} (${findings.length})\n\n`;
        
        // Summary table using markdown
        markdown += `| # | Issue | Location | Category |\n`;
        markdown += `|---|-------|----------|----------|\n`;
        
        findings.forEach((finding: any, index: number) => {
          const fileDisplay = finding.file.length > 30 
            ? finding.file.substring(0, 27) + '...' 
            : finding.file;
          
          markdown += `| **${index + 1}** | **${finding.title}** | \`${fileDisplay}:${finding.line || '?'}\` | \`${finding.category || 'N/A'}\` |\n`;
        });
        
        markdown += `\n`;

        // Detailed findings in collapsible sections
        findings.forEach((finding: any, index: number) => {
          markdown += `<details>\n`;
          markdown += `<summary><b>${index + 1}. ${finding.title}</b> - <code>${finding.file}:${finding.line || '?'}</code></summary>\n\n`;
          
          markdown += `**📝 Description:**\n`;
          markdown += `> ${finding.description || 'No description provided.'}\n\n`;
          
          if (finding.category) {
            markdown += `**🏷️ Category:** \`${finding.category}\`\n\n`;
          }
          
          if (finding.suggestion) {
            markdown += `**💡 Suggestion:**\n`;
            markdown += `> ${finding.suggestion}\n\n`;
          }
          
          if (finding.codeSnippet) {
            markdown += `**📄 Code Snippet:**\n\n`;
            // Try to detect language from file extension
            const fileExt = finding.file.split('.').pop()?.toLowerCase() || '';
            const languageMap: { [key: string]: string } = {
              'ts': 'typescript', 'js': 'javascript', 'jsx': 'jsx', 'tsx': 'tsx',
              'py': 'python', 'java': 'java', 'go': 'go', 'rb': 'ruby',
              'php': 'php', 'cpp': 'cpp', 'c': 'c', 'cs': 'csharp',
              'swift': 'swift', 'kt': 'kotlin', 'rs': 'rust'
            };
            const language = languageMap[fileExt] || '';
            markdown += `\`\`\`${language}\n${finding.codeSnippet}\n\`\`\`\n\n`;
          }
          
          markdown += `</details>\n\n`;
        });
      }
    };

    addFindings(critical, '🚨', 'Critical Issues', 'red');
    addFindings(high, '⚠️', 'High Priority Issues', 'orange');
    addFindings(medium, '⚡', 'Medium Priority Issues', 'yellow');
    addFindings(low, 'ℹ️', 'Low Priority / Suggestions', 'blue');

    markdown += `</details>\n\n`;

  } else {
    markdown += `## ✅ No Issues Found!\n\n`;
    markdown += `<div align="center">\n\n`;
    markdown += `🎉 **Excellent work!** Your code looks clean and well-written.\n\n`;
    markdown += `![Success](https://img.shields.io/badge/Status-All%20Clear-success?style=for-the-badge)\n\n`;
    markdown += `</div>\n\n`;
  }

  markdown += `---\n\n`;
  markdown += `<div align="center">\n\n`;
  markdown += `*Powered by [CodePro AI](https://codepro.ai) 🤖 | Gemini Pro 2.0*\n\n`;
  markdown += `*Automated code review • Quality assurance • Best practices*\n\n`;
  markdown += `</div>`;

  return markdown;
};