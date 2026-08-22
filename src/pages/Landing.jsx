import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  {
    icon: '⚡',
    title: 'Instant capture',
    body: 'Tap +, start typing. Everything autosaves — no accounts, no save button, no friction.',
  },
  {
    icon: '✅',
    title: 'Checklists',
    body: 'Turn any note into a checklist and back, with progress you can see at a glance.',
  },
  {
    icon: '🏷️',
    title: 'Inline #tags',
    body: 'Type #groceries anywhere in a note and it becomes a filter — no tagging UI to manage.',
  },
  {
    icon: '📷',
    title: 'Photos & voice',
    body: 'Attach photos from your camera and record voice memos right inside a note.',
  },
  {
    icon: '⏰',
    title: 'Reminders',
    body: 'Schedule a notification on any note. Tap it and you land right back in the note.',
  },
  {
    icon: '🔒',
    title: 'Private by default',
    body: 'Notes live on your device and work fully offline. No ads, no tracking. Sync is optional.',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1b1a]">
      {/* Nav */}
      <nav className="max-w-5xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <img src="/paperbark-mark.png" alt="" className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight">Paperbark</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <Link
              to="/app"
              className="px-4 py-2 bg-[#1c1b1a] text-[#faf8f5] rounded-full font-medium hover:bg-black transition-colors"
            >
              Open my timeline
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 font-medium text-[#5c574f] hover:text-black">
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-[#1c1b1a] text-[#faf8f5] rounded-full font-medium hover:bg-black transition-colors"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-6 pt-12 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c2610c] mb-4">
            Notes for iPhone &amp; Android
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] mb-5 text-balance">
            Write it down before it peels away.
          </h1>
          <p className="text-lg text-[#5c574f] leading-relaxed mb-8 max-w-md">
            Paperbark is a fast, private note-taking app — notes, checklists, photos, voice
            memos, and reminders that live on your device and work offline.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-2.5 bg-[#1c1b1a] text-[#faf8f5] rounded-lg text-sm font-semibold">
              Coming soon to Google Play
            </span>
            <span className="px-4 py-2.5 border border-[#d9d2c7] text-[#5c574f] rounded-lg text-sm font-semibold">
              App Store next
            </span>
          </div>
        </div>
        <div className="flex justify-center">
          <img
            src="/paperbark-mark.png"
            alt="Paperbark — a fan of peeling paper sheets with a note on top"
            className="w-64 md:w-80 drop-shadow-xl"
          />
        </div>
      </header>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-[#e8e4de] rounded-xl p-5">
              <div className="text-2xl mb-2" aria-hidden="true">
                {f.icon}
              </div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-[#5c574f] leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Yap timeline */}
      <section className="border-t border-[#e8e4de] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-14 md:flex items-center justify-between gap-8">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-2">Yap — your personal timeline</h2>
            <p className="text-[#5c574f] max-w-lg">
              Also on this site: a private, Twitter-style timeline just for you — thoughts,
              photos, videos, voice notes, and check-ins in one chronological feed.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            {user ? (
              <Link
                to="/app"
                className="px-5 py-2.5 bg-[#1c1b1a] text-[#faf8f5] rounded-lg text-sm font-semibold hover:bg-black transition-colors"
              >
                Open timeline
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-5 py-2.5 border border-[#d9d2c7] rounded-lg text-sm font-semibold hover:bg-[#faf8f5] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 bg-[#1c1b1a] text-[#faf8f5] rounded-lg text-sm font-semibold hover:bg-black transition-colors"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-sm text-[#8f8a81]">
        <span>© {new Date().getFullYear()} Paperbark</span>
        <div className="flex gap-5">
          <Link to="/privacy" className="hover:text-[#1c1b1a]">
            Privacy
          </Link>
          <a href="mailto:prateek@prateekgupta.org" className="hover:text-[#1c1b1a]">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
