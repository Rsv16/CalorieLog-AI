
'use client';

import { useState, useEffect } from 'react';
import type { FoodItem, UserProfile, MealType } from '@/lib/types';
import { CalorieSummary } from '@/components/calorie-summary';
import { FoodLog } from '@/components/food-log';
import { AddFoodDialog } from '@/components/add-food-dialog';
import { UserProfileSection } from '@/components/user-profile-section';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const initialItems: FoodItem[] = [];

const initialProfile: UserProfile = {
    currentWeight: 75,
    goalWeight: 72,
    dailyGoal: 2200,
    macroGoal: { protein: 150, carbs: 250, fat: 70 },
    age: 30,
    gender: 'male',
    height: 180,
    activityLevel: 'moderate',
};

export default function DashboardClient() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | undefined>(undefined);


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
  
  const openAddFoodDialog = (mealType?: MealType) => {
    setSelectedMealType(mealType);
    setIsAddFoodDialogOpen(true);
  };

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
        <FoodLog 
            items={foodItems} 
            onDeleteItem={handleDeleteItem} 
            onAddFood={openAddFoodDialog}
        />
      </div>
      <div className="lg:col-span-1">
        <UserProfileSection profile={userProfile} onUpdateProfile={handleUpdateProfile}/>
      </div>
       <AddFoodDialog 
            onAddFood={handleAddFood} 
            isOpen={isAddFoodDialogOpen}
            setIsOpen={setIsAddFoodDialogOpen}
            defaultMealType={selectedMealType}
      />
      <Button size="lg" className="fixed bottom-6 right-6 rounded-full shadow-lg h-16 w-16 p-0 md:h-14 md:w-auto md:px-6 bg-gradient-to-br from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity" onClick={() => openAddFoodDialog()}>
          <Plus className="h-7 w-7 md:mr-2" />
          <span className="hidden md:inline">Add Food</span>
      </Button>
    </div>
  );
}
