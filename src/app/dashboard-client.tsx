
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { FoodItem, UserProfile, MealType } from '@/lib/types';
import { CalorieSummary } from '@/components/calorie-summary';
import { FoodLog } from '@/components/food-log';
import { AddFoodDialog } from '@/components/add-food-dialog';
import { UserProfileSection } from '@/components/user-profile-section';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays, isToday, parseISO } from 'date-fns';

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

// Helper to format date to 'yyyy-MM-dd'
const getFormattedDate = (date: Date): string => format(date, 'yyyy-MM-dd');

export default function DashboardClient() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const storedItems = localStorage.getItem('foodItems');
    if (storedItems) {
        try {
            // Ensure dates are parsed correctly
            const parsedItems = JSON.parse(storedItems).map((item: FoodItem) => ({
                ...item,
                date: item.date ? format(parseISO(item.date), 'yyyy-MM-dd') : getFormattedDate(new Date()),
            }));
            setFoodItems(parsedItems);
        } catch (e) {
            setFoodItems(initialItems);
        }
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
    if (foodItems.length > 0) {
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

  const handleAddFood = (newFoods: Omit<FoodItem, 'id' | 'date'>[]) => {
    const formattedDate = getFormattedDate(currentDate);
    const foodsWithIdsAndDate = newFoods.map(food => ({
        ...food,
        id: new Date().toISOString() + Math.random(),
        date: formattedDate,
    }));
    setFoodItems(prevItems => [...prevItems, ...foodsWithIdsAndDate]);
  };

  const handleDeleteItem = (id: string) => {
    setFoodItems(prevItems => prevItems.filter(item => item.id !== id));
  };
  
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleDateChange = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const itemsForSelectedDate = useMemo(() => {
    const formattedDate = getFormattedDate(currentDate);
    return foodItems.filter(item => item.date === formattedDate);
  }, [foodItems, currentDate]);
  
  const dateDisplay = isToday(currentDate)
    ? `Today, ${format(currentDate, 'MMMM d')}`
    : format(currentDate, 'eeee, MMMM d');

  return (
    <div className="container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-center items-center gap-4 my-4">
          <Button variant="outline" size="icon" onClick={() => handleDateChange('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-bold whitespace-nowrap">{dateDisplay}</h2>
          <Button variant="outline" size="icon" onClick={() => handleDateChange('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <CalorieSummary items={itemsForSelectedDate} userProfile={userProfile} />
        <FoodLog 
            items={itemsForSelectedDate} 
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
