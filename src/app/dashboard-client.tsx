'use client';

import { useState, useEffect } from 'react';
import type { FoodItem } from '@/lib/types';
import { CalorieSummary } from '@/components/calorie-summary';
import { FoodLog } from '@/components/food-log';
import { AddFoodDialog } from '@/components/add-food-dialog';

const initialItems: FoodItem[] = [
  { id: '1', name: 'Coffee', weight: 250, calories: 5 },
  { id: '2', name: 'Oatmeal with berries', weight: 200, calories: 350 },
  { id: '3', name: 'Protein Shake', weight: 300, calories: 250 },
];

export default function DashboardClient() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  useEffect(() => {
    // This effect runs once on the client after hydration,
    // preventing hydration mismatches with localStorage.
    const storedItems = localStorage.getItem('foodItems');
    if (storedItems) {
      setFoodItems(JSON.parse(storedItems));
    } else {
      setFoodItems(initialItems);
    }
  }, []);
  
  useEffect(() => {
    // This effect saves to localStorage whenever foodItems change.
    // It only runs on the client.
    if(foodItems.length > 0){
        localStorage.setItem('foodItems', JSON.stringify(foodItems));
    } else if (localStorage.getItem('foodItems')) {
        localStorage.removeItem('foodItems');
    }
  }, [foodItems]);

  const handleAddFood = (newFoods: Omit<FoodItem, 'id'>[]) => {
    const foodsWithIds = newFoods.map(food => ({
        ...food,
        id: new Date().toISOString() + Math.random(),
    }));
    setFoodItems(prevItems => [...prevItems, ...foodsWithIds]);
  };

  const handleDeleteItem = (id: string) => {
    setFoodItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <CalorieSummary items={foodItems} dailyGoal={2200} />
      <FoodLog items={foodItems} onDeleteItem={handleDeleteItem} />
      <AddFoodDialog onAddFood={handleAddFood} />
    </div>
  );
}
