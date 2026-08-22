import { Link } from 'react-router-dom';

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#1c1b1a] px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#c2610c] mb-2">
          Paperbark
        </p>
        <h1 className="text-3xl font-bold mb-1">Delete your account &amp; data</h1>
        <p className="text-sm text-[#8f8a81] mb-8">For the Paperbark app on Android and iOS</p>

        <div className="space-y-6 text-[15px] leading-relaxed text-[#3d3a35]">
          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">
              If you never turned on sync
            </h2>
            <p>
              You don&apos;t have an account. All of your notes live only on your device —
              uninstalling Paperbark permanently deletes everything. There is nothing on our
              servers to remove.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">
              If you created a sync account
            </h2>
            <p>To delete your account and every piece of synced data, either:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                Email{' '}
                <a
                  href="mailto:prateek@prateekgupta.org?subject=Delete%20my%20Paperbark%20account"
                  className="text-[#c2610c] underline"
                >
                  prateek@prateekgupta.org
                </a>{' '}
                with the subject <strong>&quot;Delete my Paperbark account&quot;</strong> from
                the email address you signed up with, or
              </li>
              <li>
                Use the button below to open a pre-filled deletion request in your email app.
              </li>
            </ul>
            <a
              href="mailto:prateek@prateekgupta.org?subject=Delete%20my%20Paperbark%20account&body=Please%20delete%20my%20Paperbark%20sync%20account%20and%20all%20synced%20data.%20I%20am%20sending%20this%20from%20my%20account%20email%20address."
              className="inline-block mt-4 px-5 py-2.5 bg-[#1c1b1a] text-[#faf8f5] rounded-lg text-sm font-semibold hover:bg-black transition-colors"
            >
              Request account deletion
            </a>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1c1b1a] mb-2">What gets deleted</h2>
            <p>
              Your account (email address and credentials) and all synced note data — titles,
              note text, checklists, colors, and reminder times — are permanently deleted
              from our database within <strong>30 days</strong> of your request, and you&apos;ll
              receive a confirmation email. Notes stored locally on your devices are yours
              and are unaffected until you uninstall the app. We keep no backups of deleted
              accounts and retain no other data.
            </p>
          </section>

          <section>
            <p className="text-sm text-[#8f8a81]">
              See also the{' '}
              <Link to="/privacy" className="text-[#c2610c] underline">
                Paperbark privacy policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
