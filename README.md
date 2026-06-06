# Cultlings

Cultlings is a mobile-first cute-dark browser game prototype. You play a tiny failed god rebuilding a questionable cult, assigning followers around camp and fighting through short cursed raids.

Everything is original and drawn with CSS, SVG, or the HTML canvas. The base game has no build step and remains fully playable offline.

## Run Locally

`index.html` can be opened directly for basic offline play. PWA caching and Firebase require a local web server:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish on GitHub Pages

1. Add the project files to a GitHub repository.
2. Open **Settings > Pages**.
3. Choose **Deploy from a branch**.
4. Select the main branch and root folder.
5. Open the generated Pages URL after deployment finishes.

All paths are relative, so repository subpaths such as `username.github.io/cultlings/` work.

## Offline and Mock Mode

Firebase is optional. With the default `firebaseConfig.js`, Cultlings shows **Offline Mode** and continues to use localStorage.

The multiplayer tab remains testable using three local mock cults:

- Moon-Mold Family
- Candle Teeth Circle
- The Soft Skull Choir

Mock publishing, raid history, defender inbox rewards, display names, and save checks are stored only on the current device.

## Enable Firebase

Cultlings uses the modular Firebase Web SDK, Anonymous Authentication, and Cloud Firestore.

1. Create a Firebase project.
2. Add a Web App in **Project settings**.
3. Enable **Authentication > Sign-in method > Anonymous**.
4. Create a Cloud Firestore database.
5. Open [src/data/firebaseConfig.example.js](src/data/firebaseConfig.example.js).
6. Copy its object into [src/data/firebaseConfig.js](src/data/firebaseConfig.js).
7. Replace every placeholder with the Web App configuration from Firebase Console.
8. Deploy the rules in [firebase.rules.example](firebase.rules.example), reviewing them for your production needs.
9. Serve or deploy the app over HTTP/HTTPS.

No private service-account credential belongs in this browser project. The Firebase Web configuration identifies the project but does not replace Security Rules.

The Firebase SDK is downloaded from Google's official `gstatic.com/firebasejs` CDN only when a valid config is detected. If loading or authentication fails, the game falls back to Offline Mode.

## Authentication and Profiles

When Firebase is configured:

- The app signs in anonymously.
- `players/{uid}` is created or loaded.
- New players receive a local name such as `Cultling_0427`.
- Display names can be edited in the Multiplayer tab and synchronized to the profile.

Anonymous accounts are device/browser-profile specific unless later linked to another sign-in provider.

## Cloud Saves

localStorage remains the normal save and offline fallback.

The **Sync Save** button uploads:

- resources
- followers and jobs
- building levels
- relic ownership and active relics
- XP and derived Godling Rank
- raid progression fields
- save timestamp

Before loading cloud progress, the app compares timestamps. A newer cloud save produces a warning and requires confirmation; it is never silently written over the local save.

## Asynchronous Multiplayer

The Multiplayer camp tab provides:

- connection status
- display-name editing
- manual cloud sync
- defense modifier selection
- Publish Cult
- recent published cult browser
- asynchronous raid launch
- defender raid inbox and collectible rewards

Publishing uploads only a small raidable snapshot:

- owner ID and display name
- abstract camp layout labels
- building and shrine levels
- guard followers' name, trait, and placeholder color
- selected defense modifiers
- up to three active relic IDs
- base power and timestamp

It does not publish resources, full follower rosters, local settings, or cloud-save contents.

Async raids generate one room from the defender snapshot. Guard followers become combat units, shrine levels add tougher enemies, ritual levels and Hex Wards add ranged wisps, and defensive modifiers alter health or speed. Strong bases can summon a smaller Wax-Head Brute.

Afterward, a compact battle result is written for the defender to collect later. This is not real-time multiplayer.

## Firestore Data Design

### `players/{uid}`

Private to the authenticated owner:

- `displayName`
- `createdAtMs`
- `updatedAtMs`
- `cloudSave.data`
- `cloudSave.updatedAtMs`

### `publicCults/{uid}`

Readable by signed-in players:

- public display name
- raidable layout and building snapshot
- guard summaries
- defense modifiers
- base power
- publish timestamp

The document ID matches the owner's Firebase UID.

### `raidResults/{resultId}`

Readable only by the attacker or defender:

- attacker and defender IDs
- attacker display name
- win/loss result
- earned resources
- defender reward
- short battle summary
- timestamp
- collection state

Only the defender may update `collected` and `collectedAtMs`.

## Security Notes

[firebase.rules.example](firebase.rules.example) is safer than open public writes:

- player documents are owner-only
- public cults can only be written by their owner
- raid results must identify the signed-in user as attacker
- raid results are readable only by their attacker or defender
- defenders may only update reward collection fields

Client-generated multiplayer is still not cheat-proof. A production economy should validate rewards and raid outcomes with trusted server code, such as Cloud Functions.

## Current Game Features

- Godling Rank and progression unlocks
- follower jobs, traits, mood, housing, and food pressure
- six buildings and two rituals
- eight collectible relics
- random camp choice events
- three-room single-player raids
- Candle Goblins, Bone Beetles, Hex Wisps, and the Wax-Head Brute
- mobile joystick, keyboard controls, player health, and boss health
- PWA caching and offline loading
- optional asynchronous multiplayer foundation

## Known Next Steps

- Link anonymous accounts to durable sign-in providers
- Validate raid results with Cloud Functions
- Add replay seeds or deterministic combat summaries
- Add inbox pagination and result expiry
- Add App Check and rate limiting
- Add weapons, more defenses, rituals, traits, events, and bosses
- Add sound, tutorial prompts, and accessibility settings
