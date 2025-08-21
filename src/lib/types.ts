
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
  date: string; // YYYY-MM-DD format
  // Base macros per 100g for recalculation
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
}

export type WeeklyGoal = 'lose1' | 'lose0.75' | 'lose0.5' | 'maintain' | 'gain0.5' | 'gain0.75' | 'gain1';


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
  maintenanceCalories?: number;
  weeklyGoal?: WeeklyGoal;
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

    
