const audio = new Audio();
audio.preload = 'metadata';

let _onTimeUpdate = null;
let _onEnded = null;

audio.addEventListener('timeupdate', () => {
  if (_onTimeUpdate && audio.duration) {
    _onTimeUpdate(audio.currentTime / audio.duration);
  }
});

audio.addEventListener('ended', () => {
  if (_onEnded) _onEnded();
});

export async function play(src) {
  if (audio.src !== new URL(src, location.href).href) {
    audio.src = src;
  }
  await audio.play();
}

export function pause() {
  audio.pause();
}

export function seek(pct) {
  if (audio.duration) audio.currentTime = pct * audio.duration;
}

export function onTimeUpdate(cb) {
  _onTimeUpdate = cb;
}

export function onEnded(cb) {
  _onEnded = cb;
}

export function isPlaying() {
  return !audio.paused;
}
