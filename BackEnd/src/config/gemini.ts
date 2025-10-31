import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Get Gemini Pro model
export const getGeminiModel = () => {
    return genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
};

// Analyze code with Gemini
// Analyze code with Gemini (IMPROVED)
export const analyzeCode = async (code: string, fileName: string, prContext: string) => {
    try {
        const model = getGeminiModel();

        // Get file extension for language detection
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        const language = getLanguageName(extension);

        const prompt = `You are an expert code reviewer analyzing a ${language} file.

File: ${fileName}
Pull Request Context: ${prContext}

Code to review:
\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive code review focusing on:

1. **Bugs & Logic Errors**: Potential runtime errors, null pointer exceptions, off-by-one errors, logic flaws
2. **Security Vulnerabilities**: SQL injection, XSS, CSRF, authentication issues, exposed secrets, insecure dependencies
3. **Performance Issues**: Inefficient algorithms, memory leaks, unnecessary database queries, N+1 problems
4. **Code Quality**: Readability, maintainability, naming conventions, code duplication
5. **Best Practices**: Language-specific patterns, design patterns, SOLID principles

For EACH issue found, provide:
- Specific line number (estimate based on code structure)
- Severity: "critical" (security/crashes), "high" (bugs), "medium" (quality), "low" (style), "info" (suggestions)
- Category: "bug", "security", "performance", "style", "best-practice"
- Clear title (max 60 chars)
- Detailed description
- Actionable suggestion
- Code snippet showing the problem (if applicable)

Return ONLY valid JSON (no markdown, no extra text):

{
  "summary": "Brief overall assessment (2-3 sentences)",
  "qualityScore": 85,
  "findings": [
    {
      "file": "${fileName}",
      "line": 42,
      "severity": "high",
      "category": "security",
      "title": "SQL Injection Vulnerability",
      "description": "User input concatenated directly into SQL query without sanitization",
      "suggestion": "Use parameterized queries or an ORM to prevent SQL injection",
      "codeSnippet": "SELECT * FROM users WHERE id = " + userId
    }
  ]
}

If the code is excellent with no issues, return:
{
  "summary": "Code looks good! No major issues found.",
  "qualityScore": 95,
  "findings": []
}

IMPORTANT: 
- Be thorough but practical
- Focus on real issues, not nitpicking
- Provide constructive feedback
- Return ONLY the JSON object`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('🤖 Gemini raw response length:', text.length);

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('❌ Failed to parse Gemini response - no JSON found');
            console.error('Response:', text.substring(0, 500));
            throw new Error('Failed to parse AI response');
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Ensure file property is set in all findings
        if (analysis.findings) {
            analysis.findings = analysis.findings.map((f: any) => ({
                ...f,
                file: f.file || fileName,
            }));
        }

        return analysis;

    } catch (error: any) {
        console.error('❌ Error analyzing code with Gemini:', error.message);
        throw error;
    }
};

// Helper function to get language name from extension
function getLanguageName(extension: string): string {
    const languages: { [key: string]: string } = {
        '.js': 'javascript',
        '.ts': 'typescript',
        '.jsx': 'javascript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.go': 'go',
        '.rb': 'ruby',
        '.php': 'php',
        '.cpp': 'c++',
        '.c': 'c',
        '.cs': 'c#',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.rs': 'rust',
    };

    return languages[extension.toLowerCase()] || 'code';
}

// Analyze multiple files
export const analyzeMultipleFiles = async (
    files: { name: string; content: string }[],
    prContext: string
) => {
    try {
        const allFindings: any[] = [];
        let totalScore = 0;
        let filesAnalyzed = 0;

        for (const file of files) {
            try {
                const analysis = await analyzeCode(file.content, file.name, prContext);

                allFindings.push(...analysis.findings);
                totalScore += analysis.qualityScore || 0;
                filesAnalyzed++;

                // Add delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error analyzing file ${file.name}:`, error);
                // Continue with other files
            }
        }

        const avgQualityScore = filesAnalyzed > 0 ? Math.round(totalScore / filesAnalyzed) : 0;

        return {
            filesAnalyzed,
            totalIssues: allFindings.length,
            qualityScore: avgQualityScore,
            findings: allFindings,
            summary: `Analyzed ${filesAnalyzed} files, found ${allFindings.length} issues`,
        };

    } catch (error) {
        console.error('Error analyzing multiple files:', error);
        throw error;
    }
};