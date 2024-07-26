import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

export async function generateAIResponse(prompt: string): Promise<string> {
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  try {
    const result = await generateText({
      model: anthropic('claude-3-haiku-20240307'),
      maxTokens: 4096,
      prompt,
    });
    return result.text;
  } catch (error) {
    console.error(chalk.red('Error generating AI response:'), error);
    throw error;
  }
}
