
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { User, Target, Flame, PieChart, Calculator, RefreshCw } from 'lucide-react';
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
  // Fields for TDEE calculator
  age: z.coerce.number().positive('Must be positive.').optional(),
  gender: z.enum(['male', 'female']).optional(),
  height: z.coerce.number().positive('Must be positive.').optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'veryActive']).optional(),
});

const TDEECalculator = ({ onTdeeCalculated }: { onTdeeCalculated: (tdee: number) => void }) => {
  const [tdeeResult, setTdeeResult] = useState<number | null>(null);
  const form = useForm({
    defaultValues: {
      weight: 0,
      height: 0,
      age: 0,
      gender: 'male' as 'male' | 'female',
      activityLevel: 'sedentary' as 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive',
    },
  });

  const calculateTdee = (data: typeof form.getValues) => {
    const { weight, height, age, gender, activityLevel } = data;
    if (!weight || !height || !age) {
        return;
    }
    
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
    setTdeeResult(roundedTdee);
  };
  
  const handleUseTdee = () => {
    if (tdeeResult) {
      onTdeeCalculated(tdeeResult);
      setTdeeResult(null); // Reset after using
    }
  };
  
  // Trigger calculation whenever a value changes
  const watchedValues = form.watch();
  useState(() => {
    calculateTdee(watchedValues);
  });

  return (
    <Card className="mt-6 bg-secondary/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6" />
          <CardTitle className="text-xl">Daily Calorie Calculator</CardTitle>
        </div>
        <CardDescription>Estimate your Total Daily Energy Expenditure (TDEE).</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onChange={form.handleSubmit(calculateTdee)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
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
                      <Input type="number" {...field} />
                    </FormControl>
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
                        <Input type="number" {...field} />
                    </FormControl>
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
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>
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
                        <SelectValue />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                        <SelectItem value="light">Lightly active (light exercise/sports 1-3 days/week)</SelectItem>
                        <SelectItem value="moderate">Moderately active (moderate exercise/sports 3-5 days/week)</SelectItem>
                        <SelectItem value="active">Very active (hard exercise/sports 6-7 days a week)</SelectItem>
                        <SelectItem value="veryActive">Super active (very hard exercise/physical job)</SelectItem>
                    </SelectContent>
                    </Select>
                </FormItem>
              )}
            />

            {tdeeResult && (
              <Alert>
                  <AlertTitle className="flex items-center justify-between">
                      <span>Estimated Goal: {tdeeResult} kcal</span>
                      <Button size="sm" onClick={handleUseTdee}>Use This Goal</Button>
                  </AlertTitle>
              </Alert>
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

  const [macroPercentages, setMacroPercentages] = useState({
    protein: 40,
    carbs: 40,
    fat: 20,
  });

  const handlePercentageChange = (macro: 'protein' | 'carbs' | 'fat', value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setMacroPercentages(prev => ({
      ...prev,
      [macro]: numValue,
    }));
  };

  const calculateMacrosFromPercentages = () => {
    const totalPercentage = macroPercentages.protein + macroPercentages.carbs + macroPercentages.fat;
    if (totalPercentage !== 100) {
      toast({
        variant: 'destructive',
        title: 'Invalid Percentages',
        description: `Macro percentages must add up to 100. Current total: ${totalPercentage}%.`,
      });
      return;
    }

    const dailyGoal = form.getValues('dailyGoal');
    const proteinGrams = Math.round((dailyGoal * (macroPercentages.protein / 100)) / 4);
    const carbsGrams = Math.round((dailyGoal * (macroPercentages.carbs / 100)) / 4);
    const fatGrams = Math.round((dailyGoal * (macroPercentages.fat / 100)) / 9);

    form.setValue('macroGoal.protein', proteinGrams);
    form.setValue('macroGoal.carbs', carbsGrams);
    form.setValue('macroGoal.fat', fatGrams);

    toast({
        title: 'Macros Calculated',
        description: `Goals updated: ${proteinGrams}g P, ${carbsGrams}g C, ${fatGrams}g F. Save to confirm.`,
    });
  };

  const onSubmit = (values: z.infer<typeof profileFormSchema>) => {
    onUpdateProfile(values);
    toast({
        title: 'Profile Updated',
        description: 'Your goals have been successfully saved.',
    });
  };

  return (
    <Card className="shadow-md sticky top-6">
      <CardHeader>
        <div className="flex items-center gap-3">
            <User className="h-6 w-6" />
            <CardTitle>Your Profile & Goals</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Set macro percentages based on your calorie goal.</p>
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
                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={calculateMacrosFromPercentages}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Calculate Macros (grams)
                    </Button>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                        <FormField control={form.control} name="macroGoal.protein" render={({ field }) => (<FormItem><FormLabel className="text-xs">Protein (g)</FormLabel><FormControl><Input readOnly type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="macroGoal.carbs" render={({ field }) => (<FormItem><FormLabel className="text-xs">Carbs (g)</FormLabel><FormControl><Input readOnly type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="macroGoal.fat" render={({ field }) => (<FormItem><FormLabel className="text-xs">Fat (g)</FormLabel><FormControl><Input readOnly type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                 </div>
            </div>

            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </Form>
        <TDEECalculator onTdeeCalculated={(tdee) => form.setValue('dailyGoal', tdee)} />
      </CardContent>
    </Card>
  );
}
