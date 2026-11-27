# Budtale on Google Play: release plan

Getting the Android app from the debug build on the owner's phone to the
public Play Store. Tick each step as it is done. **You** = the owner,
**Claude** = done in a Claude Code session.

App id `com.budtale.app` · Firebase project `bud-tale` · server and
database are already live (see `deploy.md`), so this plan is only the app.

## A. Get the release build ready (Claude)

- [x] A1. Release signing in Gradle, read from `web/android/keystore.properties`
      (never committed; key files ignored by git).
- [x] A2. The app's account-deletion text: "email with your phone number"
      becomes the Google account's email (English now; Hindi after owner review).
- [ ] A3. Hindi drafts for the lines still in English (sign-in, reminders,
      "Signed in as"), sent for owner review. Hindi users see English until approved.
- [ ] A4. Push `main` (the server and website do not change; Render redeploys the same backend).

## B. Create the upload key (You)

The upload key proves a build comes from you. Play re-signs each build with
its own app-signing key, so a lost upload key can be reset through Play
support, but keep it safe anyway.

- [x] B1. In Claude Code, run (you type the passwords; they never go in chat):
      `! mkdir -p ~/keys && keytool -genkeypair -v -keystore ~/keys/budtale-upload.jks -alias budtale -keyalg RSA -keysize 2048 -validity 10000`
      Name: Budtale; organisation: Ray Play Labs; country: IN.
- [ ] B2. Save the keystore file and both passwords in your password manager,
      and a copy of the file somewhere off this laptop.
- [x] B3. Create `web/android/keystore.properties` yourself:
      ```
      storeFile=/Users/metallonudo/keys/budtale-upload.jks
      storePassword=…
      keyAlias=budtale
      keyPassword=…
      ```

## C. First upload and Google sign-in for Play builds

- [x] C1. **Claude:** build the signed AAB (`./gradlew bundleRelease`) and
      print the upload key's SHA-1 (a fingerprint, not a secret).
- [ ] C2. **You:** Play Console → Test and release → Internal testing →
      Create new release → keep Play App Signing on → upload
      `web/android/app/build/outputs/bundle/release/app-release.aab`.
      Add yourself as an internal tester.
- [ ] C3. **You:** Play Console → Test and release → App integrity → App
      signing: copy the **app signing key** SHA-1.
- [ ] C4. **You:** Firebase → Project settings → Android app `com.budtale.app`
      → Add fingerprint: the app signing SHA-1 (C3) and the upload SHA-1 (C1).
      Download the new `google-services.json` and give Claude its path.
- [ ] C5. **Claude:** swap in the new `google-services.json`, raise
      `versionCode` to 2, rebuild the AAB. **You:** upload it as a new
      internal release.
- [ ] C6. **You:** uninstall the debug Budtale and the old Bagicha app from
      the phone, install from the internal-testing link, and check: Google
      sign-in, your 11 plants, a reminder arriving, "Use my location", taking a photo.

## D. Store listing and policy forms (You; Claude drafts the text)

- [ ] D1. Data safety: location **precise**; Email ticked, Phone unticked;
      photos listed; deletion link `https://budtale.vercel.app/delete-account`.
- [ ] D2. Store listing: short description (80 characters), full description,
      512×512 icon, 1024×500 feature graphic, at least 2 phone screenshots.
      Claude drafts the text and takes the screenshots.
- [ ] D3. App content: privacy policy `https://budtale.vercel.app/privacy`,
      content rating questionnaire, target audience (adults; not for children),
      ads: none.
- [ ] D4. Fill the remaining blanks in the privacy policy and terms on the site.

## E. Testing gate

- [ ] E1. **Personal developer account** (made after Nov 2023): a closed test
      with at least 12 testers opted in for 14 days in a row, then apply for
      production access in Play Console. **Organisation account:** skip to F.
- [ ] E2. Fix what testers find. Every new upload raises `versionCode` by 1.

## F. Production

- [ ] F1. Production → Create release from the tested build; countries: India;
      staged rollout at 20%.
- [ ] F2. Wait for Google's review (usually a few days).
- [ ] F3. Watch Play's Android vitals (crashes) and the Render logs for a few
      days, then roll out to 100%.

## Any time before F

- Delete the Firebase key file from Downloads.
- Change the test passwords and keys from development.
- Decide on the 8 bogus accounts (they stay until the owner says "erase them").

## After launch

- A later release drops `users.phone_number` (after a database backup), then
  the Neon backup branch can go.
- Shut down the old web app at bagicha-web.vercel.app.
