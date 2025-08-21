import type { FoodItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';

interface CalorieSummaryProps {
  items: FoodItem[];
  dailyGoal?: number;
}

export function CalorieSummary({ items, dailyGoal = 2000 }: CalorieSummaryProps) {
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const progress = dailyGoal > 0 ? (totalCalories / dailyGoal) * 100 : 0;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Today's Summary</CardTitle>
        <CardDescription>Your calorie intake for today.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center justify-around gap-6">
        <div className="relative">
          <CircularProgress value={progress} className="w-32 h-32" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-headline">{totalCalories}</span>
            <span className="text-sm text-muted-foreground">kcal</span>
          </div>
        </div>
        <div className="text-center md:text-left">
          <p className="text-muted-foreground">Daily Goal</p>
          <p className="text-2xl font-semibold">{dailyGoal} kcal</p>
        </div>
        <div className="text-center md:text-left">
            <p className="text-muted-foreground">Remaining</p>
            <p className="text-2xl font-semibold text-primary">{Math.max(0, dailyGoal - totalCalories)} kcal</p>
        </div>
      </CardContent>
    </Card>
  );
}
