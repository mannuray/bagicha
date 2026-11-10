import { CropsScreen } from '../features/crops';
import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';
import { LoginScreen, OtpScreen, RequireAuth, RequireOnboarded, SplashScreen } from '../features/auth';
import { PlantDetailScreen, SeasonReviewScreen } from '../features/biography';
import { DashboardScreen } from '../features/dashboard';
import { LogMomentScreen } from '../features/journal';
import { PlantFormScreen, PlantListScreen } from '../features/plants';
import { GardenScreen, LanguageScreen, ProfileScreen, RegionScreen } from '../features/profile';
import { DiagnoseResultScreen, IdentifyResultScreen, ScanScreen, ScanStateProvider } from '../features/scan';
import { TasksScreen } from '../features/tasks';
import { NotFoundScreen } from './NotFoundScreen';

const authed = (screen: ReactNode) => <RequireAuth>{screen}</RequireAuth>;
const app = (screen: ReactNode) => (
  <RequireAuth>
    <RequireOnboarded>{screen}</RequireOnboarded>
  </RequireAuth>
);

export function AppRoutes() {
  return (
    <ScanStateProvider>
      <Routes>
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/login/otp" element={<OtpScreen />} />

        <Route path="/onboarding/language" element={authed(<LanguageScreen />)} />
        <Route path="/onboarding/region" element={authed(<RegionScreen />)} />
        <Route path="/onboarding/garden" element={authed(<GardenScreen />)} />

        <Route path="/" element={app(<DashboardScreen />)} />
        <Route path="/plants" element={app(<PlantListScreen />)} />
        <Route path="/plants/new" element={app(<PlantFormScreen />)} />
        <Route path="/plants/:id" element={app(<PlantDetailScreen />)} />
        <Route path="/plants/:id/edit" element={app(<PlantFormScreen />)} />
        <Route path="/plants/:id/tasks" element={app(<TasksScreen />)} />
        <Route path="/plants/:id/log" element={app(<LogMomentScreen />)} />
        <Route path="/plants/:id/season" element={app(<SeasonReviewScreen />)} />
        <Route path="/tasks" element={app(<TasksScreen />)} />
        <Route path="/crops" element={app(<CropsScreen />)} />
        <Route path="/scan" element={app(<ScanScreen />)} />
        <Route path="/scan/identify" element={app(<IdentifyResultScreen />)} />
        <Route path="/scan/diagnose" element={app(<DiagnoseResultScreen />)} />
        <Route path="/profile" element={app(<ProfileScreen />)} />

        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </ScanStateProvider>
  );
}
