
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { User, Target, Flame, PieChart, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface UserProfileSectionProps {
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

const profileFormSchema = z.object({
  currentWeight: z.coerce.number().positive('Must be positive.'),
  goalWeight: z.coerce.number().positive('Must be positive.'),
  dailyGoal: z.coerce.number().positive('Must be positive.'),
  macroGoal: z.object({
    protein: z.coerce.number().min(0, 'Cannot be negative.'),
    carbs: z.coerce.number().min(0, 'Cannot be negative.'),
    fat: z.coerce.number().min(0, 'Cannot be negative.'),
  }),
  age: z.coerce.number().positive('Must be positive.').optional(),
  gender: z.enum(['male', 'female']).optional(),
  height: z.coerce.number().positive('Must be positive.').optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'veryActive']).optional(),
});

const tdeeSchema = z.object({
  weight: z.coerce.number({ required_error: "Weight is required." }).positive("Weight must be positive."),
  height: z.coerce.number({ required_error: "Height is required." }).positive("Height must be positive."),
  age: z.coerce.number({ required_error: "Age is required." }).positive("Age must be positive."),
  gender: z.enum(['male', 'female'], { required_error: "Gender is required." }),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'veryActive'], { required_error: "Activity level is required." }),
});

type WeeklyGoal = 'lose1' | 'lose0.75' | 'lose0.5' | 'maintain' | 'gain0.5' | 'gain0.75' | 'gain1';

const goalAdjustments: Record<WeeklyGoal, number> = {
  'lose1': -1100,
  'lose0.75': -825,
  'lose0.5': -550,
  'maintain': 0,
  'gain0.5': 550,
  'gain0.75': 825,
  'gain1': 1100,
};

