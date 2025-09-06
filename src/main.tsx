
import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import Home from './pages/Home'
// import MallPicker from './pages/MallPicker'
import GlobalSearch from './pages/GlobalSearch'
import MallLayout from './pages/MallLayout'
import MallHome from './pages/MallHome'
import Explore from './pages/Explore'
import StoreDetail from './pages/StoreDetail'
import FloorDetail from './pages/FloorDetail'
import Favorites from './pages/Favorites'
import AdminPanel from './pages/AdminPanel'
import MallEditPage from './pages/MallEditPage'
import MallDetail from './pages/MallDetail'
import MallCreatePage from './pages/MallCreatePage'
import StoreCreatePage from './pages/StoreCreatePage'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ProtectedRoute from './legacy/components/ProtectedRoute'
import AuthTest from './pages/AuthTest'
import { AuthProvider } from './config/contexts/AuthContext'
import { LocationProvider } from './contexts/LocationContext'
import { ToastProvider } from './ui/feedback/Toast'
import { ErrorBoundary } from './ui/feedback/ErrorBoundary'
import './legacy/utils/debugAuth'
import './lib/clear-cache' // Enable cache clearing functions

// Debug: Check if we can access the root element
const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (!rootElement) {
  throw new Error('Root element not found')
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/search', element: <GlobalSearch /> },
  { path: '/malls/:mallId', element: <MallDetail /> },
  { path: '/malls/:mallId/stores/:storeId', element: <StoreDetail /> },
  { path: '/stores/:storeId', element: <StoreDetail /> },
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/auth-test', element: <AuthTest /> },
  { 
    path: '/admin', 
    element: (
      <ProtectedRoute>
        <AdminPanel />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/admin/malls', 
    element: (
      <ProtectedRoute>
        <AdminPanel />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/admin/malls/:id/edit', 
    element: (
      <ProtectedRoute>
        <MallEditPage />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/admin/malls/create', 
    element: (
      <ProtectedRoute>
        <MallCreatePage />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/admin/stores/create', 
    element: (
      <ProtectedRoute>
        <StoreCreatePage />
      </ProtectedRoute>
    ) 
  },
  { 
    path: '/admin/stores/:storeId/edit', 
    element: (
      <ProtectedRoute>
        <StoreCreatePage />
      </ProtectedRoute>
    ) 
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
    ]
  }
])

// Using the new ErrorBoundary component

// Debug: Log that we're about to render
console.log('About to render React app')

// Create root
const root = createRoot(rootElement);

root.render(
  <StrictMode>
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
  </StrictMode>,
)

console.log('React app rendered successfully')
