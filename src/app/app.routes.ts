import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Forgotpassword } from './pages/forgotpassword/forgotpassword';
import { Profile } from './pages/profile/profile';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { Addemployee } from './pages/addemployee/addemployee';
import { Createtask } from './pages/createtask/createtask';
import { TaskDetail } from './pages/task-detail/task-detail';
import { TaskHistory } from './pages/task-history/task-history';
import {Clientlist} from './pages/clientlist/clientlist';
import { Resetpassword } from './pages/resetpassword/resetpassword';
import { TaskReportComponent } from './pages/task-report/task-report';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '', component: AuthLayout, children: [
      { path: 'login', component: Login },
      { path: 'forgotpassword', component: Forgotpassword },
      { path: 'reset-password', component: Resetpassword }
    ]
  },
  // Putting canActivate on the parent main route protects every child in one place
  { path: 'main', component: MainLayout, canActivate: [authGuard], children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'profile', component: Profile },
      { path: 'create-task', component: Createtask, canActivate: [roleGuard(['Employee','Admin'])] },
      { path: 'task/:id', component: TaskDetail },
      { path: 'task-history', component: TaskHistory },
      { path: 'addemployee', component: Addemployee, canActivate: [roleGuard(['SuperAdmin','Admin'])] },
      { path: 'clientlist', component: Clientlist },
      { path: 'task-report', component: TaskReportComponent, canActivate: [roleGuard(['SuperAdmin','Admin'])] }
    ]
  }
];
