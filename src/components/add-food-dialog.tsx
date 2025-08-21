
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { Camera, Plus, Loader2, Sparkles, Wand2, Search, Utensils } from 'lucide-react';
import type { FoodItem, EstimatedFoodItem, MealType } from '@/lib/types';
import { estimateAndAugmentFood, searchFoodDatabase } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { SearchFoodOutput } from '@/ai/flows/search-food-flow';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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

function ManualFoodForm({ onAddFood, setOpen, defaultMealType, isOpen }: { onAddFood: (food: Omit<FoodItem, 'id'>[]) => void; setOpen: (open: boolean) => void; defaultMealType?: MealType; isOpen: boolean; }) {
  const form = useForm<z.infer<typeof manualFormSchema>>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: { mealType: defaultMealType, name: '', weight: undefined, calories: undefined, protein: undefined, carbs: undefined, fat: undefined },
  });
  
  useEffect(() => {
    if (isOpen) {
      form.reset({ mealType: defaultMealType, name: '', weight: undefined, calories: undefined, protein: undefined, carbs: undefined, fat: undefined });
    }
  }, [defaultMealType, form, isOpen]);

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
          <Plus className="mr-2 h-4 w-4" /> Add Food Manually
        </Button>
      </form>
    </Form>
  );
}

function CameraEstimation({ onAddFood, setOpen, defaultMealType }: { onAddFood: (food: Omit<FoodItem, 'id'>[]) => void; setOpen: (open: boolean) => void; defaultMealType?: MealType }) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [results, setResults] = useState<{ augmentedFoodItems: EstimatedFoodItem[], totalCalories: number } | null>(null);
  const [mealType, setMealType] = useState<MealType>(defaultMealType || 'Breakfast');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();
  }, []);

  useEffect(() => {
    if (defaultMealType) {
      setMealType(defaultMealType);
    }
  }, [defaultMealType]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');
      
      setResults(null);
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
    }
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

  return (
    <div className="space-y-4">
        {!results && !isLoading && (
            <div className='relative'>
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-secondary" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />

                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Denied</AlertTitle>
                            <AlertDescription>
                                Please enable camera permissions to use this feature. You can still upload a photo.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <Button onClick={handleCapture} disabled={!hasCameraPermission || isLoading} size="lg" className="rounded-full h-16 w-16 p-0 shadow-lg">
                        <Camera className="h-7 w-7" />
                    </Button>
                </div>
            </div>
        )}

      <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isLoading} />
      <Button asChild variant="outline" className="w-full cursor-pointer" disabled={isLoading}>
        <label htmlFor="picture">
          <Camera className="mr-2 h-4 w-4" /> Or Upload a Photo
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

type FoodSearchResult = SearchFoodOutput[0];

