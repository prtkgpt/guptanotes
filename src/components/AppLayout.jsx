import { Outlet } from 'react-router-dom';
import { PostsProvider } from '../contexts/PostsContext';
import Header from './Header';

export default function AppLayout() {
  return (
    <PostsProvider>
      <div className="min-h-screen bg-white">
        <Header />
        <Outlet />
      </div>
    </PostsProvider>
  );
}
