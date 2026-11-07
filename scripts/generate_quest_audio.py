import os
import math
import wave
import subprocess
import numpy as np

SAMPLE_RATE = 44100

def save_wav_and_mp3(samples, out_base):
    # Ensure -1.0 to 1.0 bounds and apply smooth normalization
    peak = np.max(np.abs(samples))
    if peak > 0:
        samples = samples / peak * 0.7  # normalize to -3dB for sensory safety
    
    int16_samples = (samples * 32767).astype(np.int16)
    wav_path = f"{out_base}.wav"
    mp3_path = f"{out_base}.mp3"
    
    with wave.open(wav_path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(int16_samples.tobytes())
    
    # Convert to mono 64kbps MP3
    cmd = [
        "ffmpeg", "-y", "-i", wav_path,
        "-ac", "1", "-b:a", "64k",
        mp3_path
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    if os.path.exists(wav_path):
        os.remove(wav_path)
    print(f"Generated: {mp3_path}")

def make_envelope(n, attack_samples, release_samples):
    env = np.ones(n, dtype=np.float32)
    if attack_samples > 0:
        env[:attack_samples] = np.linspace(0, 1, attack_samples)
    if release_samples > 0:
        env[-release_samples:] = np.linspace(1, 0, release_samples)
    return env

def generate_soft_tap():
    duration = 0.08
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    # 320 Hz dropping to 120 Hz, fast decay
    freq = 320 * np.exp(-t * 25) + 120
    phase = 2 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    tone = np.sin(phase) * np.exp(-t * 40)
    noise = np.random.uniform(-0.15, 0.15, n) * np.exp(-t * 60)
    return (tone + noise) * make_envelope(n, int(0.002 * SAMPLE_RATE), int(0.01 * SAMPLE_RATE))

def generate_correct_chime():
    # Warm bell triad (C5=523.25, E5=659.25, G5=783.99, C6=1046.50)
    duration = 0.8
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    sig = np.zeros(n, dtype=np.float32)
    notes = [
        (523.25, 0.0, 0.4),
        (659.25, 0.05, 0.35),
        (783.99, 0.1, 0.45),
        (1046.50, 0.15, 0.3)
    ]
    for freq, delay, amp in notes:
        d_idx = int(delay * SAMPLE_RATE)
        rem = n - d_idx
        t_note = t[:rem]
        bell = (np.sin(2 * np.pi * freq * t_note) + 
                0.25 * np.sin(2 * np.pi * freq * 2 * t_note) + 
                0.1 * np.sin(2 * np.pi * freq * 3 * t_note))
        env = np.exp(-t_note * 5.0)
        sig[d_idx:] += (bell * env * amp).astype(np.float32)
    return sig

def generate_try_again_reassurance():
    # Warm, completely non-punishing descending two-note soft wooden chime (A4=440 to G4=392)
    duration = 0.45
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    sig = np.zeros(n, dtype=np.float32)
    notes = [(440.0, 0.0, 0.3), (392.0, 0.15, 0.35)]
    for freq, delay, amp in notes:
        d_idx = int(delay * SAMPLE_RATE)
        rem = n - d_idx
        t_note = t[:rem]
        tone = (np.sin(2 * np.pi * freq * t_note) + 0.15 * np.sin(2 * np.pi * freq * 2 * t_note))
        env = np.exp(-t_note * 8.0)
        sig[d_idx:] += (tone * env * amp).astype(np.float32)
    return sig

def generate_quest_complete():
    # Uplifting gentle flourish: F5, A5, C6, E6, F6 arpeggio with soft shimmer
    duration = 1.4
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    sig = np.zeros(n, dtype=np.float32)
    chord = [
        (349.23, 0.00, 0.25),
        (440.00, 0.12, 0.28),
        (523.25, 0.24, 0.32),
        (659.25, 0.36, 0.35),
        (698.46, 0.48, 0.45),
        (880.00, 0.60, 0.30),
        (1046.50, 0.72, 0.25),
    ]
    for freq, delay, amp in chord:
        d_idx = int(delay * SAMPLE_RATE)
        rem = n - d_idx
        t_note = t[:rem]
        bell = (np.sin(2 * np.pi * freq * t_note) + 0.2 * np.sin(2 * np.pi * freq * 2 * t_note))
        env = np.exp(-t_note * 3.5)
        sig[d_idx:] += (bell * env * amp).astype(np.float32)
    return sig

def generate_adhd_ambience(duration=60):
    # ADHD "Sunbird Valley": gentle dawn birdsong and morning mountain breeze
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    
    # 1. Warm grounding dawn pad (A2=110Hz, C#3=138.6Hz, E3=164.8Hz)
    pad = (np.sin(2 * np.pi * 110.0 * t) * 0.12 + 
           np.sin(2 * np.pi * 164.8 * t) * 0.08 + 
           np.sin(2 * np.pi * 220.0 * t) * 0.05)
    # Slow breathing LFO
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (1.0 / duration * 4) * t)
    pad = pad * (0.6 + 0.4 * lfo)
    
    # 2. Filtered soft wind breeze (pink noise approximation)
    raw_noise = np.random.normal(0, 0.05, n)
    # Simple recursive low-pass smoothing
    wind = np.zeros(n)
    alpha = 0.015
    for i in range(1, n):
        wind[i] = wind[i-1] * (1 - alpha) + raw_noise[i] * alpha
    wind_lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (1.0 / 12) * t)
    wind = wind * (0.3 + 0.7 * wind_lfo) * 0.4
    
    # 3. Intermittent gentle sunbird chirps (smooth frequency modulation, never jarring)
    birds = np.zeros(n)
    # Seed bird chirp times with seamless wrap
    chirp_times = [4.2, 11.5, 18.0, 27.3, 36.8, 45.1, 53.6]
    for ct in chirp_times:
        chirp_dur = 0.35
        cn = int(SAMPLE_RATE * chirp_dur)
        tc = np.linspace(0, chirp_dur, cn, endpoint=False)
        # Chirp sweep from 2200 to 2800 and back to 2400
        f_sweep = 2200 + 600 * np.sin(np.pi * tc / chirp_dur)
        phase = 2 * np.pi * np.cumsum(f_sweep) / SAMPLE_RATE
        c_env = np.sin(np.pi * tc / chirp_dur) ** 2
        chirp_sig = np.sin(phase) * c_env * 0.08
        start_idx = int(ct * SAMPLE_RATE)
        birds[start_idx:start_idx+cn] += chirp_sig
        
    total = pad + wind + birds
    # Seamless loop crossfade at the boundaries (2 seconds)
    fade_len = int(2.0 * SAMPLE_RATE)
    fade_in = np.linspace(0, 1, fade_len)
    fade_out = np.linspace(1, 0, fade_len)
    total[:fade_len] = total[:fade_len] * fade_in + total[-fade_len:] * fade_out
    total[-fade_len:] = total[:fade_len]
    return total

