'use client';

import { useState, useEffect } from 'react';
import type { FoodItem, UserProfile } from '@/lib/types';
import { CalorieSummary } from '@/components/calorie-summary';
import { FoodLog } from '@/components/food-log';
import { AddFoodDialog } from '@/components/add-food-dialog';
import { UserProfileSection } from '@/components/user-profile-section';

const initialItems: FoodItem[] = [
  { id: '1', name: 'Coffee', weight: 250, calories: 5, protein: 0, carbs: 1, fat: 0, mealType: 'Breakfast' },
  { id: '2', name: 'Oatmeal with berries', weight: 200, calories: 350, protein: 10, carbs: 60, fat: 8, mealType: 'Breakfast' },
  { id: '3', name: 'Protein Shake', weight: 300, calories: 250, protein: 30, carbs: 15, fat: 7, mealType: 'Snacks' },
];

const initialProfile: UserProfile = {
    currentWeight: 75,
    goalWeight: 72,
    dailyGoal: 2200,
    macroGoal: { protein: 150, carbs: 250, fat: 70 },
};

export default function DashboardClient() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);

  useEffect(() => {
    // This effect runs once on the client after hydration,
    // preventing hydration mismatches with localStorage.
    const storedItems = localStorage.getItem('foodItems');
    if (storedItems) {
      setFoodItems(JSON.parse(storedItems));
    } else {
      setFoodItems(initialItems);
    }
    
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
    } else {
        setUserProfile(initialProfile);
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

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

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
  
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <CalorieSummary items={foodItems} userProfile={userProfile} />
        <FoodLog items={foodItems} onDeleteItem={handleDeleteItem} />
      </div>
      <div className="lg:col-span-1">
        <UserProfileSection profile={userProfile} onUpdateProfile={handleUpdateProfile}/>
      </div>
      <AddFoodDialog onAddFood={handleAddFood} />
    </div>
  );
}
