'use server';
/**
 * @fileOverview An AI agent that estimates the calorie and macronutrient content of a meal from an image.
 *
 * - estimateCaloriesFromImage - A function that handles the calorie estimation process.
 * - EstimateCaloriesFromImageInput - The input type for the estimateCaloriesFromImage function.
 * - EstimateCaloriesFromImageOutput - The return type for the estimateCaloriesFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateCaloriesFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EstimateCaloriesFromImageInput = z.infer<typeof EstimateCaloriesFromImageInputSchema>;

const FoodItemSchema = z.object({
  name: z.string().describe('The name of the food item.'),
  weightGrams: z.number().optional().describe('The weight of the food item in grams.'),
  calories: z.number().describe('The estimated calorie content of the food item.'),
  protein: z.number().describe('The estimated protein content in grams.'),
  carbs: z.number().describe('The estimated carbohydrate content in grams.'),
  fat: z.number().describe('The estimated fat content in grams.'),
});

const EstimateCaloriesFromImageOutputSchema = z.object({
  foodItems: z.array(FoodItemSchema).describe('A list of food items identified in the image with their estimated calorie and macronutrient content.'),
  totalCalories: z.number().describe('The total estimated calorie content of the meal.'),
});
export type EstimateCaloriesFromImageOutput = z.infer<typeof EstimateCaloriesFromImageOutputSchema>;

export async function estimateCaloriesFromImage(input: EstimateCaloriesFromImageInput): Promise<EstimateCaloriesFromImageOutput> {
  return estimateCaloriesFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateCaloriesFromImagePrompt',
  input: {schema: EstimateCaloriesFromImageInputSchema},
  output: {schema: EstimateCaloriesFromImageOutputSchema},
  prompt: `You are an AI assistant specialized in estimating the calorie and macronutrient content of meals from images.

  Analyze the image and identify the food items present. For each item, estimate its calorie content, macronutrients (protein, carbs, fat), and, if possible, its weight in grams.
  If the weight is not obvious from the image, provide a reasonable suggestion based on common serving sizes.

  Present the results as a list of food items with their names, estimated weights (if available), and estimated calorie and macronutrient content. Also provide a total calorie estimate for the entire meal.

  Ensure that the output is formatted as a valid JSON object that adheres to the EstimateCaloriesFromImageOutputSchema.

  Here is the image of the meal: {{media url=photoDataUri}}`,
});

const estimateCaloriesFromImageFlow = ai.defineFlow(
  {
    name: 'estimateCaloriesFromImageFlow',
    inputSchema: EstimateCaloriesFromImageInputSchema,
    outputSchema: EstimateCaloriesFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
