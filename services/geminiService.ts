
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ClassGenParams } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  currentMessage: string,
  useSearch: boolean,
  image?: { data: string; mimeType: string }
): Promise<AsyncGenerator<GenerateContentResponse>> => {
  const ai = getAIClient();
  
  // gemini-2.5-flash is excellent for multimodal vision and general chat
  const modelName = 'gemini-2.5-flash';

  const tools = useSearch ? [{ googleSearch: {} }] : [];

  const parts: any[] = [{ text: currentMessage }];
  if (image) {
    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    });
  }

  // We use generateContentStream directly to handle the multi-part content for the latest turn
  // while maintaining the context of previous turns.
  const contents = [...history, { role: 'user', parts }];

  return ai.models.generateContentStream({
    model: modelName,
    contents: contents,
    config: {
      systemInstruction: `You are an expert Unreal Engine 5 Developer Assistant. 
      Your goal is to help users write C++ code, understand Blueprints, solve UE5 specific problems, and analyze screenshots or diagrams.
      
      Guidelines:
      1. When providing C++ code, adhere to UE5 coding standards (prefix classes with A for Actor, U for Object, F for Structs, T for Templates).
      2. Use UPROPERTY and UFUNCTION macros correctly with appropriate specifiers (e.g., EditAnywhere, BlueprintReadWrite).
      3. For Blueprint questions, describe the node logic clearly or suggest specific nodes to use.
      4. If the user provides an image (e.g., a Blueprint screenshot or an error message), analyze it thoroughly to provide specific advice.
      5. Keep responses concise and technical but accessible.
      6. Format code blocks clearly with language specifiers (cpp, python).
      `,
      tools: tools,
    },
  });
};

export const generateCppClass = async (params: ClassGenParams): Promise<string> => {
  const ai = getAIClient();
  
  const prompt = `
    Generate a complete Unreal Engine 5 C++ Header (.h) and Source (.cpp) file content for the following request.
    
    Class Name: ${params.className}
    Parent Class: ${params.parentClass}
    Desired Features/Logic: ${params.features}

    Requirements:
    - Include necessary headers.
    - Use correct prefixes (A${params.className} or U${params.className}).
    - Include constructor.
    - Add 'Generate Body' macro.
    - Add comments explaining the code.
    - Output the result as two distinct code blocks.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 2048 },
    }
  });

  return response.text || "Failed to generate code.";
};
