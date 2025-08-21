
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Camera, Plus, Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { FoodItem, EstimatedFoodItem, MealType } from '@/lib/types';
import { estimateAndAugmentFood } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface AddFoodDialogProps {
  onAddFood: (food: Omit<FoodItem, 'id'>[]) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  defaultMealType?: MealType;
}

const manualFormSchema = z.object({
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snacks'], { required_error: 'Please select a meal.' }),
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  weight: z.coerce.number().positive('Weight must be positive.'),
  calories: z.coerce.number().positive('Calories must be positive.'),
  protein: z.coerce.number().min(0, 'Protein cannot be negative.'),
  carbs: z.coerce.number().min(0, 'Carbs cannot be negative.'),
  fat: z.coerce.number().min(0, 'Fat cannot be negative.'),
});

function ManualFoodForm({ onAddFood, setOpen, defaultMealType }: { onAddFood: (food: Omit<FoodItem, 'id'>[]) => void; setOpen: (open: boolean) => void; defaultMealType?: MealType; }) {
  const form = useForm<z.infer<typeof manualFormSchema>>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: { name: '', weight: undefined, calories: undefined, protein: undefined, carbs: undefined, fat: undefined, mealType: defaultMealType },
  });
  
  useEffect(() => {
    form.reset({ mealType: defaultMealType, name: '', weight: undefined, calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
  }, [defaultMealType, form]);

  function onSubmit(values: z.infer<typeof manualFormSchema>) {
    onAddFood([values]);
    form.reset();
    setOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="mealType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meal</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a meal" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                  <SelectItem value="Snacks">Snacks</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Apple" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (g)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="150" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="calories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Calories</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="80" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
           <FormField
            control={form.control}
            name="protein"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Protein (g)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="carbs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carbs (g)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="20" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="fat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fat (g)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Add Food
        </Button>
      </form>
    </Form>
  );
}

function CameraEstimation({ onAddFood, setOpen, defaultMealType }: { onAddFood: (food: Omit<FoodItem, 'id'>[]) => void; setOpen: (open: boolean) => void; defaultMealType?: MealType }) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ augmentedFoodItems: EstimatedFoodItem[], totalCalories: number } | null>(null);
  const [mealType, setMealType] = useState<MealType>(defaultMealType || 'Breakfast');
  const { toast } = useToast();

  useEffect(() => {
    if (defaultMealType) {
      setMealType(defaultMealType);
    }
  }, [defaultMealType]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResults(null);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUri = reader.result as string;
      setIsLoading(true);
      try {
        const estimationResults = await estimateAndAugmentFood(dataUri);
        setResults(estimationResults);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Estimation Failed',
          description: 'Could not analyze the image. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddItems = () => {
    if (!results) return;
    const itemsToAdd = results.augmentedFoodItems
      .filter(item => item.weight && item.calories && item.protein !== undefined && item.carbs !== undefined && item.fat !== undefined)
      .map(item => ({
        name: item.foodItem,
        weight: item.weight!,
        calories: item.calories!,
        protein: item.protein!,
        carbs: item.carbs!,
        fat: item.fat!,
        mealType: mealType,
      }));
    onAddFood(itemsToAdd);
    setResults(null);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isLoading} />
      <Button asChild variant="outline" className="w-full cursor-pointer" disabled={isLoading}>
        <label htmlFor="picture">
          <Camera className="mr-2 h-4 w-4" /> Select Photo
        </label>
      </Button>

      {isLoading && (
        <div className="flex flex-col items-center justify-center space-y-2 p-8 border-2 border-dashed rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Analyzing your meal...</p>
        </div>
      )}
      
      {results && results.augmentedFoodItems.length === 0 && !isLoading && (
        <div className="p-4 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-center">No items were found. Please try another image.</p>
        </div>
      )}
      
      {results && results.augmentedFoodItems.length > 0 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
                <div className='flex justify-between items-center'>
                    <h3 className="font-semibold">Estimated Items</h3>
                    <p className="text-lg font-bold text-primary">{results.totalCalories} kcal</p>
                </div>
              <ScrollArea className="h-48 mt-2">
                <ul className="space-y-2">
                  {results.augmentedFoodItems.map((item, index) => (
                    <li key={index} className="text-sm p-2 rounded-md bg-secondary/50">
                      <p className="font-medium">{item.foodItem}</p>
                      <p className="text-muted-foreground">
                        {item.weight ? `${item.weight}g` : item.quantity || 'N/A'}, {item.calories ? `${item.calories} kcal` : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        P: {item.protein?.toFixed(0) ?? 'N/A'}g, C: {item.carbs?.toFixed(0) ?? 'N/A'}g, F: {item.fat?.toFixed(0) ?? 'N/A'}g
                      </p>
                      {item.reason && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          <Wand2 className="inline-block mr-1 h-3 w-3"/>
                          {item.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
          <Select onValueChange={(value: MealType) => setMealType(value)} defaultValue={mealType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a meal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Breakfast">Breakfast</SelectItem>
              <SelectItem value="Lunch">Lunch</SelectItem>
              <SelectItem value="Dinner">Dinner</SelectItem>
              <SelectItem value="Snacks">Snacks</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddItems} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add All to Log
          </Button>
        </div>
      )}
    </div>
  );
}

export function AddFoodDialog({ onAddFood, isOpen, setIsOpen, defaultMealType }: AddFoodDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log a New Meal</DialogTitle>
          <DialogDescription>
            Add food manually or use your camera for an estimate.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="camera">
              <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
              AI Scan
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="pt-4">
            <ManualFoodForm onAddFood={onAddFood} setOpen={setIsOpen} defaultMealType={defaultMealType} />
          </TabsContent>
          <TabsContent value="camera" className="pt-4">
            <CameraEstimation onAddFood={onAddFood} setOpen={setIsOpen} defaultMealType={defaultMealType} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
