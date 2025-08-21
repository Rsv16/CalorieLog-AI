
import type { FoodItem, MealType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

interface FoodLogProps {
  items: FoodItem[];
  onDeleteItem: (id: string) => void;
  onAddFood: (mealType: MealType) => void;
  currentDate: Date;
  onDateChange: (direction: 'next' | 'prev') => void;
  animationDirection: 'left' | 'right';
}

const MealSection = ({ 
    mealType, 
    items, 
    onDeleteItem, 
    onAddFood,
    onToggleFavorite,
    favorites,
}: { 
    mealType: MealType, 
    items: FoodItem[], 
    onDeleteItem: (id: string) => void,
    onAddFood: (mealType: MealType) => void,
    onToggleFavorite: (item: FoodItem) => void,
    favorites: string[],
}) => {
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <div className="py-4">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-xl font-bold font-headline tracking-tight">{mealType}</h3>
                <p className="text-muted-foreground">{totalCalories} kcal</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onAddFood(mealType)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Food
            </Button>
        </div>
        
        {items.length > 0 ? (
             <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Food</TableHead>
                 <TableHead className="text-right">Weight</TableHead>
                 <TableHead className="text-right hidden sm:table-cell">Macros (P/C/F)</TableHead>
                 <TableHead className="text-right">Calories</TableHead>
                 <TableHead className="w-[100px]"></TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {items.map(item => (
                 <TableRow key={item.id}>
                   <TableCell className="font-medium">{item.name}</TableCell>
                   <TableCell className="text-right">{item.weight}g</TableCell>
                   <TableCell className="text-right hidden sm:table-cell">{`${item.protein}g / ${item.carbs}g / ${item.fat}g`}</TableCell>
                   <TableCell className="text-right font-semibold">{item.calories}</TableCell>
                   <TableCell className="flex justify-end gap-1">
                     <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(item)} aria-label={`Favorite ${item.name}`}>
                       <Heart className={`h-4 w-4 ${favorites.includes(item.name) ? 'text-red-500 fill-current' : ''}`} />
                       <span className="sr-only">Favorite item</span>
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => onDeleteItem(item.id)} aria-label={`Delete ${item.name}`}>
                       <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Delete item</span>
                     </Button>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
        ) : (
            <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
                No {mealType.toLowerCase()} items logged for this day.
            </div>
        )}
       
    </div>
  );
};

export function FoodLog({ items, onDeleteItem, onAddFood, currentDate, onDateChange, animationDirection }: FoodLogProps) {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteFoodItems');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites).map((fav: Omit<FoodItem, 'id' | 'date'>) => fav.name));
    }
  }, []);

  const handleToggleFavorite = (item: FoodItem) => {
    const storedFavoritesJSON = localStorage.getItem('favoriteFoodItems');
    let currentFavorites: Omit<FoodItem, 'id' | 'date'>[] = storedFavoritesJSON ? JSON.parse(storedFavoritesJSON) : [];
    
    const isFavorited = currentFavorites.some(fav => fav.name === item.name);

    if (isFavorited) {
      // Remove from favorites
      currentFavorites = currentFavorites.filter(fav => fav.name !== item.name);
      setFavorites(currentFavorites.map(fav => fav.name));
      toast({ title: `${item.name} removed from favorites.` });
    } else {
      // Add to favorites
      const { id, date, ...favItem } = item;
      currentFavorites.push(favItem);
      setFavorites(currentFavorites.map(fav => fav.name));
      toast({ title: `${item.name} added to favorites!` });
    }
    
    localStorage.setItem('favoriteFoodItems', JSON.stringify(currentFavorites));
  };
  
  const mealItems: Record<MealType, FoodItem[]> = {
    Breakfast: items.filter(i => i.mealType === 'Breakfast'),
    Lunch: items.filter(i => i.mealType === 'Lunch'),
    Dinner: items.filter(i => i.mealType === 'Dinner'),
    Snacks: items.filter(i => i.mealType === 'Snacks'),
  };

  const dateDisplay = isToday(currentDate)
    ? `Today, ${format(currentDate, 'MMMM d')}`
    : format(currentDate, 'eeee, MMMM d');

  const variants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <Card className="shadow-lg overflow-hidden">
       <CardHeader className="space-y-4">
          <div className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Daily Log</CardTitle>
            <CardDescription>Your meals and snacks for the selected day.</CardDescription>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={() => onDateChange('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold whitespace-nowrap text-center w-48">{dateDisplay}</h2>
            <Button variant="outline" size="icon" onClick={() => onDateChange('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
      </CardHeader>
      <CardContent className="divide-y divide-border">
          <AnimatePresence initial={false} custom={animationDirection} mode="wait">
             <motion.div
                key={format(currentDate, 'yyyy-MM-dd')}
                custom={animationDirection}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
              >
              <MealSection mealType="Breakfast" items={mealItems.Breakfast} onDeleteItem={onDeleteItem} onAddFood={onAddFood} onToggleFavorite={handleToggleFavorite} favorites={favorites} />
              <MealSection mealType="Lunch" items={mealItems.Lunch} onDeleteItem={onDeleteItem} onAddFood={onAddFood} onToggleFavorite={handleToggleFavorite} favorites={favorites} />
              <MealSection mealType="Dinner" items={mealItems.Dinner} onDeleteItem={onDeleteItem} onAddFood={onAddFood} onToggleFavorite={handleToggleFavorite} favorites={favorites} />
              <MealSection mealType="Snacks" items={mealItems.Snacks} onDeleteItem={onDeleteItem} onAddFood={onAddFood} onToggleFavorite={handleToggleFavorite} favorites={favorites} />
            </motion.div>
          </AnimatePresence>
      </CardContent>
    </Card>
  );
}
