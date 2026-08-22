const EFFECTIVE_DATE = 'August 22, 2026';

export default function PaperbarkPrivacy() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1b1a] px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#c2610c] mb-2">
          Paperbark
        </p>
        <h1 className="text-3xl font-bold mb-1">Privacy Policy</h1>
        <p className="text-sm text-[#8f8a81] mb-8">Effective {EFFECTIVE_DATE}</p>

        <div className="space-y-6 text-[15px] leading-relaxed text-[#3d3a35]">
          <p>
            Paperbark is a note-taking app for iPhone and Android. It is built to be
            private by default: your notes belong to you and live on your device.
          </p>

          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">Data stored on your device</h2>
            <p>
              Notes, checklists, tags, images, voice recordings, reminders, and app
              preferences are stored locally on your device. They are not transmitted
              anywhere unless you turn on sync. Deleting the app deletes this data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">If you enable sync</h2>
            <p>
              Sync is optional and requires creating an account with an email address and
              password. When sync is on, your email address and the text content of your
              notes (titles, note text, checklists, colors, and reminder times) are stored
              in our database, hosted on Supabase, so your notes can be backed up and
              synced across your devices. Data is encrypted in transit. Images and voice
              recordings are not uploaded; they remain on your device.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">Permissions</h2>
            <p>
              Paperbark asks for the camera and photo library only to attach images to
              your notes, the microphone only to record voice notes, and notification
              permission only to deliver reminders you schedule. Each permission is
              requested when you first use the feature and is never required to use the
              rest of the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">What we don't do</h2>
            <p>
              Paperbark contains no ads and no third-party analytics or tracking. We do
              not sell, rent, or share your data with anyone. We do not read your notes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">Deleting your data</h2>
            <p>
              Notes you delete from the Trash are permanently removed from your device,
              and the deletion is propagated to the sync database if sync is on. To delete
              your sync account and all synced data, contact us at the address below and
              we will remove it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">Children</h2>
            <p>Paperbark is not directed at children under 13.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">Changes & contact</h2>
            <p>
              If this policy changes, the updated version will be posted at this address
              with a new effective date. Questions or data requests:{' '}
              <a href="mailto:prateek@prateekgupta.org" className="text-[#c2610c] underline">
                prateek@prateekgupta.org
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
