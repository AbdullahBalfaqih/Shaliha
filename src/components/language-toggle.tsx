
"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

type Language = "ar" | "en";

// A simple event emitter to notify other components of language change
const languageEmitter = {
  listeners: new Set<(lang: Language) => void>(),
  subscribe(callback: (lang: Language) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  emit(lang: Language) {
    this.listeners.forEach(listener => listener(lang));
  }
};

// Hook to use the language state
export function useLanguage() {
  const [language, setLanguage] = React.useState<Language>("ar");

  React.useEffect(() => {
    // Set initial language from document attribute
    const currentLang = document.documentElement.lang as Language || "ar";
    setLanguage(currentLang);

    // Subscribe to changes
    const unsubscribe = languageEmitter.subscribe(setLanguage);
    return unsubscribe;
  }, []);

  return language;
}

export function LanguageToggle() {
  const [language, setLanguage] = React.useState<Language>('ar');

  React.useEffect(() => {
     // Set initial language from document on client-side
    const initialLang = document.documentElement.lang as Language;
    setLanguage(initialLang);
  }, []);


  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    languageEmitter.emit(newLang);
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle language">
      <Globe className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">Toggle Language</span>
    </Button>
  )
}
