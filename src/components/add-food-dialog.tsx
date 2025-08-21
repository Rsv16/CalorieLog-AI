'use client';

import { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Camera, Plus, Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { FoodItem, EstimatedFoodItem } from '@/lib/types';
import { estimateAndAugmentFood } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';

interface AddFoodDialogProps {
  onAddFood: (food: Omit<FoodItem, 'id'>[]) => void;
}

const manualFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  weight: z.coerce.number().positive('Weight must be positive.'),
  calories: z.coerce.number().positive('Calories must be positive.'),
});

function ManualFoodForm({ onAddFood, setOpen }: { onAddFood: (food: Omit<FoodItem, 'id'>[]) => void; setOpen: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof manualFormSchema>>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: { name: '', weight: 0, calories: 0 },
  });

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
              <FormLabel>Calories (kcal)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="80" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Add Food
        </Button>
      </form>
    </Form>
  );
}

function CameraEstimation({ onAddFood, setOpen }: { onAddFood: (food: Omit<FoodItem, 'id'>[]) => void; setOpen: (open: boolean) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ augmentedFoodItems: EstimatedFoodItem[], totalCalories: number } | null>(null);
  const { toast } = useToast();

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
      .filter(item => item.weight && item.calories)
      .map(item => ({
        name: item.foodItem,
        weight: item.weight!,
        calories: item.calories!,
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
                        {item.weight ? `${item.weight}g` : item.quantity || 'N/A'}, {item.calories ? `${item.calories} kcal` : 'N/A calories'}
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
          <Button onClick={handleAddItems} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add All to Log
          </Button>
        </div>
      )}
    </div>
  );
}


export function AddFoodDialog({ onAddFood }: AddFoodDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 w-14 p-0 md:w-auto md:px-6">
          <Plus className="h-6 w-6 md:mr-2" />
          <span className="hidden md:inline">Add Food</span>
        </Button>
      </DialogTrigger>
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
              <Sparkles className="mr-2 h-4 w-4 text-accent-foreground/50" />
              AI Scan
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="pt-4">
            <ManualFoodForm onAddFood={onAddFood} setOpen={setOpen} />
          </TabsContent>
          <TabsContent value="camera" className="pt-4">
            <CameraEstimation onAddFood={onAddFood} setOpen={setOpen} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
