import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { theme } from './config/theme';
// Providers & Layouts (Eager load)
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './components/admin/layout/AdminLayout';
import { AuthProvider } from './config/contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { ToastProvider } from './ui/feedback/Toast';
import { ErrorBoundary } from './ui/feedback/ErrorBoundary';

// Side effects
import './legacy/utils/debugAuth';
import './lib/clear-cache';
import './build-info';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const GlobalSearch = React.lazy(() => import('./pages/GlobalSearch'));
const MallLayout = React.lazy(() => import('./pages/MallLayout'));
const MallHome = React.lazy(() => import('./pages/MallHome'));
const Explore = React.lazy(() => import('./pages/Explore'));
const StoreDetail = React.lazy(() => import('./pages/StoreDetail'));
const FloorDetail = React.lazy(() => import('./pages/FloorDetail'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const MallsPage = React.lazy(() => import('./pages/admin/malls/MallsPage'));
const MallCreatePage = React.lazy(() => import('./pages/admin/malls/MallCreatePage'));
const MallEditPage = React.lazy(() => import('./pages/admin/malls/MallEditPage'));
const StoresPage = React.lazy(() => import('./pages/admin/stores/StoresPage'));
const StoreCreatePage = React.lazy(() => import('./pages/admin/stores/StoreCreatePage'));
const StoreEditPage = React.lazy(() => import('./pages/admin/stores/StoreEditPage'));
const CategoriesPage = React.lazy(() => import('./pages/admin/categories/CategoriesPage'));
const CategoryCreatePage = React.lazy(() => import('./pages/admin/categories/CategoryCreatePage'));
const CategoryEditPage = React.lazy(() => import('./pages/admin/categories/CategoryEditPage'));
const MallDetail = React.lazy(() => import('./pages/MallDetail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <Home />
      </React.Suspense>
    ),
  },
  {
    path: '/search',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <GlobalSearch />
      </React.Suspense>
    ),
  },
  {
    path: '/malls/:mallId',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <MallDetail />
      </React.Suspense>
    ),
  },
  {
    path: '/malls/:mallId/stores/:storeId',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <StoreDetail />
      </React.Suspense>
    ),
  },
  {
    path: '/stores/:storeId',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <StoreDetail />
      </React.Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <Login />
      </React.Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <Register />
      </React.Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <ForgotPassword />
      </React.Suspense>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <AdminPanel />
          </React.Suspense>
        ),
      },
      {
        path: 'malls',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <MallsPage />
          </React.Suspense>
        ),
      },
      {
        path: 'malls/:id/edit',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <MallEditPage />
          </React.Suspense>
        ),
      },
      {
        path: 'malls/create',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <MallCreatePage />
          </React.Suspense>
        ),
      },
      {
        path: 'stores',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <StoresPage />
          </React.Suspense>
        ),
      },
      {
        path: 'stores/create',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <StoreCreatePage />
          </React.Suspense>
        ),
      },
      {
        path: 'stores/:mallId/:storeId/edit',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <StoreEditPage />
          </React.Suspense>
        ),
      },
      {
        path: 'categories',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <CategoriesPage />
          </React.Suspense>
        ),
      },
      {
        path: 'categories/create',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <CategoryCreatePage />
          </React.Suspense>
        ),
      },
      {
        path: 'categories/:id/edit',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <CategoryEditPage />
          </React.Suspense>
        ),
      },
    ],
  },
  {
    path: '/mall/:mallId',
    element: (
      <React.Suspense fallback={<PageLoader />}>
        <MallLayout />
      </React.Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <MallHome />
          </React.Suspense>
        ),
      },
      {
        path: 'explore',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <Explore />
          </React.Suspense>
        ),
      },
      {
        path: 'favorites',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <Favorites />
          </React.Suspense>
        ),
      },
      {
        path: 'stores/:storeId',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <StoreDetail />
          </React.Suspense>
        ),
      },
      {
        path: 'floors/:floorId',
        element: (
          <React.Suspense fallback={<PageLoader />}>
            <FloorDetail />
          </React.Suspense>
        ),
      },
    ],
  },
]);

const root = createRoot(rootElement);

import { HelmetProvider } from 'react-helmet-async';

// ... (existing imports)

root.render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <AuthProvider>
            <LocationProvider>
              <QueryClientProvider client={queryClient}>
                <ToastProvider>
                  <RouterProvider router={router} />
                </ToastProvider>
              </QueryClientProvider>
            </LocationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
);
