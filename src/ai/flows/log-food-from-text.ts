'use server';
/**
 * @fileOverview An AI agent that parses a natural language query about food and returns structured nutritional data.
 *
 * - logFoodFromText - A function that handles parsing a text query and returning food log items.
 * - LogFoodFromTextInput - The input type for the logFoodFromText function.
 * - LogFoodFromTextOutput - The return type for the logFoodFromText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const LogFoodFromTextInputSchema = z.object({
  query: z.string().describe('A natural language query describing one or more food items and their quantities, e.g., "150g of chicken breast and a cup of rice".'),
});
export type LogFoodFromTextInput = z.infer<typeof LogFoodFromTextInputSchema>;

const FoodLogItemSchema = z.object({
  name: z.string().describe('The common name of the food item.'),
  weight: z.number().describe('The weight of the food item in grams.'),
  calories: z.number().describe('The estimated calorie content of the food item.'),
  protein: z.number().describe('The estimated protein content in grams.'),
  carbs: z.number().describe('The estimated carbohydrate content in grams.'),
  fat: z.number().describe('The estimated fat content in grams.'),
});

const LogFoodFromTextOutputSchema = z.array(FoodLogItemSchema);
export type LogFoodFromTextOutput = z.infer<typeof LogFoodFromTextOutputSchema>;

export async function logFoodFromText(input: LogFoodFromTextInput): Promise<LogFoodFromTextOutput> {
  return logFoodFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'logFoodFromTextPrompt',
  input: { schema: LogFoodFromTextInputSchema },
  output: { schema: LogFoodFromTextOutputSchema },
  prompt: `You are an expert nutrition logging assistant. A user has provided a text description of a meal. Your task is to identify each food item, determine its weight in grams, and provide its nutritional information (calories, protein, carbs, fat).

  - Use a comprehensive, verified nutritional database for your data.
  - If a quantity is ambiguous (e.g., "a splash of milk"), make a reasonable estimate and use it.
  - Ensure all weights are converted to grams. For example, 1 cup of rice is approximately 185g. 1 tbsp of olive oil is about 14g.
  - Return a list of all identified food items with their nutritional breakdown.

  User Query: "{{query}}"

  Provide the full response in the required JSON format.`,
});

const logFoodFromTextFlow = ai.defineFlow(
  {
    name: 'logFoodFromTextFlow',
    inputSchema: LogFoodFromTextInputSchema,
    outputSchema: LogFoodFromTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
