import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './config/theme';

import Home from './pages/Home';
import GlobalSearch from './pages/GlobalSearch';
import MallLayout from './pages/MallLayout';
import MallHome from './pages/MallHome';
import Explore from './pages/Explore';
import StoreDetail from './pages/StoreDetail';
import FloorDetail from './pages/FloorDetail';
import Favorites from './pages/Favorites';
import AdminPanel from './pages/AdminPanel';
import MallsPage from './pages/admin/malls/MallsPage';
import MallCreatePage from './pages/admin/malls/MallCreatePage';
import MallEditPage from './pages/admin/malls/MallEditPage';
import StoresPage from './pages/admin/stores/StoresPage';
import StoreCreatePage from './pages/admin/stores/StoreCreatePage';
import StoreEditPage from './pages/admin/stores/StoreEditPage';
import CategoriesPage from './pages/admin/categories/CategoriesPage';
import CategoryCreatePage from './pages/admin/categories/CategoryCreatePage';
import CategoryEditPage from './pages/admin/categories/CategoryEditPage';
import MallDetail from './pages/MallDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AdminRoute from './components/auth/AdminRoute';
import AdminLayout from './components/admin/layout/AdminLayout';
import AuthTest from './pages/AuthTest';
import AuthDebug from './pages/AuthDebug';
import AdminTest from './pages/AdminTest';
import { AuthProvider } from './config/contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { ToastProvider } from './ui/feedback/Toast';
import { ErrorBoundary } from './ui/feedback/ErrorBoundary';
import './legacy/utils/debugAuth';
import './lib/clear-cache';
import './build-info';

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
  { path: '/', element: <Home /> },
  { path: '/search', element: <GlobalSearch /> },
  { path: '/malls/:mallId', element: <MallDetail /> },
  { path: '/malls/:mallId/stores/:storeId', element: <StoreDetail /> },
  { path: '/stores/:storeId', element: <StoreDetail /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/auth-test', element: <AuthTest /> },
  { path: '/auth-debug', element: <AuthDebug /> },
  { path: '/admin-test', element: <AdminTest /> },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminPanel /> }, // Overview
      { path: 'malls', element: <MallsPage /> },
      { path: 'malls/:id/edit', element: <MallEditPage /> },
      { path: 'malls/create', element: <MallCreatePage /> },
      { path: 'stores', element: <StoresPage /> },
      { path: 'stores/create', element: <StoreCreatePage /> },
      { path: 'stores/:mallId/:storeId/edit', element: <StoreEditPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'categories/create', element: <CategoryCreatePage /> },
      { path: 'categories/:id/edit', element: <CategoryEditPage /> }
    ]
  },
  {
    path: '/mall/:mallId',
    element: <MallLayout />,
    children: [
      { index: true, element: <MallHome /> },
      { path: 'explore', element: <Explore /> },
      { path: 'favorites', element: <Favorites /> },
      { path: 'stores/:storeId', element: <StoreDetail /> },
      { path: 'floors/:floorId', element: <FloorDetail /> },
    ],
  },
]);

const root = createRoot(rootElement);

root.render(
  <StrictMode>
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
  </StrictMode>,
);
