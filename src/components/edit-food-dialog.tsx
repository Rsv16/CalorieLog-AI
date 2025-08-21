
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { FoodItem } from '@/lib/types';
import type { SearchFoodOutput } from '@/ai/flows/search-food-flow';
import { searchFoodDatabase } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Search, Loader2, Replace, Utensils } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';

type FoodSearchResult = SearchFoodOutput[0];

interface EditFoodDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  foodItem: FoodItem;
  onUpdateFood: (updatedFood: FoodItem) => void;
}

export function EditFoodDialog({ isOpen, setIsOpen, foodItem, onUpdateFood }: EditFoodDialogProps) {
  const [editedFood, setEditedFood] = useState<FoodItem>(foodItem);
  const [servingUnit, setServingUnit] = useState<string>('g');
  const [servingSize, setServingSize] = useState<number>(foodItem.weight);
  const [isReplacing, setIsReplacing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchFoodOutput>([]);
  const { toast } = useToast();

  useEffect(() => {
    setEditedFood(foodItem);
    setServingSize(foodItem.weight);
    setIsReplacing(false);
    setSearchQuery('');
    setSearchResults([]);
  }, [foodItem, isOpen]);

  const handleWeightChange = (newWeight: number) => {
    const weight = isNaN(newWeight) ? 0 : newWeight;
    setServingSize(weight);
    const ratio = weight / 100;
    setEditedFood(prev => ({
      ...prev,
      weight: weight,
      calories: Math.round(prev.baseCalories * ratio),
      protein: Math.round(prev.baseProtein * ratio),
      carbs: Math.round(prev.baseCarbs * ratio),
      fat: Math.round(prev.baseFat * ratio),
    }));
  };
  
  const handleSearch = useCallback(async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchFoodDatabase(searchQuery);
      setSearchResults(results);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'Could not fetch food data. Please try again.',
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, toast]);
  
  const handleSelectReplacement = (replacement: FoodSearchResult) => {
    const ratio = editedFood.weight / 100;
    setEditedFood(prev => ({
      ...prev,
      name: replacement.name,
      baseCalories: replacement.calories,
      baseProtein: replacement.protein,
      baseCarbs: replacement.carbs,
      baseFat: replacement.fat,
      calories: Math.round(replacement.calories * ratio),
      protein: Math.round(replacement.protein * ratio),
      carbs: Math.round(replacement.carbs * ratio),
      fat: Math.round(replacement.fat * ratio),
    }));
    setIsReplacing(false);
  };
  
  const handleSaveChanges = () => {
    onUpdateFood(editedFood);
    setIsOpen(false);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Logged Food</DialogTitle>
          <DialogDescription>Adjust the serving size or replace the item.</DialogDescription>
        </DialogHeader>

        {isReplacing ? (
          <div className="space-y-4 pt-4">
             <Button variant="outline" size="sm" onClick={() => setIsReplacing(false)}>← Back to Edit</Button>
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search for a replacement..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                </div>
                <Button type="submit" disabled={isSearching || searchQuery.trim().length < 2}>
                    {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
                </Button>
            </form>
             <ScrollArea className="h-64">
                {isSearching && searchResults.length === 0 && (
                    <div className="space-y-2 pt-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                )}
                {!isSearching && searchQuery && searchResults.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                        <p>No results found for "{searchQuery}".</p>
                    </div>
                )}
                {!searchQuery && !isSearching && searchResults.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                        <Utensils className="h-8 w-8 mb-2" />
                        <p>Search for a food to replace with.</p>
                    </div>
                )}
                {!isSearching && searchResults.length > 0 && (
                    <div className="space-y-2 pt-2">
                        {searchResults.map((food, i) => (
                            <button key={i} onClick={() => handleSelectReplacement(food)} className="w-full text-left p-3 rounded-md hover:bg-secondary transition-colors">
                                <p className="font-semibold">{food.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {food.brand || `${food.calories} kcal per 100g`}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>{editedFood.name}</CardTitle>
                <CardDescription>
                  Logged to {editedFood.mealType}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="servingSize">Serving Size</Label>
                    <Input
                      id="servingSize"
                      type="number"
                      value={servingSize}
                      onChange={(e) => handleWeightChange(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="servingUnit">Unit</Label>
                     <Select value={servingUnit} onValueChange={setServingUnit} disabled>
                         <SelectTrigger id="servingUnit">
                             <SelectValue/>
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="g">g</SelectItem>
                         </SelectContent>
                     </Select>
                  </div>
                </div>

                <div className="p-4 rounded-md bg-secondary/50 text-center space-y-2">
                  <p className="text-3xl font-bold text-primary">{editedFood.calories} kcal</p>
                  <div className="flex justify-around text-sm">
                    <span>P: {editedFood.protein}g</span>
                    <span>C: {editedFood.carbs}g</span>
                    <span>F: {editedFood.fat}g</span>
                  </div>
                </div>

                <Button onClick={handleSaveChanges} className="w-full">Save Changes</Button>
                <Button onClick={() => setIsReplacing(true)} className="w-full" variant="outline">
                    <Replace className="mr-2 h-4 w-4"/>
                    Replace Food
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
