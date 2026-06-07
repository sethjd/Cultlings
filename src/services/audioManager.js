(function () {
  const C = window.Cultlings = window.Cultlings || {};
  let context = null;
  let master = null;

  const soundProfiles = {
    tap: { wave: "sine", start: 420, end: 520, duration: 0.045, gain: 0.045 },
    attack: { wave: "square", start: 190, end: 85, duration: 0.08, gain: 0.06 },
    hit: { wave: "sawtooth", start: 130, end: 75, duration: 0.07, gain: 0.055 },
    death: { wave: "triangle", start: 170, end: 38, duration: 0.18, gain: 0.065 },
    collect: { wave: "sine", start: 510, end: 880, duration: 0.13, gain: 0.06 },
    ritual: { wave: "sine", start: 180, end: 460, duration: 0.42, gain: 0.055 },
    victory: { wave: "triangle", start: 300, end: 720, duration: 0.5, gain: 0.07 },
    defeat: { wave: "sawtooth", start: 190, end: 58, duration: 0.48, gain: 0.055 },
    dodge: { wave: "sine", start: 380, end: 110, duration: 0.12, gain: 0.05 },
    special: { wave: "triangle", start: 120, end: 640, duration: 0.34, gain: 0.075 }
  };

  function settings() {
    return C.store && C.store.state.settings
      ? C.store.state.settings
      : { sound: true, volume: 0.55 };
  }

  function updateVolume() {
    if (!master) return;
    master.gain.value = settings().sound ? settings().volume : 0;
  }

  function unlock() {
    if (!window.AudioContext && !window.webkitAudioContext) return false;
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      context = new AudioContextClass();
      master = context.createGain();
      master.connect(context.destination);
      updateVolume();
    }
    if (context.state === "suspended") context.resume().catch(() => {});
    return true;
  }

  function play(name) {
    const profile = soundProfiles[name];
    if (!profile || !settings().sound || settings().volume <= 0 || !unlock()) return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = profile.wave;
    oscillator.frequency.setValueAtTime(profile.start, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, profile.end), now + profile.duration);
    gain.gain.setValueAtTime(profile.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + profile.duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + profile.duration + 0.02);
  }

  C.Audio = {
    unlock,
    play,
    refresh: updateVolume,
    setEnabled(enabled) {
      C.store.setSoundEnabled(enabled);
      updateVolume();
      if (enabled) play("tap");
    },
    setVolume(volume) {
      C.store.setVolume(volume);
      updateVolume();
    }
  };
})();
