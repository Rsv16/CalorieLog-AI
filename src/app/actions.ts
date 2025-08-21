'use server';

import { augmentFoodDetails } from '@/ai/flows/augment-food-details';
import { estimateCaloriesFromImage } from '@/ai/flows/estimate-calories-from-image';
import { searchFood } from '@/ai/flows/search-food-flow';
import type { AugmentFoodDetailsInput } from '@/ai/flows/augment-food-details';
import type { EstimatedFoodItem } from '@/lib/types';
import type { SearchFoodOutput } from '@/ai/flows/search-food-flow';


export async function estimateAndAugmentFood(photoDataUri: string): Promise<{ augmentedFoodItems: EstimatedFoodItem[], totalCalories: number }> {
  try {
    const estimation = await estimateCaloriesFromImage({ photoDataUri });

    const foodItemsToAugment: AugmentFoodDetailsInput = estimation.foodItems.map(item => ({
      foodItem: item.name,
      weight: item.weightGrams,
    }));
    
    if (foodItemsToAugment.length === 0) {
      return { augmentedFoodItems: [], totalCalories: 0 };
    }

    const augmentedFoodItems = await augmentFoodDetails(foodItemsToAugment);
    
    // Combine augmented data with original calorie estimates
    const finalFoodItems = augmentedFoodItems.map(augmentedItem => {
        const originalItem = estimation.foodItems.find(item => item.name === augmentedItem.foodItem);
        return {
            ...augmentedItem,
            calories: originalItem?.calories,
            protein: originalItem?.protein,
            carbs: originalItem?.carbs,
            fat: originalItem?.fat,
        };
    });

    return { augmentedFoodItems: finalFoodItems, totalCalories: estimation.totalCalories };
  } catch (error) {
    console.error('Error in AI processing:', error);
    throw new Error('Failed to estimate calories from the image.');
  }
}

export async function searchFoodDatabase(query: string): Promise<SearchFoodOutput> {
  try {
    const results = await searchFood({ query });
    return results;
  } catch (error) {
    console.error('Error searching food database:', error);
    throw new Error('Failed to search for food.');
  }
}