const TDEECalculator = ({ onTdeeCalculated }: { onTdeeCalculated: (tdee: number) => void }) => {
  const [maintenanceTdee, setMaintenanceTdee] = useState<number | null>(null);
  const [adjustedTdee, setAdjustedTdee] = useState<number | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>('maintain');

  const form = useForm<z.infer<typeof tdeeSchema>>({
    resolver: zodResolver(tdeeSchema),
    defaultValues: {
      weight: '' as any,
      height: '' as any,
      age: '' as any,
    },
  });

  const calculateTdee = (data: z.infer<typeof tdeeSchema>) => {
    const { weight, height, age, gender, activityLevel } = data;
    
    // Mifflin-St Jeor Equation for BMR
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const tdee = bmr * activityMultipliers[activityLevel];
    const roundedTdee = Math.round(tdee);
    setMaintenanceTdee(roundedTdee);
    setAdjustedTdee(roundedTdee + goalAdjustments[weeklyGoal]);
  };

  useEffect(() => {
    if (maintenanceTdee !== null) {
      setAdjustedTdee(maintenanceTdee + goalAdjustments[weeklyGoal]);
    }
  }, [weeklyGoal, maintenanceTdee]);
  
  const handleUseTdee = () => {
    if (adjustedTdee) {
      onTdeeCalculated(adjustedTdee);
    }
  };

  return (
    <Card className="mt-6 bg-secondary/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6" />
          <CardTitle className="text-xl font-headline">Daily Calorie Calculator</CardTitle>
        </div>
        <CardDescription>Estimate your Total Daily Energy Expenditure (TDEE).</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(calculateTdee)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 75" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
               />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 180" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 30" {...field} />
                    </FormControl>
                     <FormMessage />
                    </FormItem>
                )}
               />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                     <FormMessage />
                    </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Activity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="sedentary">Sedentary: little or no exercise</SelectItem>
                        <SelectItem value="light">Light: exercise 1-3 times/week</SelectItem>
                        <SelectItem value="moderate">Moderate: exercise 4-5 times/week</SelectItem>
                        <SelectItem value="active">Active: daily exercise or intense exercise 3-4 times/week</SelectItem>
                        <SelectItem value="veryActive">Very Active: intense exercise 6-7 times/week</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Calculate Maintenance Calories</Button>

            {maintenanceTdee !== null && (
              <div className="space-y-4">
                <FormItem>
                  <FormLabel>Weekly Goal</FormLabel>
                  <Select onValueChange={(value: WeeklyGoal) => setWeeklyGoal(value)} value={weeklyGoal}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a weekly goal..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gain1">Gain 1 kg per week (~1100 kcal surplus)</SelectItem>
                      <SelectItem value="gain0.75">Gain 0.75 kg per week (~825 kcal surplus)</SelectItem>
                      <SelectItem value="gain0.5">Gain 0.5 kg per week (~550 kcal surplus)</SelectItem>
                      <SelectItem value="maintain">Maintain weight</SelectItem>
                      <SelectItem value="lose0.5">Lose 0.5 kg per week (~550 kcal deficit)</SelectItem>
                      <SelectItem value="lose0.75">Lose 0.75 kg per week (~825 kcal deficit)</SelectItem>
                      <SelectItem value="lose1">Lose 1 kg per week (~1100 kcal deficit)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>

                {adjustedTdee !== null && (
                  <Alert className="mt-4">
                    <AlertTitle className="flex items-center justify-between">
                      <span>Suggested Goal: {adjustedTdee} kcal</span>
                      <Button size="sm" onClick={handleUseTdee}>Use This Goal</Button>
                    </AlertTitle>
                    <AlertDescription>
                      Your maintenance is {maintenanceTdee} kcal. This goal is adjusted for your selection.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};


export function UserProfileSection({ profile, onUpdateProfile }: UserProfileSectionProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: profile,
  });
  
  const dailyGoalWatcher = form.watch('dailyGoal');

  const [macroPercentages, setMacroPercentages] = useState({
    protein: 40,
    carbs: 40,
    fat: 20,
  });

  useEffect(() => {
    const dailyGoal = form.getValues('dailyGoal') || 0;
    
    const proteinGrams = Math.round((dailyGoal * (macroPercentages.protein / 100)) / 4);
    const carbsGrams = Math.round((dailyGoal * (macroPercentages.carbs / 100)) / 4);
    const fatGrams = Math.round((dailyGoal * (macroPercentages.fat / 100)) / 9);

    form.setValue('macroGoal.protein', proteinGrams, { shouldValidate: true });
    form.setValue('macroGoal.carbs', carbsGrams, { shouldValidate: true });
    form.setValue('macroGoal.fat', fatGrams, { shouldValidate: true });
  }, [dailyGoalWatcher, macroPercentages, form]);


  const handlePercentageChange = (macro: 'protein' | 'carbs' | 'fat', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    setMacroPercentages(prev => ({
      ...prev,
      [macro]: numValue,
    }));
  };
  
  const onSubmit = (values: z.infer<typeof profileFormSchema>) => {
    const totalPercentage = macroPercentages.protein + macroPercentages.carbs + macroPercentages.fat;
    if (totalPercentage !== 100) {
      toast({
        variant: 'destructive',
        title: 'Invalid Percentages',
        description: `Macro percentages must add up to 100%. Current total: ${totalPercentage}%.`,
      });
      return;
    }
    
    onUpdateProfile(values);
    toast({
        title: 'Profile Updated',
        description: 'Your goals have been successfully saved.',
    });
  };
  
  const handleTdeeCalculated = (tdee: number) => {
    form.setValue('dailyGoal', tdee, { shouldValidate: true });
    
    // Trigger form validation and then submit
    form.trigger().then(isValid => {
      if (isValid) {
        onUpdateProfile(form.getValues());
         toast({
            title: 'Goal Updated',
            description: `Your daily calorie goal is now ${tdee} kcal.`,
        });
      } else {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Please ensure all profile fields are valid before setting a new goal.',
        });
      }
    });
  };

  return (
    <Card className="shadow-md sticky top-6">
      <CardHeader>
        <div className="flex items-center gap-3">
            <User className="h-6 w-6" />
            <CardTitle className="font-headline">Your Profile & Goals</CardTitle>
        </div>
        <CardDescription>Update your personal info and nutrition targets.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> Current Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goalWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Target className="h-4 w-4 text-muted-foreground"/> Goal Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dailyGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Flame className="h-4 w-4 text-muted-foreground"/> Daily Calorie Goal (kcal)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
                 <FormLabel className="flex items-center gap-2 mb-2"><PieChart className="h-4 w-4 text-muted-foreground"/> Macro Goals</FormLabel>
                 <div className="p-4 border rounded-md bg-secondary/30 space-y-4">
                    <p className="text-sm text-muted-foreground">Set macro percentages to dynamically calculate your goals in grams.</p>
                    <div className="grid grid-cols-3 gap-4">
                        <FormItem>
                            <FormLabel className="text-xs">Protein (%)</FormLabel>
                            <FormControl>
                                <Input type="number" value={macroPercentages.protein} onChange={(e) => handlePercentageChange('protein', e.target.value)} />
                            </FormControl>
                        </FormItem>
                        <FormItem>
                            <FormLabel className="text-xs">Carbs (%)</FormLabel>
                            <FormControl>
                                <Input type="number" value={macroPercentages.carbs} onChange={(e) => handlePercentageChange('carbs', e.target.value)} />
                            </FormControl>
                        </FormItem>
                        <FormItem>
                            <FormLabel className="text-xs">Fat (%)</FormLabel>
                            <FormControl>
                                <Input type="number" value={macroPercentages.fat} onChange={(e) => handlePercentageChange('fat', e.target.value)} />
                            </FormControl>
                        </FormItem>
                    </div>
                   
                    <div className="grid grid-cols-3 gap-4 pt-2">
                        <FormField control={form.control} name="macroGoal.protein" render={({ field }) => (<FormItem><FormLabel className="text-xs">Protein (g)</FormLabel><FormControl><Input readOnly type="number" {...field} className="bg-background/50"/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="macroGoal.carbs" render={({ field }) => (<FormItem><FormLabel className="text-xs">Carbs (g)</FormLabel><FormControl><Input readOnly type="number" {...field} className="bg-background/50"/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="macroGoal.fat" render={({ field }) => (<FormItem><FormLabel className="text-xs">Fat (g)</FormLabel><FormControl><Input readOnly type="number" {...field} className="bg-background/50"/></FormControl><FormMessage /></FormItem>)} />
                    </div>
                 </div>
            </div>

            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </Form>
        <TDEECalculator onTdeeCalculated={handleTdeeCalculated} />
      </CardContent>
    </Card>
  );
}
