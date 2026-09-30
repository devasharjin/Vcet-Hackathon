import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RepositoryProvider } from './context/RepositoryContext.js';
import { MainLayout } from './components/layout/MainLayout.js';
import { Dashboard } from './pages/Dashboard.js';
import { RepositoryPage } from './pages/RepositoryPage.js';
import { ConflictResolutionPage } from './pages/ConflictResolutionPage.js';
import { VerificationPage } from './pages/VerificationPage.js';
import { HistoryPage } from './pages/HistoryPage.js';

export const App: React.FC = () => {
  return (
    <RepositoryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="repository" element={<RepositoryPage />} />
            <Route path="conflicts" element={<ConflictResolutionPage />} />
            <Route path="verification" element={<VerificationPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RepositoryProvider>
  );
};

export default App;
