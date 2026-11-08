# Designs the guide voice "Лина" with VoiceStudio's OmniVoice engine (voice design by description).
# Usage: python design_voice.py <omnivoice-model-dir> voice-lina.wav
import sys, torch, soundfile as sf
from omnivoice import OmniVoice

model_dir, out = sys.argv[1:3]
m = OmniVoice.from_pretrained(model_dir, device_map="cpu", dtype=torch.float32)
torch.manual_seed(7)
a = m.generate(
    text="Привет! Я Лина, твой гид по лаборатории физики. Здесь физику не читают, а трогают руками.",
    language="Russian",
    instruct="female, young adult, moderate pitch",
    num_step=32,
)
sf.write(out, a[0].squeeze(0).numpy(), m.sampling_rate)
