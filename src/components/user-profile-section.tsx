import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { User, Target, Flame, PieChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
});

export function UserProfileSection({ profile, onUpdateProfile }: UserProfileSectionProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profile,
  });

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
                 <FormLabel className="flex items-center gap-2 mb-2"><PieChart className="h-4 w-4 text-muted-foreground"/> Macro Goals (g)</FormLabel>
                 <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="macroGoal.protein"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Protein</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="macroGoal.carbs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Carbs</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="macroGoal.fat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Fat</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
            </div>

            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
