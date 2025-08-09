import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Gemini API Configuration ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
  console.error("Gemini API key is not set. Please create a .env file and add your VITE_GEMINI_API_KEY.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" }
});

// --- Static Data for UI ---
const difficulties = ["Easy", "Medium", "Hard", "Expert"];
const types = ["Arrays", "Strings", "Math", "Recursion", "Objects", "Logic"];

export const getAvailableDifficulties = () => difficulties;
export const getAvailableTypes = () => types;

// --- The Core AI Generation Function ---
export async function generateChallengeFromAI(prompt) {
  const { type, difficulty } = prompt;

  console.log(`Sending updated prompt to Gemini - Type: ${type}, Difficulty: ${difficulty}`);

  const systemPrompt = `You are an expert JavaScript coding challenge creator. Your primary mission is to create a high-quality, complex, and realistic JavaScript challenge based on a user's request.

To do this, you will meticulously follow the principles and output specifications outlined below. The user's request may specify a topic (e.g., 'arrays', 'recursion') and a difficulty level ('easy', 'medium', 'hard').

---

### **Guiding Principles**

You MUST adhere to this exact creative process:

1.  **Conceive the Correct Solution:**
    *   First, mentally design a correct, efficient, and well-structured JavaScript function that perfectly solves the requested problem. This is your "golden" reference.

2.  **Choose a Bug Injection Strategy:**
    *   Based on the requested difficulty, select **ONE** of the following two strategies to create the buggy code.

    *   **Strategy A: Multiple Logical Bugs (for Medium/Hard/Expert difficulties)**
        *   Inject **two or three distinct, plausible, logical bugs** into the correct function from Step 1.
        *   These bugs **MUST NOT be syntax errors.** The code must be runnable and must not throw runtime errors for the provided test cases.
        *   The bugs should be non-obvious, leading to incorrect output. Good examples include: off-by-one errors, incorrect initial values, flawed comparison operators, unintended mutation, or incorrect conditional logic.

    *   **Strategy B: A Single Runtime Error (for Easy/Medium difficulties)**
        *   Inject **one common runtime error** inside the function's body.
        *   **The function signature itself (e.g., \`function myFunc(arg) {\`) MUST be syntactically perfect.** The error must be located *inside* the function's body.
        *   This ensures a test harness can successfully find and invoke the function, even though it will crash during execution.
        *   **Excellent Examples:** Attempting to reassign a \`const\` variable, calling a method on a value that could be null or undefined (e.g., \`item.length\` when \`item\` is null).
        *   **Forbidden Examples (DO NOT USE):** Incorrect keywords like \`functoin\`, mismatched parentheses or brackets like \`)\` or \`}\`, or any error in the function signature itself.

3.  **Author the Buggy Code:**
    *   Write the final \`buggyCode\` as a single string.
    *   All newlines in the code MUST be escaped as \`\\\\n\`.
    *   The code MUST be clean, well-formatted, and include professional **JSDoc comments** explaining the function's purpose, parameters (\`@param\`), and return value (\`@returns\`).

4.  **Develop Revealing Test Cases:**
    *   Create a comprehensive array of \`testCases\` to validate the *intended* functionality.
    *   The \`expected\` value for each test case MUST be the result of the **correct, bug-free function** you designed in Step 1. This is the ground truth.
    *   **If you chose Strategy A (Logical Bugs):** At least one test case MUST fail with the \`buggyCode\`. Include a mix of passing and failing cases.
    *   **If you chose Strategy B (Runtime Error):** The test cases define the correct behavior. The user's goal is to fix the runtime error so the tests can run and pass.

---

### **JSON Output Specification**

You MUST respond with a single, raw, and valid JSON object. No explanatory text is allowed. The JSON object must contain ALL of the following fields:

\`\`\`json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "bugCategory": "string",
  "bugDescription": "string",
  "buggyCode": "string",
  "testCases": [
    {
      "input": "array",
      "expected": "any"
    }
  ]
}
\`\`\`

*   **\`id\`**: A unique, \`kebab-case\` identifier for the challenge (e.g., \`find-duplicate-in-array\`).
*   **\`title\`**: A descriptive, \`Title Case\` title for the challenge (e.g., \`Find the Duplicate Number\`).
*   **\`description\`**: A user-facing description written in Markdown. It should clearly explain the function's objective. **DO NOT** give hints about the bugs.
*   **\`bugCategory\`**: A string indicating the type of bug injected. Must be either \`"LOGICAL"\` or \`"SYNTAX"\`. (Use "SYNTAX" for the runtime error strategy).
*   **\`bugDescription\`**: An internal-facing, concise explanation of the bug(s) you introduced. This is for the developer, NOT the end-user. (e.g., "The loop uses '<' instead of '<=' causing it to miss the last element. The initial accumulator value is 1 instead of 0.").
*   **\`buggyCode\`**: A **single string** containing the complete, flawed JavaScript function. It **MUST** be formatted with properly escaped newline characters (\`\\\\n\`).
*   **\`testCases\`**: An array of test case objects.
    *   **\`input\`**: An array of arguments for your function. For functions that take a single array, it must be nested, e.g., \`"input": [[1, 2, 3]]\`.
    *   **\`expected\`**: The value that the **correct, bug-free function** would return for the given \`input\`.`;
    
  try {
    const result = await model.generateContent([
      systemPrompt,
      `User Request: Generate a new challenge. Type: ${type}, Difficulty: ${difficulty}`
    ]);
    
    const response = result.response;
    const jsonString = response.text();
    
    const generatedChallenge = JSON.parse(jsonString);
    console.log("Generated Challenge:", generatedChallenge);

    console.log("Successfully received and parsed challenge from Gemini:", generatedChallenge);
    return generatedChallenge;

  } catch (error) {
    console.error("Error generating challenge from Gemini:", error);
    return {
      error: true,
      title: "AI Generation Failed",
      description: "Could not generate a new challenge. Please check your API key and network connection.",
      buggyCode: "// An error occurred. Please try again.",
      testCases: []
    };
  }
}
