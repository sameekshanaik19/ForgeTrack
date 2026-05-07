import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    // The SDK doesn't have a direct 'listModels' that is easy to call without a specific version
    // But we can try to generate content with a very common one
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro"];
    
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        await model.generateContent("test");
        console.log(`✅ Model ${modelName} is AVAILABLE`);
      } catch (e) {
        console.log(`❌ Model ${modelName} is NOT AVAILABLE: ${e.message}`);
      }
    }
  } catch (error) {
    console.error("General error:", error.message);
  }
}

listModels();
