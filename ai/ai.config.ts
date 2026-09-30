import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function getAgentModel(isPlanMode:boolean=false) {
  const provider = createOpenAICompatible({
    name: "nim",
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY,
  });
  
  const modelId = isPlanMode
    ? process.env.NVIDIA_ULTRA_MODEL!
    : process.env.NVIDIA_DEFAULT_MODEL!;
  return provider(modelId!);
}
