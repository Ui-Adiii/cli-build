import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import config from "../config/config";
export function getAgentModel() {
  const provider = createOpenAICompatible({
    name: "nim",
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: config["nvidia-api-key"] || process.env.NVIDIA_API_KEY,
  });  
  return provider(config.model ||process.env.NVIDIA_DEFAULT_MODEL);
}
