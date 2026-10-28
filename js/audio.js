// All sound is made in code with the Web Audio API: a soft 120 BPM music-box track,
// a heartbeat pulse, and little UI sounds. An optional mp3 from config can replace the music.

const BPM = 120;
const BEAT = 60 / BPM;
const STEP = BEAT / 2; // eighth notes

// Dmaj9 – Bm9 – Gmaj9 – A6sus: warm and a bit nostalgic. MIDI note numbers.
const CHORDS = [
  [50, 57, 61, 64, 66],
  [47, 54, 57, 61, 62],
  [43, 50, 54, 57, 59],
  [45, 52, 54, 57, 59],
];
const ARP = [0, 2, 1, 3, 2, 4, 3, 1]; // which chord tone each eighth note plays

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const perfStart = performance.now();

let ctx = null;
let master, musicBus, sfxBus, reverb;
let startTime = 0;
let nextStepTime = 0;
let step = 0;
let schedulerId = null;
let song = null;
let muted = readMuted();

function readMuted() {
  try { return localStorage.getItem('bday-muted') === '1'; } catch { return false; }
}

function saveMuted() {
  try { localStorage.setItem('bday-muted', muted ? '1' : '0'); } catch { /* storage blocked: preference just isn't remembered */ }
}

// A reverb "room" made from decaying noise, so nothing needs to be downloaded.
function makeImpulse(seconds = 3.2) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

function voice(type, freq, time, { attack = 0.01, decay = 1, gain = 0.2, detune = 0, dest = musicBus, wet = 0.4 } = {}) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(gain, time + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  osc.connect(env);
  env.connect(dest);
  if (wet) {
    const send = ctx.createGain();
    send.gain.value = wet;
    env.connect(send);
    send.connect(reverb);
  }
  osc.start(time);
  osc.stop(time + attack + decay + 0.05);
}

function pad(chord, time, length) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.4;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(0.05, time + 1.4);
  env.gain.setValueAtTime(0.05, time + length - 1.2);
  env.gain.exponentialRampToValueAtTime(0.0001, time + length + 0.8);
  filter.connect(env);
  env.connect(musicBus);
  const send = ctx.createGain();
  send.gain.value = 0.6;
  env.connect(send);
  send.connect(reverb);

  for (const note of chord.slice(0, 4)) {
    for (const cents of [-7, 7]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = midiToHz(note);
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start(time);
      osc.stop(time + length + 1);
    }
  }
}

// Soft "lub-dub" heartbeat.
function heartbeat(time, gain) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.frequency.setValueAtTime(90, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.18);
  env.gain.setValueAtTime(0.0001, time);
  env.gain.exponentialRampToValueAtTime(gain, time + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
  osc.connect(env);
  env.connect(musicBus);
  osc.start(time);
  osc.stop(time + 0.35);
}

function scheduleStep(i, time) {
  const bar = Math.floor(i / 8);
  const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
  const inBar = i % 8;

  if (inBar === 0 && bar % 2 === 0) pad(chord, time, BEAT * 8);
  // lub-dub every two beats, matching the glowing dot's pulse
  if (inBar % 4 === 0) {
    heartbeat(time, 0.32);
    heartbeat(time + 0.22, 0.18);
  }
  // music-box arpeggio, an octave up, skipping some notes so it breathes
  if ([0, 2, 3, 5, 7].includes(inBar)) {
    const note = chord[ARP[inBar] % chord.length] + 24;
    voice('sine', midiToHz(note), time, { decay: 1.4, gain: 0.05, wet: 0.7 });
    voice('triangle', midiToHz(note + 12), time, { decay: 0.5, gain: 0.012, wet: 0.7 });
  }
}

function scheduler() {
  while (nextStepTime < ctx.currentTime + 0.12) {
    scheduleStep(step, nextStepTime);
    step++;
    nextStepTime += STEP;
  }
}

function startSynth() {
  startTime = ctx.currentTime + 0.05;
  nextStepTime = startTime;
  step = 0;
  schedulerId = setInterval(scheduler, 25);
}

