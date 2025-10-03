import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkModeSubject = new BehaviorSubject<boolean>(false);
  public isDarkMode$ = this.isDarkModeSubject.asObservable();

  constructor() {
    // Only access localStorage and window in browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // Check for saved theme preference
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.isDarkModeSubject.next(savedTheme === 'dark');
        this.applyTheme(savedTheme === 'dark');
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkModeSubject.next(prefersDark);
        this.applyTheme(prefersDark);
      }
    } else {
      // Default to light theme in SSR
      this.isDarkModeSubject.next(false);
      this.applyTheme(false);
    }
  }

  toggleTheme(): void {
    const currentTheme = this.isDarkModeSubject.value;
    const newTheme = !currentTheme;
    this.isDarkModeSubject.next(newTheme);
    this.applyTheme(newTheme);
    
    // Only save to localStorage in browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    }
  }

  isDarkMode(): boolean {
    return this.isDarkModeSubject.value;
  }

  private applyTheme(isDark: boolean): void {
    // Only access document in browser environment
    if (typeof document !== 'undefined') {
      const body = document.body;
      if (isDark) {
        body.classList.add('dark-theme', 'dark');
        body.classList.remove('light-theme');
      } else {
        body.classList.add('light-theme');
        body.classList.remove('dark-theme', 'dark');
      }
    }
  }
}
