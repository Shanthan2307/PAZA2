// Mock implementation of @elizaos/core for standalone usage

export const elizaLogger = {
  info: (msg: string, ...args: any[]) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
};

export interface Memory {
  content: {
    text?: string;
    type: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface IAgentRuntime {
  [key: string]: any;
}

export interface Action {
  name: string;
  description: string;
  similes: string[];
  examples: any[];
  validate: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
  handler: (runtime: IAgentRuntime, message: Memory) => Promise<any>;
}
