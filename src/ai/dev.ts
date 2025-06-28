
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-movie-recommendations.ts';
import '@/ai/flows/analyze-watch-patterns.ts';
import '@/ai/flows/generate-group-compromise-recommendations.ts';
import '@/ai/flows/generate-text-query-recommendations.ts';
import '@/ai/flows/generate-surprise-recommendations.ts';

