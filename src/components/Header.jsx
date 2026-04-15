import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-[600px] mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Yap</h1>
        <button
          onClick={signOut}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
