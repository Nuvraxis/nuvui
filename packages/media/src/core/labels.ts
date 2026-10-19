/**
 * Every word the players show or say. Pass some or all of them as `labels`
 * to translate a player.
 */
export interface MediaLabels {
  /** The video player's name when it's given no `aria-label` and no `title`. */
  video: string;
  /** The audio player's name when it's given no `aria-label` and no `title`. */
  audio: string;
  /** The transcript's name when it's given no `aria-label`. */
  transcript: string;
  play: string;
  pause: string;
  replay: string;
  mute: string;
  unmute: string;
  volume: string;
  /** The seek bar's name. */
  seek: string;
  enterFullscreen: string;
  exitFullscreen: string;
  enterPictureInPicture: string;
  exitPictureInPicture: string;
  captions: string;
  settings: string;
  speed: string;
  /** The speed of 1, in the speed menu. */
  normalSpeed: string;
  quality: string;
  /** Quality chosen by the player, with the one it's on now if known. */
  auto: (current?: string) => string;
  audioTrack: string;
  /** Captions turned off, in the captions menu. */
  off: string;
  captionSize: string;
  small: string;
  medium: string;
  large: string;
  skipBack: (seconds: number) => string;
  skipAhead: (seconds: number) => string;
  /** The time button's name while it shows the time played. */
  showRemaining: string;
  /** The time button's name while it shows the time left. */
  showElapsed: string;
  live: string;
  loading: string;
  errorNetwork: string;
  errorDecode: string;
  errorUnsupported: string;
  /** The same three, for the audio player. */
  audioErrorNetwork: string;
  audioErrorDecode: string;
  audioErrorUnsupported: string;
  retry: string;
  shortcuts: string;
  close: string;
  /** Spoken lengths of time, for the seek bar's value. */
  hours: (count: number) => string;
  minutes: (count: number) => string;
  seconds: (count: number) => string;
  /** The seek bar's value: "1 minute 5 seconds of 4 minutes". */
  timeOf: (current: string, total: string) => string;
  /** Said when captions are turned on, with the track's name. */
  captionsOn: (track: string) => string;
  captionsOff: string;
  speedChanged: (rate: string) => string;
  qualityChanged: (quality: string) => string;
  /** What each shortcut does, in the shortcuts sheet. */
  shortcutPlay: string;
  shortcutVolume: string;
  shortcutMute: string;
  shortcutFullscreen: string;
  shortcutCaptions: string;
  shortcutJump: string;
  shortcutSpeed: string;
  shortcutFrame: string;
  shortcutShortcuts: string;
}

const count = (one: string, many: string) => (n: number) =>
  `${n} ${n === 1 ? one : many}`;

export const englishLabels: MediaLabels = {
  video: "Video",
  audio: "Audio",
  transcript: "Transcript",
  play: "Play",
  pause: "Pause",
  replay: "Play again",
  mute: "Mute",
  unmute: "Unmute",
  volume: "Volume",
  seek: "Seek",
  enterFullscreen: "Full screen",
  exitFullscreen: "Exit full screen",
  enterPictureInPicture: "Picture in picture",
  exitPictureInPicture: "Exit picture in picture",
  captions: "Captions",
  settings: "Settings",
  speed: "Speed",
  normalSpeed: "Normal",
  quality: "Quality",
  auto: (current) => (current ? `Auto (${current})` : "Auto"),
  audioTrack: "Audio",
  off: "Off",
  captionSize: "Caption size",
  small: "Small",
  medium: "Medium",
  large: "Large",
  skipBack: (seconds) => `Back ${seconds} seconds`,
  skipAhead: (seconds) => `Ahead ${seconds} seconds`,
  showRemaining: "Show the time left",
  showElapsed: "Show the time played",
  live: "Live",
  loading: "Loading",
  errorNetwork:
    "The video couldn't be loaded. Check the connection and try again.",
  errorDecode: "The video couldn't be played.",
  errorUnsupported: "This video can't be played in this browser.",
  audioErrorNetwork:
    "The audio couldn't be loaded. Check the connection and try again.",
  audioErrorDecode: "The audio couldn't be played.",
  audioErrorUnsupported: "This audio can't be played in this browser.",
  retry: "Try again",
  shortcuts: "Keyboard shortcuts",
  close: "Close",
  hours: count("hour", "hours"),
  minutes: count("minute", "minutes"),
  seconds: count("second", "seconds"),
  timeOf: (current, total) => `${current} of ${total}`,
  captionsOn: (track) => `Captions on, ${track}`,
  captionsOff: "Captions off",
  speedChanged: (rate) => `Speed ${rate}`,
  qualityChanged: (quality) => `Quality ${quality}`,
  shortcutPlay: "Play or pause",
  shortcutVolume: "Volume up or down",
  shortcutMute: "Mute or unmute",
  shortcutFullscreen: "Full screen",
  shortcutCaptions: "Captions on or off",
  shortcutJump: "Go to a tenth of the way",
  shortcutSpeed: "Slower or faster",
  shortcutFrame: "One frame back or ahead, while paused",
  shortcutShortcuts: "Show these shortcuts",
};
