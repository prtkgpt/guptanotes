# Submitting Paperbark to the App Store & Google Play

Step-by-step guide for shipping `mobile/` to both stores using Expo's EAS (Expo
Application Services) — the standard path for Expo apps, with cloud builds so you
don't need a Mac for the iOS build.

> **Branding is locked in:** the app is **Paperbark**, bundle identifier / package
> name `org.prateekgupta.paperbark` (permanent once first submitted). One store
> wrinkle: an unrelated game already holds the exact name "Paperbark" on the
> App Store, and Apple requires exact-name uniqueness — so use **"Paperbark
> Notes"** (or "Paperbark — Notes") as the App Store *listing* name in App Store
> Connect. The name under the icon on the home screen stays **Paperbark**
> (set by `name` in app.json), and Google Play can use plain "Paperbark".

## 0. Costs & accounts (one-time setup)

| What | Cost | Where |
|---|---|---|
| Apple Developer Program | $99/year | [developer.apple.com/programs](https://developer.apple.com/programs/) |
| Google Play Console (personal) | $25 once | [play.google.com/console/signup](https://play.google.com/console/signup) |
| Expo account + EAS | Free tier is enough (limited monthly builds) | [expo.dev/signup](https://expo.dev/signup) |

Apple enrollment can take 24–48h to verify. Google's identity verification for new
developer accounts can also take a few days — start both early.

## 1. Prepare the app

```bash
cd mobile
npm install
npm i -g eas-cli
eas login
eas init            # links the project to your Expo account
eas build:configure # creates eas.json with development/preview/production profiles
```

Checklist in `app.json` before building (already done for Paperbark):
- `name: "Paperbark"` — the display name under the icon ✓
- `version` — start at `1.0.0` ✓
- `ios.bundleIdentifier` / `android.package` — `org.prateekgupta.paperbark` ✓ (permanent after first submission)
- Icons: `assets/icon.png` (1024×1024, opaque) and the Android adaptive icon layers carry the Paperbark peeling-sheets mark ✓
- `ios.supportsTablet` — keep `true` only if you'll also provide iPad screenshots; set `false` to skip the iPad review surface

Also add `"buildNumber"` (iOS) and `"versionCode"` (Android) auto-increment by
putting `"autoIncrement": true` in the production profile of `eas.json` — EAS then
bumps them for every build.

## 2. Privacy policy (required by BOTH stores)

Both stores require a public privacy policy URL, even for a local-first app.
Easiest path: add a `/privacy` page to the existing Vercel-deployed web app in this
repo and use that URL. It should state: notes are stored on-device; if sync is
enabled, email address and note content are stored in Supabase (your project);
no ads, no tracking, no sale of data.

## 3. Build production binaries

```bash
eas build --platform ios --profile production      # .ipa
eas build --platform android --profile production  # .aab
```

- **iOS**: EAS offers to create/manage the distribution certificate and
  provisioning profile for you — say yes. You'll sign in with your Apple ID.
- **Android**: EAS generates and stores the upload keystore — say yes and never
  lose access to that Expo account (it holds your signing key).

Builds run in Expo's cloud (~10–25 min) and appear at expo.dev with a download link.

## 4. iOS — App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **My Apps → “+” → New App**. Pick the bundle ID you registered (EAS registered it for you), set the app name (must be unique across the App Store) and primary language.
2. Upload the build: `eas submit --platform ios` (or upload the .ipa via the Transporter app). The build lands in **TestFlight** after Apple's ~15-min processing.
3. (Recommended) Test through TestFlight on your own iPhone before review.
4. In the app record, fill in:
   - **Screenshots**: 6.9" iPhone screenshots are required (1320×2868 portrait); iPad 13" (2064×2752) if `supportsTablet` is true. Take them in Simulator (`npx expo run:ios`) or from a device.
   - Description, keywords, support URL, marketing URL (optional).
   - **App Privacy**: declare what's collected. Local-only: "Data not collected". With sync enabled: Contact Info → Email (for account), User Content → Other (notes) — linked to identity, not used for tracking.
   - **Export compliance**: uses only standard HTTPS encryption → answer "exempt" (you can set `ios.config.usesNonExemptEncryption: false` in app.json to skip the question).
   - Age rating questionnaire (all "No" → 4+).
5. If sync is enabled in your build, add a **demo account** (email + password) in App Review notes — Apple rejects login-gated apps without one. If sync is unconfigured, state "no account required; all data stored on device."
6. Select the build, click **Add for Review → Submit**. First reviews typically take 24–48 hours. Common first-app rejections: missing privacy policy, missing demo account, screenshots that don't match the app.

## 5. Android — Google Play Console

1. In [Play Console](https://play.google.com/console) → **Create app** → name, default language, App/Free.
2. Complete the **Dashboard "Set up your app" tasks** (all required before release):
   - Privacy policy URL.
   - **App access**: if sync is enabled, provide demo credentials; otherwise "all functionality available without special access".
   - Ads declaration: No ads.
   - **Content rating** questionnaire (utility → Everyone).
   - Target audience: 18+ or 13+ (don't target children — avoids extra policy work).
   - **Data safety** form: mirror the iOS privacy answers (local-only: no data collected/shared; with sync: email + user content, encrypted in transit, deletable on request).
3. Upload the build. First time: **Testing → Internal testing → Create release** and upload the `.aab` manually (later releases can use `eas submit --platform android` with a Play service-account key — the [EAS submit docs](https://docs.expo.dev/submit/android/) walk through creating it).
4. **Heads-up for new personal accounts** (created after Nov 2023): Google requires a **closed test with at least 12 testers opted in for 14 consecutive days** before you can apply for production access. Plan those two weeks in — recruit friends/family, have them opt in via the test link, then apply for production from the console.
5. Once production access is granted: **Production → Create release** → pick the tested build → set the store listing (512×512 icon, 1024×500 feature graphic, at least 2 phone screenshots) → roll out. First production review usually takes 1–7 days.

## 6. After launch

- Ship updates by bumping `version` in `app.json`, rebuilding, and re-submitting (`eas build` + `eas submit`). JS-only changes can also go out instantly with [EAS Update](https://docs.expo.dev/eas-update/introduction/) once configured.
- Both consoles will email you about policy tasks (annual data-safety re-confirmations etc.) — don't ignore them; stale declarations get apps delisted.

## Quick reference

```bash
# one time
eas login && eas init && eas build:configure

# each release
eas build --platform all --profile production
eas submit --platform ios
eas submit --platform android   # after service-account setup; first upload is manual
```
