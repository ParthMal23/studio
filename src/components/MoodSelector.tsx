
"use client";

import type { Mood } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile, Frown, Meh, Zap, SmilePlus, ShieldQuestion, Coffee, Compass, Heart } from 'lucide-react';

const moods: { value: Mood; label: string; icon: React.ElementType }[] = [
  { value: "Happy", label: "Happy", icon: Smile },
  { value: "Sad", label: "Sad", icon: Frown },
  { value: "Goofy", label: "Goofy", icon: SmilePlus },
  { value: "Excited", label: "Excited", icon: Zap },
  { value: "Relaxed", label: "Relaxed", icon: Coffee },
  { value: "Adventurous", label: "Adventurous", icon: Compass },
  { value: "Romantic", label: "Romantic", icon: Heart },
  { value: "Neutral", label: "Neutral", icon: Meh },
];

interface MoodSelectorProps {
  selectedMood: Mood;
  onMoodChange: (mood: Mood) => void;
}

export function MoodSelector({ selectedMood, onMoodChange }: MoodSelectorProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
          <ShieldQuestion className="h-6 w-6" /> How are you feeling?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMood}
          onValueChange={(value) => onMoodChange(value as Mood)}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        >
          {moods.map((mood) => (
            <Label
              key={mood.value}
              htmlFor={`mood-${mood.value}`}
              className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md hover:border-primary ${
                selectedMood === mood.value ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border'
              }`}
            >
              <RadioGroupItem value={mood.value} id={`mood-${mood.value}`} className="sr-only" />
              <mood.icon className={`h-8 w-8 mb-2 ${selectedMood === mood.value ? 'text-primary' : 'text-foreground/70'}`} />
              <span className={`text-sm font-medium ${selectedMood === mood.value ? 'text-primary' : 'text-foreground/90'}`}>{mood.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
