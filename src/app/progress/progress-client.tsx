
'use client';

import { useState, useEffect } from 'react';
import type { FoodItem, UserProfile } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Area, XAxis, YAxis, CartesianGrid, AreaChart, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { subDays, format, parseISO } from 'date-fns';
import { TrendingUp, PieChart as PieChartIcon, Target } from 'lucide-react';

const initialProfile: UserProfile = {
    currentWeight: 75,
    goalWeight: 72,
    dailyGoal: 2200,
    macroGoal: { protein: 150, carbs: 250, fat: 70 },
};

export default function ProgressClient() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [weightHistory, setWeightHistory] = useState<{ date: string; weight: number }[]>([]);

  useEffect(() => {
    const storedItems = localStorage.getItem('foodItems');
    if (storedItems) {
      const parsedItems: FoodItem[] = JSON.parse(storedItems).map((item: FoodItem) => ({
          ...item,
          date: item.date ? format(parseISO(item.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      }));
      setFoodItems(parsedItems);
    }
    
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setUserProfile(profile);
      // Create a mock weight history based on profile for demonstration
      setWeightHistory([
          { date: format(subDays(new Date(), 7), 'yyyy-MM-dd'), weight: profile.currentWeight + 1.5 },
          { date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), weight: profile.currentWeight + 0.5 },
          { date: format(new Date(), 'yyyy-MM-dd'), weight: profile.currentWeight },
      ]);
    }
  }, []);

  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const itemsForDate = foodItems.filter(item => item.date === formattedDate);
    
    const totals = itemsForDate.reduce((acc, item) => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      date: format(date, 'MMM d'),
      ...totals
    };
  }).reverse();

  const averageMacros = foodItems.reduce((acc, item) => {
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      return acc;
  }, { protein: 0, carbs: 0, fat: 0});

  const totalMacros = averageMacros.protein + averageMacros.carbs + averageMacros.fat;
  
  const macroChartData = totalMacros > 0 ? [
    { name: 'Protein', value: averageMacros.protein, fill: 'hsl(var(--chart-1))' },
    { name: 'Carbs', value: averageMacros.carbs, fill: 'hsl(var(--chart-2))' },
    { name: 'Fat', value: averageMacros.fat, fill: 'hsl(var(--chart-3))' },
  ] : [];

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Your Progress & Trends</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
             <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6" />
                <CardTitle>Weight Trend</CardTitle>
             </div>
            <CardDescription>Your weight changes over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-64">
              <AreaChart data={weightHistory} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis unit="kg" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Area type="monotone" dataKey="weight" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
                <Target className="h-6 w-6" />
                <CardTitle>Calorie Intake (Last 7 Days)</CardTitle>
            </div>
            <CardDescription>Your daily calorie intake vs. your goal of {userProfile.dailyGoal} kcal.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={{}} className="h-64">
              <BarChart data={last7DaysData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false}/>
                <YAxis tickLine={false} axisLine={false}/>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="calories" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
                <PieChartIcon className="h-6 w-6" />
                <CardTitle>Average Macronutrient Distribution</CardTitle>
            </div>
            <CardDescription>Average breakdown of your protein, carbs, and fat intake.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {totalMacros > 0 ? (
                <ChartContainer config={{}} className="h-64 aspect-square">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie data={macroChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                         {macroChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
                </ChartContainer>
            ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Log some food to see your macro distribution.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
