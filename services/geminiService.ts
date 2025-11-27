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
  useSearch: boolean
): Promise<AsyncGenerator<GenerateContentResponse>> => {
  const ai = getAIClient();
  
  // Use gemini-2.5-flash for general chat as it is fast and capable.
  // If search is enabled, we use search tool.
  const modelName = 'gemini-2.5-flash';

  const tools = useSearch ? [{ googleSearch: {} }] : [];

  const chat = ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: `You are an expert Unreal Engine 5 Developer Assistant. 
      Your goal is to help users write C++ code, understand Blueprints, and solve UE5 specific problems.
      
      Guidelines:
      1. When providing C++ code, adhere to UE5 coding standards (prefix classes with A for Actor, U for Object, F for Structs, T for Templates).
      2. Use UPROPERTY and UFUNCTION macros correctly with appropriate specifiers (e.g., EditAnywhere, BlueprintReadWrite).
      3. For Blueprint questions, describe the node logic clearly or suggest specific nodes to use.
      4. If the user asks about API specifics, prefer recent UE5 documentation.
      5. Keep responses concise and technical but accessible.
      6. Format code blocks clearly with language specifiers (cpp, python).
      `,
      tools: tools,
    },
    history: history,
  });

  return chat.sendMessageStream({ message: currentMessage });
};

export const generateCppClass = async (params: ClassGenParams): Promise<string> => {
  const ai = getAIClient();
  
  // Using gemini-3-pro-preview for complex code generation tasks for better reasoning
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
      thinkingConfig: { thinkingBudget: 2048 }, // Enable thinking for better code structure
    }
  });

  return response.text || "Failed to generate code.";
};