function FoodSearch({ onAddFood, setOpen, defaultMealType, isOpen }: { onAddFood: (food: Omit<FoodItem, 'id'>[]) => void; setOpen: (open: boolean) => void; defaultMealType?: MealType; isOpen: boolean; }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchFoodOutput>([]);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [mealType, setMealType] = useState<MealType>(defaultMealType || 'Breakfast');
  const [servingUnit, setServingUnit] = useState<string>('g');
  const [servingSize, setServingSize] = useState<number>(100);
  const { toast } = useToast();
  
  const form = useForm();

  const handleSearch = useCallback(async () => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setSelectedFood(null);
    try {
      const results = await searchFoodDatabase(query);
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
  }, [query, toast]);
  
  useEffect(() => {
      if (isOpen) {
          // Reset state when dialog opens
          setQuery('');
          setSearchResults([]);
          setSelectedFood(null);
          if (defaultMealType) {
              setMealType(defaultMealType);
          } else {
              setMealType('Breakfast');
          }
      }
  }, [isOpen, defaultMealType]);

  const handleSelectFood = (food: FoodSearchResult) => {
    setSelectedFood(food);
    const defaultServing = food.servingUnits.find(u => u.name === 'g') || food.servingUnits[0];
    setServingUnit(defaultServing.name);
    setServingSize(defaultServing.grams === 1 ? 100 : 1);
  };
  
  const calculatedMacros = useMemo(() => {
    if (!selectedFood) return null;
    const unitInGrams = selectedFood.servingUnits.find(u => u.name === servingUnit)?.grams || 0;
    const totalGrams = unitInGrams * servingSize;
    const ratio = totalGrams / 100;
    return {
        name: selectedFood.name,
        weight: Math.round(totalGrams),
        calories: Math.round(selectedFood.calories * ratio),
        protein: Math.round(selectedFood.protein * ratio),
        carbs: Math.round(selectedFood.carbs * ratio),
        fat: Math.round(selectedFood.fat * ratio),
        mealType: mealType
    };
  }, [selectedFood, servingUnit, servingSize, mealType]);

  const handleAddFood = () => {
    if (!calculatedMacros) return;
    onAddFood([calculatedMacros]);
    setOpen(false);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  if (selectedFood && calculatedMacros) {
    return (
        <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => setSelectedFood(null)}>← Back to Search</Button>
            <Card>
                <CardHeader>
                    <CardTitle>{selectedFood.name}</CardTitle>
                    <CardDescription>{selectedFood.brand || 'Generic'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Form {...form}>
                     <div className="grid grid-cols-2 gap-4">
                        <FormItem>
                            <FormLabel>Serving Size</FormLabel>
                             <FormControl>
                                <Input type="number" value={servingSize} onChange={e => setServingSize(parseFloat(e.target.value) || 0)} />
                             </FormControl>
                        </FormItem>
                         <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select onValueChange={setServingUnit} value={servingUnit}>
                                <FormControl>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {selectedFood.servingUnits.map(unit => (
                                        <SelectItem key={unit.name} value={unit.name}>{unit.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                     </div>
                    </Form>
                    <div className="p-4 rounded-md bg-secondary/50 text-center space-y-2">
                        <p className="text-3xl font-bold text-primary">{calculatedMacros.calories} kcal</p>
                        <div className="flex justify-around text-sm">
                            <span>P: {calculatedMacros.protein}g</span>
                            <span>C: {calculatedMacros.carbs}g</span>
                            <span>F: {calculatedMacros.fat}g</span>
                        </div>
                    </div>
                    <Select onValueChange={(v: MealType) => setMealType(v)} value={mealType}>
                        <SelectTrigger><SelectValue placeholder="Select a meal" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Breakfast">Breakfast</SelectItem>
                            <SelectItem value="Lunch">Lunch</SelectItem>
                            <SelectItem value="Dinner">Dinner</SelectItem>
                            <SelectItem value="Snacks">Snacks</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAddFood} className="w-full">
                        <Plus className="mr-2 h-4 w-4"/> Add to {mealType}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-4">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="e.g., 'scrambled eggs'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
            </div>
            <Button type="submit" disabled={isSearching || query.trim().length < 2}>
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
            </Button>
        </form>

      <ScrollArea className="h-64">
        {isSearching && searchResults.length === 0 && (
            <div className="space-y-2 pt-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        )}
        {!isSearching && query && searchResults.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <p>No results found for "{query}".</p>
            </div>
        )}
        {!query && !isSearching && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <Utensils className="h-8 w-8 mb-2" />
                <p>Search for a food to begin.</p>
            </div>
        )}
        {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2 pt-2">
                {searchResults.map((food, i) => (
                    <button key={i} onClick={() => handleSelectFood(food)} className="w-full text-left p-3 rounded-md hover:bg-secondary transition-colors">
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
  );
}

export function AddFoodDialog({ onAddFood, isOpen, setIsOpen, defaultMealType }: AddFoodDialogProps) {
  const [activeTab, setActiveTab] = useState('search');
  
  const [mealType, setMealType] = useState<MealType | undefined>(defaultMealType);

  useEffect(() => {
    if (isOpen) {
      setMealType(defaultMealType);
    }
  }, [isOpen, defaultMealType]);

  useEffect(() => {
      if (!isOpen) {
          // Reset to search tab when dialog is closed
          setActiveTab('search');
      }
  }, [isOpen]);
  
  const handleAddFoodWrapper = (food: Omit<FoodItem, 'id'>[]) => {
    const foodWithMealType = food.map(f => ({ ...f, mealType: f.mealType || mealType || 'Breakfast' }));
    onAddFood(foodWithMealType);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log a New Meal</DialogTitle>
           <DialogDescription>
            Search our database, scan with AI, or enter manually.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">
              <Search className="mr-2 h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="camera">
              <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
              AI Scan
            </TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
           <TabsContent value="search" className="pt-4">
            <FoodSearch onAddFood={handleAddFoodWrapper} setOpen={setIsOpen} defaultMealType={mealType} isOpen={isOpen}/>
           </TabsContent>
          <TabsContent value="camera" className="pt-4">
            <CameraEstimation onAddFood={handleAddFoodWrapper} setOpen={setIsOpen} defaultMealType={mealType} />
          </TabsContent>
          <TabsContent value="manual" className="pt-4">
            <ManualFoodForm onAddFood={handleAddFoodWrapper} setOpen={setIsOpen} defaultMealType={mealType} isOpen={isOpen} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