def generate_autism_ambience(duration=60):
    # Autism "The Lantern Garden": tranquil garden breeze & distant harmonic wind chimes
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    
    # 1. Very calm low frequency root drone (98Hz G2, 146.8Hz D3)
    pad = (np.sin(2 * np.pi * 98.0 * t) * 0.14 + 
           np.sin(2 * np.pi * 146.8 * t) * 0.07)
    
    # 2. Whisper garden breeze
    raw_noise = np.random.normal(0, 0.04, n)
    breeze = np.zeros(n)
    alpha = 0.01
    for i in range(1, n):
        breeze[i] = breeze[i-1] * (1 - alpha) + raw_noise[i] * alpha
    breeze_lfo = 0.5 + 0.5 * np.cos(2 * np.pi * (1.0 / 15) * t)
    breeze = breeze * (0.4 + 0.6 * breeze_lfo) * 0.35
    
    # 3. Soft solitary pentatonic bamboo chimes (G4, A4, B4, D5, E5) with long gentle decay
    chimes = np.zeros(n)
    chime_events = [
        (6.0, 392.0),
        (16.5, 493.88),
        (29.0, 587.33),
        (39.5, 440.0),
        (51.0, 659.25),
    ]
    for c_time, freq in chime_events:
        c_dur = 3.0
        cn = int(SAMPLE_RATE * c_dur)
        tc = np.linspace(0, c_dur, cn, endpoint=False)
        c_tone = np.sin(2 * np.pi * freq * tc) + 0.15 * np.sin(2 * np.pi * freq * 2.76 * tc)
        c_env = np.exp(-tc * 1.5)
        idx = int(c_time * SAMPLE_RATE)
        chimes[idx:idx+cn] += c_tone * c_env * 0.06
        
    total = pad + breeze + chimes
    fade_len = int(2.0 * SAMPLE_RATE)
    fade_in = np.linspace(0, 1, fade_len)
    fade_out = np.linspace(1, 0, fade_len)
    total[:fade_len] = total[:fade_len] * fade_in + total[-fade_len:] * fade_out
    total[-fade_len:] = total[:fade_len]
    return total

