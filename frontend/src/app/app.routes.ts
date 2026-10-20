import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/auth/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./features/books/book-list/book-list.component').then((m) => m.BookListComponent),
  },
  {
    path: 'books/new',
    loadComponent: () =>
      import('./features/books/book-form/book-form.component').then((m) => m.BookFormComponent),
  },
  {
    path: 'books/:id',
    loadComponent: () =>
      import('./features/books/book-detail/book-detail.component').then((m) => m.BookDetailComponent),
  },
  {
    path: 'books/:id/edit',
    loadComponent: () =>
      import('./features/books/book-form/book-form.component').then((m) => m.BookFormComponent),
  },
  { path: '**', redirectTo: '' },
];
