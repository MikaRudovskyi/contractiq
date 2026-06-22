import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { ContractorsList } from './components/contractors/ContractorsList';
import { ContractsList } from './components/contracts/ContractsList';
import { WorkOrdersBoard } from './components/contracts/WorkOrdersBoard';
import { PaymentsList } from './components/payments/PaymentsList';
import { DocumentsList } from './components/documents/DocumentsList';
import { Analytics } from './components/dashboard/Analytics';
import { Settings } from './components/dashboard/Settings';
import { LoginPage } from './components/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';
import { MobileNavProvider } from './hooks/useMobileNav';

function App() {
  return (
    <AuthProvider>
      <MobileNavProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="contractors" element={<ContractorsList />} />
              <Route path="contracts" element={<ContractsList />} />
              <Route path="work-orders" element={<WorkOrdersBoard />} />
              <Route path="payments" element={<PaymentsList />} />
              <Route path="documents" element={<DocumentsList />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MobileNavProvider>
    </AuthProvider>
  );
}

export default App;