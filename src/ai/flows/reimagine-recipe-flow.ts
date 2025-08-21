'use server';
/**
 * @fileOverview An AI agent that reimagines a recipe to be healthier based on a user's goal.
 *
 * - reimagineRecipe - A function that handles the recipe transformation process.
 * - ReimagineRecipeInput - The input type for the reimagineRecipe function.
 * - ReimagineRecipeOutput - The return type for the reimagineRecipe function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReimagineRecipeInputSchema = z.object({
  ingredients: z.string().describe('The list of ingredients for the recipe.'),
  instructions: z.string().describe('The cooking instructions for the recipe.'),
  goal: z.enum(['lower-calorie', 'higher-protein', 'lower-fat', 'lower-carb', 'vegan', 'vegetarian']).describe('The user\'s goal for reimagining the recipe.'),
});
export type ReimagineRecipeInput = z.infer<typeof ReimagineRecipeInputSchema>;

const NutritionInfoSchema = z.object({
  calories: z.number().describe('Estimated total calories for the entire dish.'),
  protein: z.number().describe('Estimated total protein in grams.'),
  carbs: z.number().describe('Estimated total carbohydrates in grams.'),
  fat: z.number().describe('Estimated total fat in grams.'),
});

const ReimaginedRecipeSchema = z.object({
    title: z.string().describe('A new, catchy title for the reimagined recipe.'),
    description: z.string().describe('A brief, appealing description of the new recipe.'),
    ingredients: z.array(z.string()).describe('The modified list of ingredients.'),
    instructions: z.array(z.string()).describe('The modified cooking instructions.'),
    nutritionAnalysis: z.string().describe('A brief explanation of why the new recipe is healthier and aligns with the user\'s goal.'),
});


const ReimagineRecipeOutputSchema = z.object({
  originalNutrition: NutritionInfoSchema.describe('Estimated nutritional information for the original recipe.'),
  reimaginedRecipe: ReimaginedRecipeSchema,
  reimaginedNutrition: NutritionInfoSchema.describe('Estimated nutritional information for the reimagined recipe.'),
});
export type ReimagineRecipeOutput = z.infer<typeof ReimagineRecipeOutputSchema>;

export async function reimagineRecipe(input: ReimagineRecipeInput): Promise<ReimagineRecipeOutput> {
  return reimagineRecipeFlow(input);
}

const goalMappings = {
    'lower-calorie': 'lower in calories',
    'higher-protein': 'higher in protein',
    'lower-fat': 'lower in fat',
    'lower-carb': 'lower in carbohydrates',
    'vegan': 'vegan (no animal products)',
    'vegetarian': 'vegetarian (no meat)',
};

const prompt = ai.definePrompt({
  name: 'reimagineRecipePrompt',
  input: { schema: ReimagineRecipeInputSchema },
  output: { schema: ReimagineRecipeOutputSchema },
  prompt: `You are an expert recipe developer and nutritionist. A user has provided a recipe and wants you to reimagine it to be {{goal}}.

Your task is to analyze the original recipe, then create a new, healthier version that meets the user's goal.

**User's Goal:** Make the recipe {{goal}}.

**Original Recipe:**

**Ingredients:**
{{{ingredients}}}

**Instructions:**
{{{instructions}}}

---

**Your Tasks:**
1.  **Estimate Original Nutrition:** First, estimate the nutritional content (calories, protein, carbs, fat) for the entire original dish.
2.  **Reimagine the Recipe:**
    *   Rewrite the ingredients and instructions to create a delicious, modified version that aligns with the user's goal.
    *   Be specific with changes (e.g., "replace 1 cup of sour cream with 1 cup of non-fat Greek yogurt").
    *   Make sure the instructions are clear, complete, and easy to follow.
    *   Give the new recipe a catchy, appealing title and a brief description.
    *   Provide a short analysis explaining the key changes you made and why they contribute to the user's goal.
3.  **Estimate Reimagined Nutrition:** Estimate the nutritional content for your new, reimagined version of the dish.

Provide the full response in the required JSON format.
`,
});

const reimagineRecipeFlow = ai.defineFlow(
  {
    name: 'reimagineRecipeFlow',
    inputSchema: ReimagineRecipeInputSchema,
    outputSchema: ReimagineRecipeOutputSchema,
  },
  async (input) => {
    // Augment the input with a more descriptive goal for the prompt
    const descriptiveGoal = goalMappings[input.goal];
    
    const { output } = await prompt({ ...input, goal: descriptiveGoal });
    return output!;
  }
);
