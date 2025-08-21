export interface FoodItem {
  id: string;
  name: string;
  weight: number; // in grams
  calories: number;
}

export interface EstimatedFoodItem {
  foodItem: string;
  quantity?: string;
  weight?: number; // in grams
  calories?: number;
  reason?: string;
}
