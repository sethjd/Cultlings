# Cultlings Art Bible

## Visual Identity

Cultlings is a cute but cursed dark-fairytale world. It should feel handmade, funny, and slightly ominous without becoming frightening. Every screen must remain readable on a small phone.

The visual shorthand is:

- chunky shapes
- big heads and tiny bodies
- soft rounded silhouettes
- simple faces with bright eyes
- candlelight orange against moonlight purple
- dark navy spaces with bone-white details
- mushroom green and ritual gold as accents

Humor comes from earnest little characters interacting with absurd occult objects. The world is strange, not cruel.

## Colour Palette

### Foundations

| Token | Hex | Use |
| --- | --- | --- |
| Midnight Ink | `#0D0B19` | Deepest background and outlines |
| Hollow Navy | `#15152A` | Main app background |
| Panel Plum | `#241D36` | Cards and menus |
| Raised Violet | `#342849` | Elevated controls |
| Moonlight Purple | `#9B7ADC` | Magic, focus, and player identity |
| Pale Moon | `#D8C4FF` | Purple highlights |

### Warm accents

| Token | Hex | Use |
| --- | --- | --- |
| Candle Orange | `#F2A35C` | Fire, action, and warnings |
| Ritual Gold | `#FFD478` | Rewards, focus, and primary actions |
| Ember Red | `#DD746F` | Damage and danger |

### Natural accents

| Token | Hex | Use |
| --- | --- | --- |
| Mushroom Green | `#82BE91` | Food, marsh, and positive growth |
| Bog Green | `#527B6A` | Swamp shadows |
| Bone White | `#E8DFC4` | Bones, labels, and pale details |
| Soft Ink | `#B7A9C1` | Secondary text |

Do not place two low-saturation midtones beside each other when they carry different gameplay meanings. Important resources always combine colour with a distinct shape.

## Shape Language

- Use circles, beans, rounded triangles, arches, and broad crescents.
- Outlines are thick and dark, usually 6-10% of the asset width.
- Heads are roughly half of a character silhouette.
- Hands and feet may be simple nubs.
- Buildings lean, bulge, or sag slightly. Perfect geometry should be reserved for ritual symbols.
- Hostile silhouettes use one strong distinguishing feature: flame, shell, bell, roots, mushroom cap, or floating tail.
- Avoid narrow spikes, fine linework, and details smaller than four screen pixels.

## UI Style

- Panels are dark, rounded, and separated with a pale low-opacity outline.
- Primary actions use ritual gold with a dark label.
- Secondary magical actions use moonlight purple.
- Disabled states lose saturation and contrast but keep readable labels.
- Cards should have one clear icon, one heading, and one short supporting line.
- Touch targets are at least 44 CSS pixels.
- Focus rings use ritual gold and must remain visible in high-contrast mode.
- Shadows should suggest chunky stacked pieces, not realistic lighting.

## Character Style

- Godlings and followers have large rounded heads, tiny torsos, and two bright eyes.
- Faces use at most eyes plus one tiny mouth or mark.
- Follower variants change silhouette before colour: round, long, wide, pointy, or tufted.
- Hats and masks remain readable at 32-48 pixels.
- Animation should make characters feel alive through bobbing, stepping, squash, and short pauses.
- Cosmetics never imply gameplay power.

## Enemy Style

- Enemies are recognisable from a filled silhouette.
- Candle enemies are tall and flame-led.
- Bone enemies are broad, pale, and segmented.
- Marsh enemies use squat shapes, mushroom caps, and puddle forms.
- Bellbone enemies use bells, arches, hollow faces, and echo rings.
- Bosses are approximately twice the visual mass of normal enemies.
- Attack warnings use shape and timing as well as colour.
- No realistic wounds, gore, or body horror.

## Building Style

- Buildings resemble small handmade toys assembled by overconfident followers.
- The shrine is the camp's visual anchor and tallest building.
- Huts are low, soft, and clustered.
- The ritual circle is flatter and more geometric than other structures.
- The kitchen uses a rounded pot/chimney silhouette.
- The training pit uses padded posts and a circular boundary.
- The relic vault is squat, heavy, and marked by a moon-shaped lock.
- Higher levels add glow, trim, flags, candles, or secondary forms rather than dense texture.

## Biome Style

### Candlewood Grove

Dark navy forest, candle orange, crooked bone roots, violet mushrooms, and warm points of light. Floor shapes are dry and rounded.

### Moldmoon Marsh

Deep blue-green ground, mushroom green, purple mist, soft puddles, reeds, and glowing caps. Hazards must contrast from the ordinary puddle decoration.

### Bellbone Crypt

Near-black plum stone, bone-white pillars, cracked bells, pale echo rings, and restrained gold. Floor decoration uses arches and broad tile shapes.

## Icon Rules

- Use a `64 x 64` viewBox unless the asset needs a different composition.
- Keep the main shape inside a four-pixel safe margin.
- Use a dark outline and no more than four fill colours.
- Resource icons must have unique silhouettes:
  - devotion: crescent droplet
  - food: mushroom-berry
  - cursed wood: forked log
  - bone shards: crossed bone pieces
- Include an accessible text label in HTML when meaning is not already written nearby.
- SVG files should not contain embedded fonts, scripts, raster images, filters, or external references.

## Animation Rules

- Prefer `transform` and `opacity`.
- Standard UI motion is 120-180 ms.
- Character idle loops are 1.6-2.8 seconds.
- Ritual and shrine pulses are 2-3.5 seconds.
- Combat flashes are shorter than 180 ms.
- Boss introductions may use one 600-900 ms pulse.
- Avoid animating layout properties.
- Respect `prefers-reduced-motion` and the saved Reduced Motion setting.
- Keep ambient animations below twelve simultaneous moving elements on mobile.

## Things To Avoid

- realistic gore or realistic horror
- copying Cult of the Lamb or any other game's characters, UI, costumes, or compositions
- copyrighted lookalikes
- tiny details that disappear on phones
- muddy colours with no value contrast
- noisy or heavily textured backgrounds
- excessive blur, glow, or drop shadows
- large inline SVG markup in screen templates
- visual effects that obscure attack warnings
- animation that prevents reading or delays input

## Asset Workflow

1. Start from an existing asset in the correct `assets/svg` category.
2. Keep a simple viewBox and a dark outer silhouette.
3. Reuse palette values from `src/styles/tokens.css`.
4. Test at 32, 48, and 96 CSS pixels.
5. Add the file to `service-worker.js`.
6. Use an `<img>` element for illustrative assets or a CSS background for icons.
7. Preserve an existing CSS/canvas fallback when replacing a working visual.
8. Check normal, high-contrast, large-text, and reduced-motion settings.

