import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
export const genAI = new GoogleGenerativeAI(apiKey || 'placeholder');

export async function analyzeSpreadsheetStructure(headers, sampleRows) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Analyze the following spreadsheet headers and sample data from an attendance sheet.
    Identify:
    1. Which column represents the student's name.
    2. Which column represents the student's USN or unique ID.
    3. Which column represents the student's email (if any).
    4. Which columns represent attendance sessions. For these columns, identify the date.
       CRITICAL: Dates are in Indian Format (DD/MM/YYYY). For example, "05/12" is December 5th, not May 12th.
       Identify the dates and convert them to ISO strings (YYYY-MM-DD).

    Headers: ${JSON.stringify(headers)}
    Sample Data: ${JSON.stringify(sampleRows)}

    Return a JSON object in this format:
    {
      "mapping": {
        "name_column": "header_name_or_index",
        "usn_column": "header_name_or_index",
        "email_column": "header_name_or_index",
        "branch_column": "header_name_or_index"
      },
      "sessions": [
        { "column": "header_name_or_index", "date": "YYYY-MM-DD", "original_header": "..." }
      ]
    }
    Only return the JSON.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log("Raw AI Response (Analysis):", text);
  
  // Clean the response text (remove markdown code blocks if any)
  const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleanJson);
}

export async function suggestMissingDates(sessions, schedule) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Given a list of sessions (some with missing dates) and a weekly class schedule, suggest dates for the missing sessions.
    
    IMPORTANT RULES:
    1. The sessions ALWAYS happen on: Wednesdays, Thursdays, and Saturdays.
    2. Dates are in Indian format (DD/MM/YYYY).
    3. Use the known dates in the list as anchors and fill the gaps using the Wed/Thu/Sat rule.
    4. Ensure suggested dates are consecutive based on the schedule (don't skip weeks).

    Sessions: ${JSON.stringify(sessions)}
    Weekly Schedule: "${schedule}"

    Return the updated sessions list as JSON:
    [
      { "column": "...", "date": "YYYY-MM-DD", "original_header": "..." }
    ]
    Only return the JSON.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log("Raw AI Response (Suggestions):", text);
  const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleanJson);
}
