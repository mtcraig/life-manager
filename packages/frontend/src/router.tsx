import { createBrowserRouter } from 'react-router-dom';
import { Shell } from './components/layout/Shell.js';
import { HomePage } from './pages/Home/HomePage.js';
import { AccountsPage } from './pages/Accounts/AccountsPage.js';
import { DetailPage } from './pages/Detail/DetailPage.js';
import { WealthPage } from './pages/Wealth/WealthPage.js';
import { InvestmentsPage } from './pages/Investments/InvestmentsPage.js';
import { InsurancePage } from './pages/Insurance/InsurancePage.js';
import { EnergyPage } from './pages/Energy/EnergyPage.js';
import { ContentsPage } from './pages/Contents/ContentsPage.js';
import { SettingsPage } from './pages/Settings/SettingsPage.js';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'accounts', element: <AccountsPage /> },
      { path: 'detail', element: <DetailPage /> },
      { path: 'wealth', element: <WealthPage /> },
      { path: 'investments', element: <InvestmentsPage /> },
      { path: 'insurance', element: <InsurancePage /> },
      { path: 'energy', element: <EnergyPage /> },
      { path: 'contents', element: <ContentsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
