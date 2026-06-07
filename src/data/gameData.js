(function () {
  const C = window.Cultlings = window.Cultlings || {};

  C.DATA = {
    version: 5,
    resources: {
      devotion: { label: "Devotion", short: "Devotion" },
      food: { label: "Food", short: "Food" },
      wood: { label: "Cursed Wood", short: "Wood" },
      bones: { label: "Bone Shards", short: "Bones" }
    },
    starterResources: {
      devotion: 45,
      food: 40,
      wood: 35,
      bones: 14
    },
    ranks: [
      { rank: 1, xp: 0, unlock: "Camp, raids, upgrades, and Moon Chant" },
      { rank: 2, xp: 40, unlock: "Training Pit" },
      { rank: 3, xp: 105, unlock: "Relic Vault and raid relics" },
      { rank: 4, xp: 185, unlock: "Moldmoon Marsh biome" },
      { rank: 5, xp: 285, unlock: "Follower job assignment" },
      { rank: 6, xp: 410, unlock: "Stronger elite raid rooms" },
      { rank: 7, xp: 560, unlock: "Bellbone Crypt" }
    ],
    xpRewards: {
      raidClear: 28,
      recruit: 12,
      ritual: 8,
      building: 10
    },
    names: [
      "Mips", "Nettle", "Borb", "Soot", "Peeble", "Wurm", "Nib", "Mallow",
      "Crumb", "Grimble", "Pock", "Tansy", "Gloom", "Bramble", "Doot", "Midge",
      "Plum", "Wicket", "Moth", "Tumble", "Smudge", "Turnip", "Pip", "Murk"
    ],
    traits: [
      { name: "Always Hungry", detail: "Consumes 40% more food." },
      { name: "Secretly a Rat", detail: "Finds 15% more cursed wood and bones." },
      { name: "Great Chanter", detail: "Produces 30% more devotion." },
      { name: "Afraid of Candles", detail: "Receives a smaller Moon Chant bonus." },
      { name: "Mushroom Blessed", detail: "Gathers 35% more food." },
      { name: "Lazy but Loyal", detail: "Produces 20% less, but stays cheerful." },
      { name: "Tiny Prophet", detail: "Produces a little devotion in any job." }
    ],
    jobs: {
      worshipper: {
        name: "Worshipper",
        resource: "devotion",
        rate: 0.16,
        description: "Generates devotion at the shrine."
      },
      forager: {
        name: "Forager",
        resource: "food",
        rate: 0.06,
        description: "Finds edible things. Mostly edible."
      },
      woodcutter: {
        name: "Woodcutter",
        resource: "wood",
        rate: 0.035,
        description: "Collects whispering cursed wood."
      },
      bonePicker: {
        name: "Bone Picker",
        resource: "bones",
        rate: 0.018,
        description: "Sorts the useful bones from the judgmental ones."
      },
      guard: {
        name: "Guard",
        resource: null,
        rate: 0,
        description: "Every two guards grant +1 raid health."
      }
    },
    buildings: {
      shrine: {
        name: "Moon Shrine",
        requiredRank: 1,
        description: "Increases devotion capacity and passive devotion.",
        baseCost: { wood: 22, bones: 6 }
      },
      huts: {
        name: "Follower Huts",
        requiredRank: 1,
        description: "Adds room for two more followers per level.",
        baseCost: { wood: 18, bones: 4 }
      },
      ritual: {
        name: "Ritual Circle",
        requiredRank: 1,
        description: "Unlocks rituals and strengthens Moon Chant.",
        baseCost: { wood: 24, bones: 8 }
      },
      kitchen: {
        name: "Crooked Kitchen",
        requiredRank: 1,
        description: "Reduces food use and improves forager output.",
        baseCost: { wood: 20, bones: 5 }
      },
      training: {
        name: "Training Pit",
        requiredRank: 2,
        description: "Improves raid attack damage and maximum health.",
        baseCost: { wood: 30, bones: 10 }
      },
      vault: {
        name: "Relic Vault",
        requiredRank: 3,
        description: "Stores relics and adds active relic slots.",
        baseCost: { wood: 38, bones: 16 }
      }
    },
    rituals: {
      moonChant: {
        name: "Moon Chant",
        requiredCircleLevel: 1,
        cost: { devotion: 20 },
        description: "Boosts devotion production for 30 seconds."
      },
      hearthFeast: {
        name: "Hearth Feast",
        requiredCircleLevel: 2,
        cost: { devotion: 14, food: 8 },
        cooldownSeconds: 120,
        description: "Improves every follower's mood and removes raid fatigue."
      },
      soupOfShadows: {
        name: "Soup of Shadows",
        requiredCircleLevel: 2,
        cost: { devotion: 16, bones: 4 },
        cooldownSeconds: 150,
        description: "Makes 16 food and improves follower mood."
      },
      candleTax: {
        name: "Candle Tax",
        requiredCircleLevel: 3,
        cost: { mood: 8 },
        cooldownSeconds: 180,
        description: "Costs 8 follower mood, but grants devotion and cursed wood."
      },
      tinyTeeth: {
        name: "Blessing of Tiny Teeth",
        requiredCircleLevel: 3,
        cost: { devotion: 24, bones: 6 },
        cooldownSeconds: 300,
        description: "Adds +1 attack damage to the next raid."
      }
    },
    relics: [
      {
        id: "moonBell",
        name: "Cracked Moon Bell",
        description: "+15% devotion production.",
        symbol: "BELL"
      },
      {
        id: "hungryIdol",
        name: "Hungry Little Idol",
        description: "+25% food rewards, but followers eat 15% more.",
        symbol: "IDOL"
      },
      {
        id: "boneCrown",
        name: "Bone Crown",
        description: "+30% bone shard rewards.",
        symbol: "CROWN"
      },
      {
        id: "emberCandle",
        name: "Ember Candle",
        description: "+1 raid attack damage.",
        symbol: "EMBER"
      },
      {
        id: "softSkull",
        name: "Soft Skull Charm",
        description: "+1 maximum raid health.",
        symbol: "SKULL"
      },
      {
        id: "mushroomHalo",
        name: "Mushroom Halo",
        description: "+15% chance to recruit a follower.",
        symbol: "HALO"
      },
      {
        id: "whisperingTwig",
        name: "Whispering Twig",
        description: "+30% cursed wood rewards.",
        symbol: "TWIG"
      },
      {
        id: "doomMask",
        name: "Tiny Doom Mask",
        description: "+25% XP from cleared raids.",
        symbol: "MASK"
      }
    ],
    campEvents: [
      {
        id: "glowingMushroom",
        title: "A Glowing Mushroom",
        text: "A follower found a mushroom humming your least favorite hymn.",
        choices: [
          { label: "Cook it carefully", result: "+8 food. Everyone feels better.", effects: { resources: { food: 8 }, mood: 5 } },
          { label: "Offer it to the moon", result: "+10 devotion. The moon says nothing.", effects: { resources: { devotion: 10 } } }
        ]
      },
      {
        id: "moonNightmare",
        title: "A Moon Nightmare",
        text: "Three followers dreamed the moon had teeth and asked for rent.",
        choices: [
          { label: "Hold a group nap", result: "Mood improves and raid fatigue fades.", effects: { mood: 8, fatigue: -1 } },
          { label: "Call it a prophecy", result: "+12 devotion, but morale dips.", effects: { resources: { devotion: 12 }, mood: -4 } }
        ]
      },
      {
        id: "stranger",
        title: "A Damp Stranger",
        text: "A hooded stranger asks to join. Their hood is also wearing a hood.",
        choices: [
          { label: "Welcome them", result: "A new follower joins if housing allows.", effects: { follower: 1 } },
          { label: "Ask for supplies", result: "+7 cursed wood.", effects: { resources: { wood: 7 } } }
        ]
      },
      {
        id: "shrineWhisper",
        title: "The Shrine Whispers",
        text: "The shrine requests bones. It refuses to explain why.",
        choices: [
          { label: "Give 5 bone shards", result: "Trade 5 bones for 14 devotion.", condition: { bones: 5 }, effects: { resources: { bones: -5, devotion: 14 } } },
          { label: "Pretend not to hear", result: "Nothing happens. Suspiciously.", effects: {} }
        ]
      },
      {
        id: "screamingCandle",
        title: "A Candle Is Screaming",
        text: "It is not especially loud, but it is extremely committed.",
        choices: [
          { label: "Put it in the ritual circle", result: "+8 devotion and slightly worse moods.", effects: { resources: { devotion: 8 }, mood: -3 } },
          { label: "Give it a tiny blanket", result: "Everyone is delighted.", effects: { mood: 10 } }
        ]
      }
    ],
    raid: {
      recruitChance: 0.25,
      relicChance: 0.72,
      worldWidth: 360,
      worldHeight: 520
    }
  };

  C.Helpers = {
    clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    },

    randomItem(items) {
      return items[Math.floor(Math.random() * items.length)];
    },

    createFollower(existingNames) {
      const unusedNames = C.DATA.names.filter((name) => !existingNames.includes(name));
      const name = C.Helpers.randomItem(unusedNames.length ? unusedNames : C.DATA.names);
      const trait = C.Helpers.randomItem(C.DATA.traits);

      return {
        id: `follower-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name,
        trait: trait.name,
        job: "worshipper",
        moodValue: trait.name === "Lazy but Loyal" ? 76 : 70,
        color: C.Helpers.randomItem(["#bca7ff", "#8cd9c3", "#f09f8d", "#d7d47a", "#91b9e8"])
      };
    }
  };
})();
