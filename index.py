import os
import sys
import subprocess
import time
from elevenlabs.client import ElevenLabs
from google import genai

# ================= CONFIG =================

MAC = "41:42:C1:2C:4F:68"

GEMINI_API_KEY = "AIzaSyCwsVU8EfzMwJcg8UQ7X4bkuNE0GIQdPPc"
ELEVEN_API_KEY = "sk_9fe42220333656a0571318ef4d08fc951e20ad0a16a5ae81"

# Necessário para funcionar no CRON
os.environ["XDG_RUNTIME_DIR"] = "/run/user/1000"

mensagem = sys.argv[1] if len(sys.argv) > 1 else "Estudar"

# ===========================================


def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()


# ---------- BLUETOOTH ----------

def bluetooth_connect():
    print("🔵 Conectando bluetooth...")

    subprocess.run(
        ["bluetoothctl"],
        input=f"""
disconnect {MAC}
power on
agent on
default-agent
trust {MAC}
connect {MAC}
quit
""",
        text=True,
    )

    time.sleep(5)


def activate_a2dp():
    cards = run("pactl list cards short")

    for line in cards.splitlines():
        if "bluez_card" in line:
            card = line.split()[1]
            print(f"🎧 Ativando A2DP: {card}")
            os.system(f"pactl set-card-profile {card} a2dp-sink")
            time.sleep(2)


def wait_for_sink(timeout=15):
    print("⏳ Esperando sink...")

    for _ in range(timeout):
        sinks = run("pactl list short sinks")

        for line in sinks.splitlines():
            if "bluez" in line:
                return line.split()[1]

        time.sleep(1)

    return None


def configure_sink(sink):
    print(f"✅ Usando sink: {sink}")

    os.system(f"pactl set-default-sink {sink}")
    os.system(f"pactl set-sink-volume {sink} 100%")
    os.system(f"pactl set-sink-mute {sink} 0")


# ---------- GEMINI ----------

def create_message(texto):
    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = (
        f"Crie uma mensagem motivadora curta (máx 100 caracteres) "
        f"para focar em: {texto}"
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    return response.text.strip()


# ---------- ELEVENLABS ----------

def generate_audio(texto):
    client = ElevenLabs(api_key=ELEVEN_API_KEY)

    audio_stream = client.text_to_speech.convert(
        text=texto,
        voice_id="SAz9YHcvj6GT2YYXdXww",
        model_id="eleven_multilingual_v2",
    )

    file_path = "/tmp/output.mp3"

    with open(file_path, "wb") as f:
        for chunk in audio_stream:
            if chunk:
                f.write(chunk)

    return file_path


# ---------- PLAY AUDIO ----------

def play_audio(file_path):
    print("🔊 Tocando áudio...")
    os.system(f"ffplay -nodisp -autoexit {file_path}")


# ================= MAIN =================

def main():

    bluetooth_connect()
    activate_a2dp()

    sink = wait_for_sink()

    if not sink:
        print("⚠️ Tentando reconectar...")
        bluetooth_connect()
        activate_a2dp()
        sink = wait_for_sink()

    if not sink:
        print("❌ Não encontrou dispositivo de áudio")
        return

    configure_sink(sink)

    texto = create_message(mensagem)
    print("📝 Mensagem:", texto)

    audio_file = generate_audio(texto)

    play_audio(audio_file)


if __name__ == "__main__":
    main()
