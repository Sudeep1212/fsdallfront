import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    // Redirect to home page with a flag to show login popup
    router.navigate(['/'], { 
      queryParams: { 
        returnUrl: state.url,
        showLogin: 'true',
        feature: getFeatureFromUrl(state.url)
      } 
    });
    return false;
  }
};

function getFeatureFromUrl(url: string): string {
  if (url.includes('/calendar')) {
    return 'calendar';
  } else if (url.includes('/results')) {
    return 'results';
  } else if (url.includes('/event-registration')) {
    return 'registration';
  } else if (url.includes('/') || url === '/') {
    return 'comments';
  }
  return 'feature';
}