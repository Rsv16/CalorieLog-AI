import { config } from 'dotenv';
config();

import '@/ai/flows/augment-food-details.ts';
import '@/ai/flows/estimate-calories-from-image.ts';
import '@/ai/flows/search-food-flow.ts';
import '@/ai/flows/reimagine-recipe-flow.ts';
