# Turns narration WAVs into the site files: audio/guide/<id>.mp3 (loudness-normalised) and
# src/guide-data.json (duration, per-word start times from faster-whisper, loudness envelope for the waveform).
# Usage: python finish.py <faster-whisper-model-dir> steps.json <wav-dir> audio/guide src/guide-data.json
import sys, json, re, subprocess, difflib, os
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

whisper_dir, steps_path, wav_dir, out_audio, out_json = sys.argv[1:6]
steps = json.load(open(steps_path))
data = json.load(open(out_json)) if os.path.exists(out_json) else {}
m = WhisperModel(whisper_dir, device="cpu", compute_type="int8", cpu_threads=4)
norm = lambda w: re.sub(r"[^a-zа-я0-9]", "", w.lower().replace("ё", "е"))

for s in steps:
    wav = f"{wav_dir}/{s['id']}.wav"
    if not os.path.exists(wav):
        continue
    mp3 = f"{out_audio}/{s['id']}.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "24000", "-ac", "1", "-b:a", "56k", mp3], check=True)
    y, sr = sf.read(wav, dtype="float32")
    if y.ndim > 1: y = y.mean(1)
    hop = sr // 25
    rms = np.array([np.sqrt(np.mean(y[i:i + hop] ** 2)) for i in range(0, len(y), hop)])
    env = (np.clip(rms / (np.percentile(rms, 97) + 1e-6), 0, 1) ** 0.7 * 100).round().astype(int).tolist()
    y16 = resample_poly(y, 16000, sr).astype(np.float32)
    segs, _ = m.transcribe(y16, language="ru", beam_size=5, word_timestamps=True)
    hw = [(w.word.strip(), w.start) for seg in segs for w in seg.words]
    heard = " ".join(w for w, _ in hw)
    ours = s["text"].split()
    a = [norm(w) for w in ours]
    b = [norm(w) for w, _ in hw]
    times = [None] * len(ours)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = hw[blk.b + k][1]
    matched = sum(t is not None for t in times)
    dur = len(y) / sr
    known = [(i, t) for i, t in enumerate(times) if t is not None]
    for i in range(len(times)):
        if times[i] is None:
            prev = max([k for k in known if k[0] < i], default=(-1, 0.0), key=lambda k: k[0])
            nxt = min([k for k in known if k[0] > i], default=(len(times), dur), key=lambda k: k[0])
            times[i] = prev[1] + (nxt[1] - prev[1]) * (i - prev[0]) / (nxt[0] - prev[0])
    words_ok = len([x for x in a if x])
    ratio = difflib.SequenceMatcher(None, " ".join(x for x in a if x), " ".join(x for x in b if x)).ratio()
    data[s["id"]] = {"dur": round(dur, 2), "words": [round(t, 2) for t in times], "env": env}
    print(f"{s['id']:7} dur {dur:5.1f}s  words matched {matched}/{words_ok}  text-similarity {ratio:.3f}", flush=True)
    print("   heard:", heard, flush=True)
json.dump(data, open(out_json, "w"), ensure_ascii=False, separators=(",", ":"))
