import { Outlet } from 'react-router-dom';
import { PagesProvider } from '../contexts/PagesContext';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <PagesProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <Outlet />
      </div>
    </PagesProvider>
  );
}
