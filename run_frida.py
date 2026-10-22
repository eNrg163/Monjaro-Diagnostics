import argparse
import frida
import sys
import time

p = argparse.ArgumentParser()
p.add_argument("pid", type=int)
p.add_argument("script")
p.add_argument("--seconds", type=float, default=13)
args = p.parse_args()
device = frida.get_device_manager().add_remote_device("127.0.0.1:27042")
session = None
script = None
try:
    session = device.attach(args.pid)
    with open(args.script, encoding="utf-8") as f:
        source = f.read()
    script = session.create_script(source)
    def on_message(message, data):
        if message["type"] == "send":
            print(message.get("payload"), flush=True)
        elif message["type"] == "error":
            print("[FRIDA ERROR]", message.get("stack", message), flush=True)
        else:
            print("[FRIDA]", message, flush=True)
    script.on("message", on_message)
    script.load()
    time.sleep(args.seconds)
finally:
    if script:
        try: script.unload()
        except Exception: pass
    if session:
        try: session.detach()
        except Exception: pass
