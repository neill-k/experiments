export interface Prompt {
  id: string;
  name: string;
  content: string;
  variables: string[];
  versions: { content: string; timestamp: number }[];
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

export interface Settings {
  apiKey: string;
  model: string;
}
