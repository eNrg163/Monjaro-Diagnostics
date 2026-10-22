import argparse
import subprocess
import time

p = argparse.ArgumentParser()
p.add_argument("pid", type=int)
p.add_argument("script")
p.add_argument("--seconds", type=float, default=13)
args = p.parse_args()
cmd = ["/root/frida-env/bin/frida", "-H", "127.0.0.1:27042", "-p", str(args.pid), "-l", args.script]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
try:
    time.sleep(args.seconds)
    if proc.poll() is None:
        try:
            proc.stdin.write(b"exit\n")
            proc.stdin.flush()
            proc.wait(timeout=4)
        except (BrokenPipeError, subprocess.TimeoutExpired):
            proc.terminate()
            try: proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait()
finally:
    if proc.poll() is None:
        proc.terminate()
        proc.wait()
print("[RUNNER] Finished; terminal ready", flush=True)
