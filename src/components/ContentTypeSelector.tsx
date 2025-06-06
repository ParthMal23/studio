"use client";

import type { ContentType } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, Tv2, LibraryBig, ListVideo } from 'lucide-react';

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
              className={`flex flex-col items-center justify-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md hover:border-primary ${
                selectedContentType === type.value ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-border'
              }`}
            >
              <RadioGroupItem value={type.value} id={`content-type-${type.value}`} className="sr-only" />
              <type.icon className={`h-7 w-7 mb-1.5 ${selectedContentType === type.value ? 'text-primary' : 'text-foreground/70'}`} />
              <span className={`text-sm font-medium ${selectedContentType === type.value ? 'text-primary' : 'text-foreground/90'}`}>{type.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
