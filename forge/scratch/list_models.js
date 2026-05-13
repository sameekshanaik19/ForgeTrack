import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.VITE_GEMINI_API_KEY;

async function listModels() {
  try {
    // We have to use the fetch API or a REST call since the SDK doesn't expose listModels easily
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("General error:", error.message);
  }
}

listModels();
