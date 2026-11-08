# Narrates every guide step in the saved voice "Лина" (voice-lina.wav) with VoiceStudio's OmniVoice engine.
# Usage: python narrate.py <omnivoice-model-dir> steps.json <wav-out-dir> [step ids...]
import os, sys, json, time, torch, soundfile as sf
from omnivoice import OmniVoice
torch.set_num_threads(4)
model_dir, steps_path, out_dir = sys.argv[1:4]
only = set(sys.argv[4:])
m = OmniVoice.from_pretrained(model_dir, device_map="cpu", dtype=torch.float32)
REF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "voice-lina.wav")
REF_TEXT = "Привет! Я Лина, твой гид по лаборатории физики. Здесь физику не читают, а трогают руками."
for s in json.load(open(steps_path)):
    if only and s["id"] not in only:
        continue
    t = time.time()
    torch.manual_seed(11)
    a = m.generate(text=s["text"], language="Russian", ref_audio=REF, ref_text=REF_TEXT, num_step=32)
    sf.write(f"{out_dir}/{s['id']}.wav", a[0].squeeze(0).numpy(), m.sampling_rate)
    print(s["id"], "gen", round(time.time() - t, 1), "s dur", round(a[0].shape[-1] / m.sampling_rate, 2), flush=True)