// Try the optional mp3; fall back to the synth if it's missing or can't play.
function startMusic(songSrc) {
  if (!songSrc) return startSynth();
  let fellBack = false;
  const fallback = (reason) => {
    if (fellBack) return;
    fellBack = true;
    console.info('No song file found, playing the built-in music instead.', reason || '');
    song = null;
    startSynth();
  };
  song = new Audio(songSrc);
  song.loop = true;
  song.addEventListener('error', () => fallback(), { once: true });
  ctx.createMediaElementSource(song).connect(musicBus);
  song.play().catch(fallback);
}

function noise(seconds) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

const ready = () => ctx && !muted;

export const audio = {
  get muted() { return muted; },

  start(songSrc) {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.8;
    sfxBus = ctx.createGain();
    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse();
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 0.5;
    reverb.connect(reverbOut);
    [musicBus, sfxBus, reverbOut].forEach((n) => n.connect(master));
    startMusic(songSrc);

    // Pause sound when the tab is hidden.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) ctx.suspend();
      else if (!muted) ctx.resume();
    });
  },

  toggle() {
    muted = !muted;
    saveMuted();
    if (ctx) {
      if (!muted) ctx.resume();
      master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.15);
    }
    return muted;
  },

  // Where we are in the music: whole beats since start, plus 0..1 progress inside the beat.
  // Without sound it keeps the same 120 BPM clock so visuals still pulse.
  beat() {
    const t = ctx && !song ? ctx.currentTime - startTime : (performance.now() - perfStart) / 1000;
    const beats = Math.max(0, t / BEAT);
    return { beats, phase: beats % 1 };
  },

  chime(soft = false) {
    if (!ready()) return;
    const t = ctx.currentTime;
    [86, 90, 93, 98].forEach((m, i) => {
      voice('sine', midiToHz(m), t + i * 0.07, { decay: 1.6, gain: soft ? 0.03 : 0.06, dest: sfxBus, wet: 0.8 });
    });
  },

  pop() {
    if (!ready()) return;
    const t = ctx.currentTime;
    voice('sine', 880, t, { decay: 0.18, gain: 0.08, dest: sfxBus, wet: 0.3 });
    voice('sine', 1320, t + 0.04, { decay: 0.25, gain: 0.04, dest: sfxBus, wet: 0.5 });
  },

  // catch-game ping: the pitch climbs with each heart caught in a row
  blip(step = 1) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const note = 74 + [0, 2, 4, 7, 9, 12, 14, 16, 19][Math.min(step - 1, 8)];
    voice('sine', midiToHz(note), t, { decay: 0.25, gain: 0.07, dest: sfxBus, wet: 0.4 });
  },

  // a dull thump for broken hearts
  thud() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.25);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(env);
    env.connect(sfxBus);
    osc.start(t);
    osc.stop(t + 0.35);
  },

  // a tiny two-note "mwah" for the tap hearts
  kiss() {
    if (!ready()) return;
    const t = ctx.currentTime;
    voice('sine', 1568, t, { decay: 0.12, gain: 0.025, dest: sfxBus, wet: 0.5 });
    voice('sine', 2093, t + 0.06, { decay: 0.3, gain: 0.02, dest: sfxBus, wet: 0.6 });
  },

  whoosh() {
    if (!ready()) return;
    const t = ctx.currentTime;
    const src = noise(0.5);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 1.2;
    band.frequency.setValueAtTime(300, t);
    band.frequency.exponentialRampToValueAtTime(2600, t + 0.32);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.22, t + 0.08);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    src.connect(band);
    band.connect(env);
    env.connect(sfxBus);
    src.start(t);
  },

  // A big warm bloom for the wish and the quiz result.
  wish() {
    if (!ready()) return;
    const t = ctx.currentTime;
    [62, 66, 69, 73, 76, 78].forEach((m, i) => {
      voice('sine', midiToHz(m), t + i * 0.09, { attack: 0.05, decay: 3, gain: 0.05, dest: sfxBus, wet: 0.9 });
      voice('triangle', midiToHz(m + 12), t + i * 0.09 + 0.02, { decay: 1.5, gain: 0.015, dest: sfxBus, wet: 0.9 });
    });
  },
};
