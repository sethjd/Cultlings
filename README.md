# Cultlings

Cultlings is a mobile-first cute-dark browser game prototype. You play a tiny failed god rebuilding a questionable cult, assigning followers around camp and fighting through short cursed raids.

Everything in the prototype is original and drawn with CSS, SVG, or the HTML canvas. There are no runtime dependencies, external assets, or build tools.

## Run Locally

`index.html` can be opened directly for a quick look. PWA and offline features require a local web server:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish on GitHub Pages

1. Add the project files to a GitHub repository.
2. Open **Settings > Pages** in that repository.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the main branch and root folder.
5. Open the generated Pages URL after deployment finishes.

All file paths are relative, so the game works under a repository path such as `username.github.io/cultlings/`.

To install it on a phone, open the deployed HTTPS page and use the browser's **Add to Home Screen** action.

## Current Progression Loop

- Gain Godling XP from raids, followers, rituals, and building upgrades
- Unlock the Training Pit at Rank 2
- Unlock the Relic Vault and raid relics at Rank 3
- Unlock the Cursed Ruins room layout at Rank 4
- Unlock follower job assignment at Rank 5
- Return to camp to balance production, food, housing, mood, upgrades, and raid fatigue
- Encounter short choice events after raids or during camp play

Numbers are intentionally compact. One or two raids should provide a meaningful upgrade or unlock.

## Camp Features

- Five mobile tabs: Overview, Followers, Buildings, Rituals, and Relics
- Generated followers with traits, jobs, and Happy/Okay/Unhappy moods
- Worshipper, Forager, Woodcutter, Bone Picker, and Guard jobs
- Trait and mood modifiers for production and food use
- Moon Shrine, Follower Huts, Ritual Circle, Crooked Kitchen, Training Pit, and Relic Vault
- Moon Chant production boost and Hearth Feast recovery ritual
- Passive camp production with floating resource summaries
- Food, housing, rituals, and repeated raids affect follower mood
- Local autosave and reset-save control

## Raid Features

- Three-room action raids with persistent health between rooms
- Candle Goblin chasers
- Tough, slower Bone Beetles
- Ranged Hex Wisps with slow magic projectiles
- The Wax-Head Brute mini boss with marked danger zones
- Candlewood, Cursed Ruins, and Melted Altar presentation
- Mobile virtual joystick and attack button
- WASD or arrow keys to move; Space or mouse/touch on the canvas to attack
- Player and boss health bars
- Resource pickups, follower recruitment, XP, relic finds, and results summary

## Relics

The prototype includes eight relics:

- Cracked Moon Bell
- Hungry Little Idol
- Bone Crown
- Ember Candle
- Soft Skull Charm
- Mushroom Halo
- Whispering Twig
- Tiny Doom Mask

The first Relic Vault level provides three active slots. Vault upgrades add more. Duplicate relics convert into bone shards.

## Project Layout

```text
assets/
  icons/
  svg/
src/
  core/       save state and shared UI helpers
  data/       progression, buildings, jobs, relics, events, and tuning
  entities/   player, enemies, hazards, projectiles, and pickups
  screens/    title, camp, raid, and results screens
index.html
styles.css
manifest.json
service-worker.js
```

## Known Next Steps

- Add weapons and attack choices
- Add more rituals, traits, events, relics, and bosses
- Add follower job animations and a detailed happiness screen
- Add building placement and visible Training Pit, Kitchen, and Vault art to the camp map
- Add sound, music, tutorial prompts, and accessibility settings
- Add proper PNG install icons and platform splash assets
- Tune enemy waves and progression with broader device play-testing

## Future Firebase Integration

Firebase configuration can live in:

```text
src/config/firebase.js
```

The `GameStore` in `src/core/state.js` remains the data boundary. Local storage can become an offline cache while cloud saves, shared raid seeds, and asynchronous challenge data are added behind the same store methods.

Do not commit private service-account credentials. Browser Firebase configuration is public by design; database and storage access must be protected with Firebase Security Rules.
