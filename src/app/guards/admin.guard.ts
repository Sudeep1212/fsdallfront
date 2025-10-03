import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/admin-login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if user has admin role
  const currentUser = authService.getCurrentUser();
  if (currentUser && currentUser.role === 'ADMIN') {
    return true;
  } else {
    // User is logged in but not an admin
    router.navigate(['/auth/admin-login'], {
      queryParams: { 
        error: 'insufficient_privileges',
        message: 'Administrator access required'
      }
    });
    return false;
  }
};