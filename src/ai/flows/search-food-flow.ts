'use server';
/**
 * @fileOverview A flow that searches a simulated food database using AI.
 *
 * - searchFood - A function that returns nutritional information for a given food query.
 * - SearchFoodInput - The input type for the searchFood function.
 * - SearchFoodOutput - The return type for the searchFood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchFoodInputSchema = z.object({
  query: z.string().describe('The food item to search for, e.g., "apple" or "scrambled eggs".'),
});
export type SearchFoodInput = z.infer<typeof SearchFoodInputSchema>;

const ServingUnitSchema = z.object({
  name: z.string().describe('The name of the serving unit, e.g., "g", "oz", "cup", "large", "slice".'),
  grams: z.number().describe('The equivalent weight of this serving unit in grams.'),
});

const FoodSearchResultSchema = z.object({
    name: z.string().describe('The common name of the food item.'),
    brand: z.string().optional().describe('The brand name, if applicable.'),
    calories: z.number().describe('The number of calories per 100g serving.'),
    protein: z.number().describe('Grams of protein per 100g serving.'),
    carbs: z.number().describe('Grams of carbohydrates per 100g serving.'),
    fat: z.number().describe('Grams of fat per 100g serving.'),
    servingUnits: z.array(ServingUnitSchema).describe('A list of common serving units and their gram equivalents for this food.'),
});

const SearchFoodOutputSchema = z.array(FoodSearchResultSchema);

export type SearchFoodOutput = z.infer<typeof SearchFoodOutputSchema>;

export async function searchFood(input: SearchFoodInput): Promise<SearchFoodOutput> {
  return searchFoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchFoodPrompt',
  input: { schema: SearchFoodInputSchema },
  output: { schema: SearchFoodOutputSchema },
  prompt: `You are a comprehensive, verified nutritional database.
  A user is searching for a food item to log in their calorie tracking app.
  Provide a list of the most likely food items matching their query: "{{query}}".

  For each food item, provide the following information:
  - The common name of the food.
  - The brand, if it's a branded product (e.g., "Trader Joe's").
  - Detailed macronutrient information (calories, protein, carbs, fat) per 100g serving.
  - A list of various common serving units (like "g", "cup", "oz", "slice", "medium", "large") and their equivalent weight in grams. Always include a "g" serving unit with a weight of 1 gram.

  Return at least 3, but no more than 8 results. If the query is very specific, one result is fine.
  Ensure the output is a valid JSON array that adheres to the SearchFoodOutputSchema.`,
});

const searchFoodFlow = ai.defineFlow(
  {
    name: 'searchFoodFlow',
    inputSchema: SearchFoodInputSchema,
    outputSchema: SearchFoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