def generate_dyslexia_ambience(duration=60):
    # Dyslexia "The Whispering Library": quiet library hush, distant page rustle & lantern hum
    n = int(SAMPLE_RATE * duration)
    t = np.linspace(0, duration, n, endpoint=False)
    
    # 1. Warm low lantern resonant hum (82.4Hz E2, 123.5Hz B2)
    hum = (np.sin(2 * np.pi * 82.4 * t) * 0.12 + 
           np.sin(2 * np.pi * 123.5 * t) * 0.06 + 
           np.sin(2 * np.pi * 164.8 * t) * 0.03)
    tremolo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.1 * t)
    hum = hum * tremolo
    
    # 2. Soft air hush
    raw_noise = np.random.normal(0, 0.03, n)
    hush = np.zeros(n)
    alpha = 0.008
    for i in range(1, n):
        hush[i] = hush[i-1] * (1 - alpha) + raw_noise[i] * alpha
    
    # 3. Occasional faint soft page turns (gentle filtered friction)
    pages = np.zeros(n)
    page_events = [9.0, 24.0, 42.0]
    for pt in page_events:
        pdur = 0.6
        pn = int(SAMPLE_RATE * pdur)
        tp = np.linspace(0, pdur, pn, endpoint=False)
        pnoise = np.random.normal(0, 0.025, pn)
        penv = np.sin(np.pi * tp / pdur) ** 3
        idx = int(pt * SAMPLE_RATE)
        pages[idx:idx+pn] += pnoise * penv * 0.35
        
    total = hum + hush + pages
    fade_len = int(2.0 * SAMPLE_RATE)
    fade_in = np.linspace(0, 1, fade_len)
    fade_out = np.linspace(1, 0, fade_len)
    total[:fade_len] = total[:fade_len] * fade_in + total[-fade_len:] * fade_out
    total[-fade_len:] = total[:fade_len]
    return total

def main():
    root = "/Users/ananyasridhar/work/vaakbot/web/public/quests"
    quests = {
        "adhd": generate_adhd_ambience,
        "autism": generate_autism_ambience,
        "dyslexia": generate_dyslexia_ambience
    }
    
    for q_name, amb_fn in quests.items():
        q_dir = os.path.join(root, q_name, "audio")
        os.makedirs(q_dir, exist_ok=True)
        
        print(f"Synthesizing ambience for {q_name}...")
        amb_samples = amb_fn(60)
        save_wav_and_mp3(amb_samples, os.path.join(q_dir, "ambience"))
        
        print(f"Synthesizing UI chimes for {q_name}...")
        save_wav_and_mp3(generate_soft_tap(), os.path.join(q_dir, "tap"))
        save_wav_and_mp3(generate_correct_chime(), os.path.join(q_dir, "correct"))
        save_wav_and_mp3(generate_try_again_reassurance(), os.path.join(q_dir, "try_again"))
        save_wav_and_mp3(generate_quest_complete(), os.path.join(q_dir, "complete"))

if __name__ == "__main__":
    main()
