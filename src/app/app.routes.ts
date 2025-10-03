import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { SupportComponent } from './pages/support/support.component';
import { FeedbackComponent } from './pages/feedback/feedback.component';
import { ResultsComponent } from './pages/results/results.component';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { SigninComponent } from './pages/auth/signin/signin.component';
import { StudentLoginComponent } from './pages/auth/student-login/student-login.component';
import { AdminLoginComponent } from './pages/auth/admin-login/admin-login.component';
import { EventRegistrationComponent } from './pages/event-registration/event-registration.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin/admin-dashboard/admin-dashboard.component';
import { AdminEventsComponent } from './pages/admin/admin-events/admin-events.component';
import { AdminClubsComponent } from './pages/admin/admin-clubs/admin-clubs.component';
import { AdminVenuesComponent } from './pages/admin/admin-venues/admin-venues.component';
import { AdminJudgesComponent } from './pages/admin/admin-judges/admin-judges.component';
import { AdminSponsorsComponent } from './pages/admin/admin-sponsors/admin-sponsors.component';
import { AdminVolunteersComponent } from './pages/admin/admin-volunteers/admin-volunteers.component';
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
  { path: 'results', component: ResultsComponent, canActivate: [authGuard] },
  { path: 'calendar', component: CalendarComponent, canActivate: [authGuard] },
  { path: 'event-registration/:id', component: EventRegistrationComponent },
  { path: 'auth/signin', component: SigninComponent },
  { path: 'auth/signup', redirectTo: 'auth/student-login', pathMatch: 'full' },
  { path: 'auth/student-login', component: StudentLoginComponent },
  { path: 'auth/admin-login', component: AdminLoginComponent },
  { path: 'auth/student-signup', redirectTo: 'auth/student-login', pathMatch: 'full' },
  { path: 'auth/login', redirectTo: 'auth/signin', pathMatch: 'full' },
  { path: 'auth/register', redirectTo: 'auth/student-login', pathMatch: 'full' },
  
  // Admin Routes - Protected by adminGuard
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'modules/events', component: AdminEventsComponent },
      { path: 'modules/clubs', component: AdminClubsComponent },
      { path: 'modules/venues', component: AdminVenuesComponent },
      { path: 'modules/judges', component: AdminJudgesComponent },
      { path: 'modules/sponsors', component: AdminSponsorsComponent },
      { path: 'modules/volunteers', component: AdminVolunteersComponent },
      { path: 'modules/budgets', component: AdminBudgetsComponent },
      { path: 'modules/departments', component: AdminDepartmentsComponent },
      { path: 'modules/results', component: AdminResultsComponent },
      { path: 'modules/participations', component: AdminParticipationsComponent },
      { path: 'modules/registrations', component: AdminRegistrationsComponent },
      { path: 'modules/feedbacks', component: AdminFeedbacksComponent },
      { path: 'modules/users', component: AdminUsersComponent },
      { path: 'modules/admins', component: AdminAdminsComponent },
      { path: 'modules/comments', component: AdminCommentsComponent },
      { path: 'help', component: AdminHelpComponent },
      // TODO: Add more module routes as we build them
      // { path: 'recents', component: AdminRecentsComponent },
    ]
  },
  
  { path: '**', redirectTo: '' }
];
