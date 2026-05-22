import 'dotenv/config';
import { generateText } from '../utils/geminiClient.js';

const testContext = `
[PROFILE]
Name: Deep Mehta
Title: Systems, Backend & AI Engineering Student
Bio: Computer Science student focused on backend engineering, AI systems, and problem solving.

[SKILLS]
- Backend: Node.js, Express.js, PostgreSQL (Intermediate)
- Languages: Java, JavaScript, Python, SQL
- Currently learning: Gemini API, System Design, DevOps fundamentals
`;

const systemPrompt = `You are an AI assistant for Deep Mehta's engineering portfolio. 
Be concise, technical, and authentic. Reference real projects and experiences.
Never overclaim or make up achievements.`;

const userQuestion = "Who is Deep Mehta?";

const fullPrompt = `${systemPrompt}

Context:
${testContext}

User: ${userQuestion}`;

(async () => {
  try {
    console.log('Testing small-context prompt...');
    console.log('Q:', userQuestion);
    console.log('---');
    const resp = await generateText(fullPrompt, { maxOutputTokens: 256 });
    console.log('A:', resp);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
