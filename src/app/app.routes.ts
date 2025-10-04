import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { SupportComponent } from './pages/support/support.component';
import { FeedbackComponent } from './pages/feedback/feedback.component';
import { ResultsComponent } from './pages/results/results.component';
import { EventRegistrationComponent } from './pages/event-registration/event-registration.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { AdminEventsComponent } from './pages/admin/admin-events/admin-events.component';
import { AdminBudgetsComponent } from './pages/admin/admin-budgets/admin-budgets.component';
import { AdminDepartmentsComponent } from './pages/admin/admin-departments/admin-departments.component';
import { AdminResultsComponent } from './pages/admin/admin-results/admin-results.component';
import { AdminParticipationsComponent } from './pages/admin/admin-participations/admin-participations.component';
import { AdminRegistrationsComponent } from './pages/admin/admin-registrations/admin-registrations.component';
import { AdminFeedbacksComponent } from './pages/admin/admin-feedbacks/admin-feedbacks.component';
import { AdminUsersComponent } from './pages/admin/admin-users/admin-users.component';
import { AdminAdminsComponent } from './pages/admin/admin-admins/admin-admins.component';
import { AdminCommentsComponent } from './pages/admin/admin-comments/admin-comments.component';
import { AdminHelpComponent } from './pages/admin/admin-help/admin-help.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'about', component: AboutComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'support', component: SupportComponent },
  { path: 'feedback', component: FeedbackComponent },
  { 
    path: 'event-registration/:id', 
    component: EventRegistrationComponent,
    data: { renderMode: 'ssr' } // Enable SSR for this dynamic route
  },
  { 
    path: 'results', 
    component: ResultsComponent, 
    canActivate: [authGuard] 
  },
  // Admin routes
  { 
    path: 'admin', 
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'events', component: AdminEventsComponent },
      { path: 'budgets', component: AdminBudgetsComponent },
      { path: 'departments', component: AdminDepartmentsComponent },
      { path: 'results', component: AdminResultsComponent },
      { path: 'participations', component: AdminParticipationsComponent },
      { path: 'registrations', component: AdminRegistrationsComponent },
      { path: 'feedbacks', component: AdminFeedbacksComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'admins', component: AdminAdminsComponent },
      { path: 'comments', component: AdminCommentsComponent },
      { path: 'help', component: AdminHelpComponent }
    ]
  },
  // Fallback route - must be last
  { path: '**', redirectTo: '' }
];
