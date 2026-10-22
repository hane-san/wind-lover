# Wind Lover original loops

These four compositions were created for this game from `music/scores.mjs`, using the offline synthesiser in `music/journey-music.mjs`. No external recordings, samples or melodies are included.

Each WAV contains one 32-bar loop, rendered at 24 kHz in stereo, with the preceding cycle's note and delay tails carried into the beginning. The Ogg files are Vorbis encodes of those WAVs (`ffmpeg -i source.wav -c:a libvorbis -q:a 5 output.ogg`). Keep both formats: the runtime tries Ogg first and uses PCM WAV if decoding fails. Neither format has a listening-preview fade at the boundaries.

Playback loads only the selected song after music is enabled; it does not preload this whole directory. See `docs/MUSIC.md` for integration and verification notes.


The eight compositions added on 22 October 2026 are baked from `music/scores.mjs` with `python tools/render-music.py`. Each has an Ogg Vorbis loop and a lossless PCM WAV fallback. The original four files remain unchanged. See `docs/HORSE-AND-HORIZONS.md` for regional pools and browser verification.
