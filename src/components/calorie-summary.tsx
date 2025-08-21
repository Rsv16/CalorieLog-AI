import type { FoodItem, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';

interface CalorieSummaryProps {
  items: FoodItem[];
  userProfile: UserProfile;
}

export function CalorieSummary({ items, userProfile }: CalorieSummaryProps) {
  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
  const totalMacros = items.reduce((totals, item) => ({
    protein: totals.protein + (item.protein || 0),
    carbs: totals.carbs + (item.carbs || 0),
    fat: totals.fat + (item.fat || 0),
  }), { protein: 0, carbs: 0, fat: 0 });

  const progress = userProfile.dailyGoal > 0 ? (totalCalories / userProfile.dailyGoal) * 100 : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">Summary</CardTitle>
        <CardDescription>Your calorie and macro intake for this day.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row items-center justify-around gap-6">
        <div className="relative">
          <CircularProgress value={progress} className="w-36 h-36" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold tracking-tighter">{totalCalories}</span>
            <span className="text-sm text-muted-foreground -mt-1">kcal</span>
          </div>
        </div>
        <div className="text-center md:text-left space-y-1">
          <p className="text-muted-foreground">Remaining</p>
          <p className="text-3xl font-bold tracking-tight text-primary">{Math.max(0, userProfile.dailyGoal - totalCalories)} kcal</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center w-full md:w-auto">
            <div>
                <p className="text-muted-foreground text-sm">Protein</p>
                <p className="font-semibold text-lg">{totalMacros.protein}g</p>
                <p className="text-xs text-muted-foreground">of {userProfile.macroGoal.protein}g</p>
            </div>
             <div>
                <p className="text-muted-foreground text-sm">Carbs</p>
                <p className="font-semibold text-lg">{totalMacros.carbs}g</p>
                <p className="text-xs text-muted-foreground">of {userProfile.macroGoal.carbs}g</p>
            </div>
             <div>
                <p className="text-muted-foreground text-sm">Fat</p>
                <p className="font-semibold text-lg">{totalMacros.fat}g</p>
                 <p className="text-xs text-muted-foreground">of {userProfile.macroGoal.fat}g</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
