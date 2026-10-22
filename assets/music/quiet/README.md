# Quiet journey arrangements

Twelve original 24 kHz stereo Vorbis loops, generated from `music/quiet-score.mjs`
and the WebAudio instruments in `music/journey-music.mjs`. These recordings replace
the driving mixes in normal playback whilst preserving track IDs and regional pools.
No music or samples from another game are included.

Rebuild with Playwright for Python, Chromium and FFmpeg:

```sh
python tools/render-quiet-music.py --browser /path/to/chromium
python tests/quiet-music-browser.py --browser /path/to/chromium --recordings
```

If a browser cannot decode Vorbis, playback renders the same score once with
OfflineAudioContext. The previous recordings remain in the parent directory as
development archives. See `docs/MUSIC.md` and `docs/QUIET-JOURNEY.md` for details.
