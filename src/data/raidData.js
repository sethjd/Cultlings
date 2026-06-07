(function () {
  const C = window.Cultlings = window.Cultlings || {};

  C.RAID_DATA = {
    runLength: 5,
    roomTypes: {
      combat: { name: "Combat", icon: "!", description: "Quick fight with normal resource rewards." },
      elite: { name: "Elite Combat", icon: "!!", description: "Tougher enemies, better loot, and a blessing." },
      treasure: { name: "Treasure", icon: "$", description: "Resources and a chance to uncover a relic." },
      rescue: { name: "Follower Rescue", icon: "+", description: "Free a damp stranger and perhaps recruit them." },
      shrine: { name: "Ritual Shrine", icon: "*", description: "Choose healing, power, or a Dark Blessing." },
      supplies: { name: "Camp Supplies", icon: "S", description: "Collect food and cursed wood." },
      boss: { name: "Boss", icon: "B", description: "Defeat the biome guardian and finish the raid." }
    },

    biomes: [
      {
        id: "candlewood",
        name: "Candlewood Grove",
        requiredRank: 1,
        tagline: "Candles, mushrooms, and roots with opinions.",
        theme: { top: "#14162a", bottom: "#29303c", accent: "#f0a55f", mist: "#74638e" },
        layouts: ["clearing", "roots"],
        enemies: ["candleGoblin", "boneBeetle", "rootGrasper", "tinyHeretic"],
        boss: "waxBrute",
        bossName: "The Wax-Head Brute",
        resourceBias: "wood"
      },
      {
        id: "moldmoon",
        name: "Moldmoon Marsh",
        requiredRank: 4,
        tagline: "Purple mist, wet prophecies, and ambitious spores.",
        theme: { top: "#111d2c", bottom: "#263c3d", accent: "#9fdf9a", mist: "#9a68ba" },
        layouts: ["marsh", "puddles"],
        enemies: ["sporeImp", "bogSkull", "hexWisp", "rootGrasper", "tinyHeretic"],
        boss: "wetProphet",
        bossName: "The Big Wet Prophet",
        resourceBias: "food"
      },
      {
        id: "bellbone",
        name: "Bellbone Crypt",
        requiredRank: 7,
        tagline: "Cracked bells, skull pillars, and echoes that bite.",
        theme: { top: "#14121f", bottom: "#30273b", accent: "#d7cfaa", mist: "#766c9f" },
        layouts: ["crypt", "bells"],
        enemies: ["bellWraith", "boneBeetle", "graveCandle", "bogSkull", "tinyHeretic"],
        boss: "hollowbell",
        bossName: "Saint Hollowbell",
        resourceBias: "bones"
      }
    ],

    blessings: [
      { id: "sharpMoon", name: "Sharp Little Moon", icon: "MOON", description: "+1 attack damage." },
      { id: "candleFeet", name: "Candle Feet", icon: "FEET", description: "+25% movement speed." },
      { id: "boneSkin", name: "Bone Skin", icon: "BONE", description: "+2 maximum health and heal 2." },
      { id: "hungryHalo", name: "Hungry Halo", icon: "HALO", description: "Heal 1 after every cleared room." },
      { id: "echoPaw", name: "Echo Paw", icon: "ECHO", description: "Attacks have a 25% chance to hit twice." },
      { id: "mushroomLuck", name: "Mushroom Luck", icon: "LUCK", description: "+25% room resources." },
      { id: "tinyThunder", name: "Tiny Thunder", icon: "ZAP", description: "Moon Pulse cooldown reduced to 6 seconds." },
      { id: "doomMagnet", name: "Doom Magnet", icon: "PULL", description: "Nearby pickups drift toward you." }
    ],

    enemies: [
      { id: "sporeImp", name: "Spore Imp", icon: "SPORE", description: "Runs quickly and leaves a poisonous goodbye." },
      { id: "bogSkull", name: "Bog Skull", icon: "BOG", description: "A wet skull with excellent aim and no body plan." },
      { id: "graveCandle", name: "Grave Candle", icon: "WICK", description: "Stays perfectly still and makes that everyone else's problem." },
      { id: "bellWraith", name: "Bell Wraith", icon: "BELL", description: "Briefly phases out whenever manners become inconvenient." },
      { id: "rootGrasper", name: "Root Grasper", icon: "ROOT", description: "Plants slowing roots beneath hurried little gods." },
      { id: "tinyHeretic", name: "Tiny Heretic", icon: "RUN", description: "Runs away while loudly improving everyone else." },
      { id: "wetProphet", name: "The Big Wet Prophet", icon: "WET", description: "Foretells rain from inside the rain." },
      { id: "hollowbell", name: "Saint Hollowbell", icon: "TOLL", description: "A holy echo wrapped around an extremely empty saint." }
    ]
  };
})();
