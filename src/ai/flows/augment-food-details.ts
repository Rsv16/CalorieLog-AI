'use server';

/**
 * @fileOverview A flow to augment food details with reasonable quantity/weight suggestions.
 *
 * - augmentFoodDetails - A function that takes food items and suggests quantity/weight values if missing.
 * - AugmentFoodDetailsInput - The input type for the augmentFoodDetails function.
 * - AugmentFoodDetailsOutput - The return type for the augmentFoodDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AugmentFoodDetailsInputSchema = z.array(
  z.object({
    foodItem: z.string().describe('The name of the food item.'),
    quantity: z.string().optional().describe('The quantity of the food item.'),
    weight: z.number().optional().describe('The weight of the food item in grams.'),
  })
);
export type AugmentFoodDetailsInput = z.infer<typeof AugmentFoodDetailsInputSchema>;

const AugmentFoodDetailsOutputSchema = z.array(
  z.object({
    foodItem: z.string().describe('The name of the food item.'),
    quantity: z.string().optional().describe('The suggested quantity of the food item.'),
    weight: z.number().optional().describe('The suggested weight of the food item in grams.'),
    reason: z.string().describe('The reasoning behind the suggested quantity or weight.'),
  })
);
export type AugmentFoodDetailsOutput = z.infer<typeof AugmentFoodDetailsOutputSchema>;

export async function augmentFoodDetails(input: AugmentFoodDetailsInput): Promise<AugmentFoodDetailsOutput> {
  return augmentFoodDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'augmentFoodDetailsPrompt',
  input: {schema: AugmentFoodDetailsInputSchema},
  output: {schema: AugmentFoodDetailsOutputSchema},
  prompt: `You are a helpful assistant designed to suggest reasonable quantities or weights for food items in a meal.

  You will be provided a list of food items, some of which may be missing quantity or weight information.
  Your task is to suggest reasonable values for these missing fields, based on typical serving sizes and common sense.
  Explain your reasoning for each suggestion.

  Here's the list of food items:
  {{#each this}}
  - Food Item: {{foodItem}}
    {{#if quantity}}
    Quantity: {{quantity}}
    {{/if}}
    {{#if weight}}
    Weight: {{weight}} grams
    {{/if}}
  {{/each}}

  Please provide a JSON array of suggestions, including the food item name, suggested quantity, suggested weight, and your reasoning.
  If quantity and weight are present, leave them alone and include the original values in the output.`,
});

const augmentFoodDetailsFlow = ai.defineFlow(
  {
    name: 'augmentFoodDetailsFlow',
    inputSchema: AugmentFoodDetailsInputSchema,
    outputSchema: AugmentFoodDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
