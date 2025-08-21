
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface Macros {
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
}

export interface FoodItem extends Macros {
  id: string;
  name: string;
  weight: number; // in grams
  calories: number;
  mealType: MealType;
}

export interface UserProfile {
  currentWeight: number; // in kg
  goalWeight: number; // in kg
  dailyGoal: number; // in kcal
  macroGoal: Macros;
  // For TDEE
  age?: number;
  gender?: 'male' | 'female';
  height?: number; // in cm
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
}

export interface EstimatedFoodItem {
  foodItem: string;
  quantity?: string;
  weight?: number; // in grams
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  reason?: string;
}

    