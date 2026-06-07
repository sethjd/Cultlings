(function () {
  const C = window.Cultlings = window.Cultlings || {};

  C.RETENTION = {
    dailyRewards: [
      { day: 1, label: "A Small Offering", icon: "D", reward: { resources: { devotion: 20 } } },
      { day: 2, label: "Pantry Parcel", icon: "F", reward: { resources: { food: 18 } } },
      { day: 3, label: "Crooked Timber", icon: "W", reward: { resources: { wood: 14 }, tokens: 1 } },
      { day: 4, label: "Pocket Bones", icon: "B", reward: { resources: { bones: 8 }, xp: 10 } },
      { day: 5, label: "Moon Allowance", icon: "XP", reward: { xp: 20, tokens: 1 } },
      { day: 6, label: "Cult Care Package", icon: "+", reward: { resources: { devotion: 25, food: 20, wood: 10 } } },
      { day: 7, label: "Seven-Day Omen", icon: "7", reward: { xp: 30, tokens: 2, relicChance: 0.35 } }
    ],

    quests: {
      daily: [
        { id: "dailyRaid", name: "A Brief Expedition", description: "Clear 1 raid.", metric: "raidClear", target: 1, reward: { xp: 10, tokens: 1 } },
        { id: "dailyDevotion", name: "Fill the Little Cup", description: "Collect 100 devotion.", metric: "devotionCollected", target: 100, reward: { resources: { bones: 5 }, xp: 8 } },
        { id: "dailyFeed", name: "Dinner Is Mandatory", description: "Feed the followers once.", metric: "feedFollowers", target: 1, reward: { resources: { devotion: 15 }, tokens: 1 } },
        { id: "dailyUpgrade", name: "Improve Something Wobbly", description: "Upgrade any building.", metric: "buildingUpgrade", target: 1, reward: { resources: { wood: 12 }, xp: 10 } },
        { id: "dailyEnemies", name: "Reduce Local Rudeness", description: "Defeat 10 enemies.", metric: "enemyDefeat", target: 10, reward: { resources: { bones: 7 }, xp: 8 } },
        { id: "dailyRitual", name: "Make the Moon Look", description: "Perform 1 ritual.", metric: "ritual", target: 1, reward: { resources: { devotion: 18 }, tokens: 1 } },
        { id: "dailyRecruit", name: "One More Tiny Chair", description: "Recruit 1 follower.", metric: "followerRecruit", target: 1, reward: { resources: { food: 16 }, xp: 12 } }
      ],
      permanent: [
        { id: "rankFive", name: "Properly Questionable", description: "Reach Godling Rank 5.", metric: "rank", target: 5, reward: { xp: 40, tokens: 4 } },
        { id: "tenFollowers", name: "Crowded Little Prophecy", description: "Own 10 followers.", metric: "followerCount", target: 10, reward: { resources: { food: 40 }, tokens: 3 } },
        { id: "shrineFive", name: "A Respectable Pile of Stones", description: "Upgrade the Moon Shrine to level 5.", metric: "shrineLevel", target: 5, reward: { xp: 35, tokens: 3 } },
        { id: "asyncFive", name: "Knock Politely, Then Raid", description: "Win 5 asynchronous raids.", metric: "asyncWins", target: 5, reward: { resources: { bones: 25 }, tokens: 5 } },
        { id: "tenRelics", name: "Questionable Museum", description: "Collect 10 relic finds, including duplicates.", metric: "relicFinds", target: 10, reward: { xp: 50, tokens: 5 } }
      ]
    },

    titles: [
      { id: "candleWhisperer", name: "Candle Whisperer", description: "Starter title.", metric: "rank", target: 1 },
      { id: "tinyDoomkeeper", name: "Tiny Doomkeeper", description: "Reach Rank 2.", metric: "rank", target: 2 },
      { id: "moonMoldMonarch", name: "Moon-Mold Monarch", description: "Own 8 followers.", metric: "followerCount", target: 8 },
      { id: "softSkullSaint", name: "Soft Skull Saint", description: "Collect 3 different relics.", metric: "relicCount", target: 3 },
      { id: "babyDarkGod", name: "Baby Dark God", description: "Clear 5 raids.", metric: "raidClearTotal", target: 5 },
      { id: "littleOmen", name: "The Little Omen", description: "Reach Rank 5.", metric: "rank", target: 5 }
    ],

    cosmetics: [
      { id: "maskBareMoon", category: "masks", name: "Bare Moon", description: "Your original tiny divine face.", icon: "MOON", cost: 0, className: "mask-bare-moon" },
      { id: "maskWaxSmile", category: "masks", name: "Wax Smile", description: "Cheerful in a strictly structural sense.", icon: "WAX", cost: 3, className: "mask-wax-smile" },
      { id: "maskBoneVisor", category: "masks", name: "Bone Visor", description: "One bone, two eye holes, zero regrets.", icon: "BONE", cost: 4, className: "mask-bone-visor" },
      { id: "maskMushroom", category: "masks", name: "Mushroom Face", description: "Damp, dignified, and slightly spotted.", icon: "CAP", cost: 4, className: "mask-mushroom" },
      { id: "maskStarVeil", category: "masks", name: "Star Veil", description: "For mysterious errands after bedtime.", icon: "STAR", cost: 6, className: "mask-star-veil" },

      { id: "shrineDampStone", category: "shrines", name: "Damp Stone", description: "The classic shrine. Reliably moist.", icon: "STONE", cost: 0, className: "shrine-damp-stone" },
      { id: "shrineEmber", category: "shrines", name: "Ember Roof", description: "Warm light and very nervous moss.", icon: "EMBER", cost: 3, className: "shrine-ember" },
      { id: "shrineMushroom", category: "shrines", name: "Mushroom Shrine", description: "The roof is technically alive.", icon: "SPORE", cost: 4, className: "shrine-mushroom" },
      { id: "shrineBoneArch", category: "shrines", name: "Bone Arch", description: "Architecturally rude, spiritually sound.", icon: "ARCH", cost: 5, className: "shrine-bone-arch" },
      { id: "shrineViolet", category: "shrines", name: "Violet Moon", description: "Purple enough to feel expensive. It was not.", icon: "VIOLET", cost: 6, className: "shrine-violet" },

      { id: "hatSoftCap", category: "hats", name: "Soft Cult Cap", description: "A practical hat for impractical work.", icon: "CAP", cost: 0, className: "hat-soft-cap" },
      { id: "hatCandle", category: "hats", name: "Tiny Candle", description: "No followers were singed during fitting.", icon: "WICK", cost: 2, className: "hat-candle" },
      { id: "hatMushroom", category: "hats", name: "Mushroom Cap", description: "Grows back if misplaced.", icon: "SHROOM", cost: 3, className: "hat-mushroom" },
      { id: "hatBoneBow", category: "hats", name: "Bone Bow", description: "Formalwear for sorting remains.", icon: "BOW", cost: 4, className: "hat-bone-bow" },
      { id: "hatTwigCrown", category: "hats", name: "Twig Crown", description: "A monarchy assembled from yard waste.", icon: "TWIG", cost: 5, className: "hat-twig-crown" },

      { id: "bannerLittleMoon", category: "banners", name: "Little Moon", description: "The official flag of trying your best.", icon: "MOON", cost: 0, className: "banner-little-moon" },
      { id: "bannerCandleTeeth", category: "banners", name: "Candle Teeth", description: "Smiles warmly. Bites warmly too.", icon: "TEETH", cost: 3, className: "banner-candle-teeth" },
      { id: "bannerSoftSkull", category: "banners", name: "Soft Skull", description: "A comforting warning.", icon: "SKULL", cost: 4, className: "banner-soft-skull" },
      { id: "bannerMoldSpiral", category: "banners", name: "Mold Spiral", description: "Every spot is part of the design.", icon: "MOLD", cost: 5, className: "banner-mold-spiral" },
      { id: "bannerTinyDoom", category: "banners", name: "Tiny Doom", description: "Doom, but sized for portrait screens.", icon: "DOOM", cost: 6, className: "banner-tiny-doom" },

      { id: "sigilCrookedMoon", category: "sigils", name: "Crooked Moon", description: "A familiar circle with poor posture.", icon: "MOON", cost: 0, className: "sigil-crooked-moon" },
      { id: "sigilTeeth", category: "sigils", name: "Tiny Teeth", description: "The ground appears ready for dinner.", icon: "BITE", cost: 2, className: "sigil-teeth" },
      { id: "sigilMushroomRing", category: "sigils", name: "Mushroom Ring", description: "Invites spores and awkward dancing.", icon: "RING", cost: 3, className: "sigil-mushroom-ring" },
      { id: "sigilBoneStar", category: "sigils", name: "Bone Star", description: "Points north-ish.", icon: "STAR", cost: 4, className: "sigil-bone-star" },
      { id: "sigilWhisper", category: "sigils", name: "Whisper Spiral", description: "Says something different to every shoe.", icon: "SPIRAL", cost: 5, className: "sigil-whisper" }
    ],

    cosmeticCategories: {
      masks: "Player Masks",
      shrines: "Shrine Skins",
      hats: "Follower Hats",
      banners: "Cult Banners",
      sigils: "Ground Sigils"
    },

    collections: {
      followers: [
        { id: "alwaysHungry", match: "Always Hungry", name: "Always Hungry", icon: "BITE", description: "Can hear a pantry open from three rooms away." },
        { id: "secretRat", match: "Secretly a Rat", name: "Secretly a Rat", icon: "RAT?", description: "The secret is not surviving close inspection." },
        { id: "greatChanter", match: "Great Chanter", name: "Great Chanter", icon: "LA", description: "Knows one note and means it deeply." },
        { id: "candleFear", match: "Afraid of Candles", name: "Afraid of Candles", icon: "EEK", description: "A difficult trait in the current economy." },
        { id: "mushroomBlessed", match: "Mushroom Blessed", name: "Mushroom Blessed", icon: "CAP", description: "Chosen by fungi. Nobody knows for what." },
        { id: "lazyLoyal", match: "Lazy but Loyal", name: "Lazy but Loyal", icon: "NAP", description: "Would follow you anywhere after lunch." },
        { id: "tinyProphet", match: "Tiny Prophet", name: "Tiny Prophet", icon: "EYE", description: "Predicts rain whenever already wet." }
      ],
      enemies: [
        { id: "candleGoblin", match: "Candle Goblin", name: "Candle Goblin", icon: "WICK", description: "Runs at anything shiny, holy, or mildly warm." },
        { id: "boneBeetle", match: "Bone Beetle", name: "Bone Beetle", icon: "BONE", description: "Not technically a beetle. Mostly bone. Still rude." },
        { id: "hexWisp", match: "Hex Wisp", name: "Hex Wisp", icon: "HEX", description: "Floats just out of reach because it knows." },
        { id: "waxBrute", match: "The Wax-Head Brute", name: "Wax-Head Brute", icon: "WAX", description: "A large argument against indoor candles." },
        { id: "cultGuard", match: "Cult Guard", name: "Cult Guard", icon: "GUARD", description: "Another cultling with a stick and strong boundaries." }
      ]
    }
  };
})();
