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
- daily reward streak and last local claim date
- daily and permanent quest progress
- cosmetic tokens, unlocks, and equipped cosmetics
- profile statistics, selected title, and collection discoveries
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
- local-calendar daily rewards with a seven-day cycle and streak tracking
- data-driven daily and permanent quests
- cosmetic tokens earned through play
- 25 original CSS/canvas cosmetics across masks, shrine skins, follower hats, banners, and ground sigils
- player profile, selectable cult titles, and long-term statistics
- collection book for follower traits, relics, enemies, and cosmetics
- follower jobs, traits, mood, housing, and food pressure
- six buildings and five rituals
- eight collectible relics
- random camp choice events
- three-room single-player raids
- Candle Goblins, Bone Beetles, Hex Wisps, and the Wax-Head Brute
- fixed mobile joystick with large attack, dodge, and Moon Pulse buttons
- responsive attacks, knockback, hit flashes, damage numbers, health bars, and warning effects
- dodge invulnerability, cooldown displays, boss-hit shake, and lightweight canvas particles
- detailed raid reports with rewards, combat stats, relics, recruits, and performance ratings
- tappable camp followers and buildings, upgrade badges, working animations, and resource popups
- generated placeholder sound effects with saved mute and volume settings
- PWA caching and offline loading
- optional asynchronous multiplayer foundation

## Daily Rewards

The Camp tab contains a seven-day reward preview. A reward can be claimed once per local calendar date.

- Consecutive calendar days increase the streak.
- Missing a day resets the streak to day one.
- Rewards include small resources, XP, cosmetic tokens, and a day-seven relic chance.
- The system stores exact `YYYY-MM-DD` local dates rather than using a short countdown timer.

Changing the device clock can affect this prototype system. A production online version could validate dates with trusted server time while still preserving offline play.

## Quests

Four daily quests are selected from a data-driven quest catalog each local date. Permanent quests remain until completed.

Quest progress is connected to real game events:

- raids cleared
- enemies defeated
- devotion collected
- followers fed or recruited
- buildings upgraded
- rituals performed
- rank, follower, relic, shrine, and asynchronous raid milestones

Quest rewards remain small and fair: resources, XP, and cosmetic tokens.

## Cosmetics and Collection

Cosmetics are visual only. Equipping one never changes health, damage, production, raid rewards, or multiplayer base power.

The Collection Book includes:

- discovered follower traits
- found relics
- encountered enemy types
- the cosmetic wardrobe

Cosmetic categories currently include five player masks, five shrine skins, five follower hats, five cult banners, and five ground sigils. Starter appearances are free; additional appearances use cosmetic tokens earned from play.

## Profile and Titles

The Profile tab shows:

- player display name and Godling Rank
- raids cleared and enemies defeated
- followers recruited and relics collected
- asynchronous raid wins and losses
- selected title and favourite equipped banner

Titles unlock from fair progression milestones and have no gameplay effect.

## Expanded Rituals

The Ritual Circle now supports:

- Moon Chant
- Hearth Feast
- Soup of Shadows
- Candle Tax
- Blessing of Tiny Teeth

The new rituals use readable cooldowns or one-raid temporary effects. Candle Tax spends follower mood rather than money, while Blessing of Tiny Teeth grants `+1` damage to the next raid only.

## Future Monetisation Boundary

The disabled **Extras** screen states:

> Optional cosmetics may appear here in a future version. No purchases are active in this prototype.

Cultlings currently contains:

- no payments
- no advertisements
- no gambling or loot boxes
- no paid combat power
- no manipulative timers

Any future commercial support should remain optional and cosmetic, or use clearly disclosed rewarded interactions that do not make normal progression unpleasant.

## Controls

### Mobile

- Left virtual joystick: move
- **Zap**: attack
- **Dodge**: short invulnerable dash
- **Moon Pulse**: circular damage and knockback blast

The raid controls stay fixed at the bottom of the screen and disable browser pan/zoom gestures over the play area.

### Desktop

- `WASD` or arrow keys: move
- Left click or `Space`: attack
- Right click or `Shift`: dodge
- `E`: Moon Pulse

## Known Next Steps

- Link anonymous accounts to durable sign-in providers
- Validate raid results with Cloud Functions
- Optionally validate daily dates with trusted server time when online
- Add replay seeds or deterministic combat summaries
- Add inbox pagination and result expiry
- Add App Check and rate limiting
- Add weapons, more defenses, rituals, traits, events, and bosses
- Add more quest templates, collection entries, and cosmetic previews
- Add music, tutorial prompts, remappable controls, and expanded accessibility settings
