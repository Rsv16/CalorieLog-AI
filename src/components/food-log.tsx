import type { FoodItem, MealType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FoodLogProps {
  items: FoodItem[];
  onDeleteItem: (id: string) => void;
}

const MealSection = ({ mealType, items, onDeleteItem }: { mealType: MealType, items: FoodItem[], onDeleteItem: (id: string) => void }) => {
  if (items.length === 0) return null;

  const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <AccordionItem value={mealType}>
      <AccordionTrigger className="text-lg font-semibold px-2">
        <div className="flex justify-between w-full">
          <span>{mealType}</span>
          <span className="text-primary pr-2">{totalCalories} kcal</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Food</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead className="text-right">Macros (P/C/F)</TableHead>
              <TableHead className="text-right">Calories</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{item.weight}g</TableCell>
                <TableCell className="text-right">{`${item.protein}g / ${item.carbs}g / ${item.fat}g`}</TableCell>
                <TableCell className="text-right">{item.calories}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteItem(item.id)} aria-label={`Delete ${item.name}`}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete item</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionContent>
    </AccordionItem>
  );
};

export function FoodLog({ items, onDeleteItem }: FoodLogProps) {
  const mealItems: Record<MealType, FoodItem[]> = {
    Breakfast: items.filter(i => i.mealType === 'Breakfast'),
    Lunch: items.filter(i => i.mealType === 'Lunch'),
    Dinner: items.filter(i => i.mealType === 'Dinner'),
    Snacks: items.filter(i => i.mealType === 'Snacks'),
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Today's Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
            {items.length > 0 ? (
                <Accordion type="multiple" defaultValue={['Breakfast', 'Lunch', 'Dinner', 'Snacks']} className="w-full">
                    <MealSection mealType="Breakfast" items={mealItems.Breakfast} onDeleteItem={onDeleteItem} />
                    <MealSection mealType="Lunch" items={mealItems.Lunch} onDeleteItem={onDeleteItem} />
                    <MealSection mealType="Dinner" items={mealItems.Dinner} onDeleteItem={onDeleteItem} />
                    <MealSection mealType="Snacks" items={mealItems.Snacks} onDeleteItem={onDeleteItem} />
                </Accordion>
            ) : (
                <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
                    No food logged yet.
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
