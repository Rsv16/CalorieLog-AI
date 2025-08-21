import type { FoodItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FoodLogProps {
  items: FoodItem[];
  onDeleteItem: (id: string) => void;
}

export function FoodLog({ items, onDeleteItem }: FoodLogProps) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Today's Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Food</TableHead>
                <TableHead className="text-right">Weight (g)</TableHead>
                <TableHead className="text-right">Calories (kcal)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.weight}</TableCell>
                    <TableCell className="text-right">{item.calories}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => onDeleteItem(item.id)} aria-label={`Delete ${item.name}`}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete item</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No food logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
