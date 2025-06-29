
"use client";

import { LANGUAGES, type Language } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-accent flex items-center gap-2">
          <Languages className="h-6 w-6 text-primary" /> Select a Language
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedLanguage} onValueChange={(value) => onLanguageChange(value as Language)}>
            <SelectTrigger id="language-selector" className="w-full">
                <SelectValue placeholder="Choose a language..." />
            </SelectTrigger>
            <SelectContent>
                {LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>
                        {lang}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
