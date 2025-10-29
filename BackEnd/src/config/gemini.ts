import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Get Gemini Pro model
export const getGeminiModel = () => {
    return genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
};

// Analyze code with Gemini
export const analyzeCode = async (code: string, fileName: string, prContext: string) => {
    try {
        const model = getGeminiModel();

        const prompt = `You are an expert code reviewer. Analyze the following code and provide detailed feedback.

File: ${fileName}
Pull Request Context: ${prContext}

Code:
\`\`\`
${code}
\`\`\`

Please provide a comprehensive code review including:
1. **Bugs**: Any logical errors or potential bugs
2. **Security Issues**: Vulnerabilities, injection risks, authentication problems
3. **Performance**: Inefficient code, memory leaks, optimization opportunities
4. **Code Quality**: Style issues, readability, maintainability
5. **Best Practices**: Violations of language-specific best practices

For each issue found, provide:
- Severity: critical, high, medium, low, or info
- Category: bug, security, performance, style, or best-practice
- Line number (estimate based on code)
- Clear description of the issue
- Specific suggestion for fixing it

Format your response as JSON:
{
  "summary": "Overall assessment of the code",
  "qualityScore": 85, // Score from 0-100
  "findings": [
    {
      "severity": "high",
      "category": "security",
      "line": 42,
      "title": "SQL Injection Vulnerability",
      "description": "User input is directly concatenated into SQL query",
      "suggestion": "Use parameterized queries or ORM",
      "codeSnippet": "SELECT * FROM users WHERE id = " + userId
    }
  ]
}

If the code is excellent with no issues, return an empty findings array but still provide summary and qualityScore.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse Gemini response');
        }

        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;

    } catch (error) {
        console.error('Error analyzing code with Gemini:', error);
        throw error;
    }
};

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