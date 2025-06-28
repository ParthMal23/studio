"use client";

import type { ContentType } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, Tv2, LibraryBig, ListVideo } from 'lucide-react';
import { cn } from '@/lib/utils';

const contentTypes: { value: ContentType; label: string; icon: React.ElementType }[] = [
  { value: "MOVIES", label: "Movies", icon: Film },
  { value: "TV_SERIES", label: "TV Series", icon: Tv2 },
  { value: "BOTH", label: "Both", icon: LibraryBig },
];

interface ContentTypeSelectorProps {
  selectedContentType: ContentType;
  onContentTypeChange: (contentType: ContentType) => void;
}

export function ContentTypeSelector({ selectedContentType, onContentTypeChange }: ContentTypeSelectorProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
          <ListVideo className="h-6 w-6" /> What are you in the mood for?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedContentType}
          onValueChange={(value) => onContentTypeChange(value as ContentType)}
          className="grid grid-cols-3 gap-4"
        >
          {contentTypes.map((type) => (
            <Label
              key={type.value}
              htmlFor={`content-type-${type.value}`}
              className={cn(
                'flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors',
                selectedContentType === type.value
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent'
                  : 'border-border bg-background hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <RadioGroupItem value={type.value} id={`content-type-${type.value}`} className="sr-only" />
              <type.icon className={cn('h-7 w-7 mb-1.5', selectedContentType !== type.value && 'text-foreground/70')} />
              <span className="text-sm font-medium">{type.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
