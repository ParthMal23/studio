"use client";

import type { UserWeights } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SlidersHorizontal } from 'lucide-react';

interface WeightCustomizerProps {
  weights: UserWeights;
  onWeightsChange: (weights: UserWeights) => void;
}

export function WeightCustomizer({ weights, onWeightsChange }: WeightCustomizerProps) {
  const handleSliderChange = (type: keyof UserWeights, value: number[]) => {
    onWeightsChange({ ...weights, [type]: value[0] });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-accent flex items-center gap-2">
          <SlidersHorizontal className="h-6 w-6 text-primary" /> Customize Your Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="mood-weight" className="block mb-2 text-base">Mood Influence: {weights.mood}%</Label>
          <Slider
            id="mood-weight"
            min={0}
            max={100}
            step={5}
            value={[weights.mood]}
            onValueChange={(value) => handleSliderChange('mood', value)}
          />
        </div>
        <div>
          <Label htmlFor="time-weight" className="block mb-2 text-base">Time of Day Influence: {weights.time}%</Label>
          <Slider
            id="time-weight"
            min={0}
            max={100}
            step={5}
            value={[weights.time]}
            onValueChange={(value) => handleSliderChange('time', value)}
          />
        </div>
        <div>
          <Label htmlFor="history-weight" className="block mb-2 text-base">Viewing History Influence: {weights.history}%</Label>
          <Slider
            id="history-weight"
            min={0}
            max={100}
            step={5}
            value={[weights.history]}
            onValueChange={(value) => handleSliderChange('history', value)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Adjust how much each factor influences your movie recommendations. Note: These are conceptual guides for the AI.
        </p>
      </CardContent>
    </Card>
  );
}
