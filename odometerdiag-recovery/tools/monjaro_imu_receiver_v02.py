#!/usr/bin/env python3
"""Monjaro Sensor IMU2 receiver with automatic head-unit discovery."""
import csv
import datetime
import os
import socket
import threading
import time

PORT = 49557
DISCOVERY_PORT = 49558
BEACON = b"MONJARO_SENSOR_PHONE_V1"
folder = os.path.expanduser("~/storage/downloads/MonjaroLogs")
os.makedirs(folder, exist_ok=True)
path = os.path.join(folder, "Monjaro_IMU2_" + datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S") + ".csv")
fields = ["received_ms", "type", "seq", "car_ms", "car_elapsed_ns", "vehicle_ms",
          "speed_kmh", "steering_raw", "gear", "gyro_ns", "gyro_x", "gyro_y", "gyro_z",
          "accel_ns", "accel_x", "accel_y", "accel_z", "direction", "signed_speed_kmh"]
stop = threading.Event()

def advertise():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        while not stop.is_set():
            try:
                s.sendto(BEACON, ("255.255.255.255", DISCOVERY_PORT))
            except OSError as exc:
                print("Discovery warning:", exc, flush=True)
            stop.wait(2)

threading.Thread(target=advertise, daemon=True).start()
with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
    sock.bind(("0.0.0.0", PORT))
    print("MONJARO SENSOR 0.2 / AUTO DISCOVERY\nCSV:", path, "\nListening UDP", PORT, flush=True)
    count = 0
    try:
        with open(path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(fields)
            while True:
                data, address = sock.recvfrom(4096)
                parts = data.decode("utf-8", errors="replace").strip().split(",")
                if len(parts) != 16 or parts[0] != "IMU2":
                    continue
                gear = {"0": "P", "1": "R", "3": "D"}.get(parts[8], "UNKNOWN")
                try:
                    speed = float(parts[6])
                    signed = speed * {"P": 0, "R": -1, "D": 1}[gear] if gear != "UNKNOWN" else ""
                except ValueError:
                    signed = ""
                writer.writerow([int(time.time() * 1000)] + parts + [gear, signed])
                count += 1
                if count % 50 == 0:
                    f.flush()
                    print("Packets:", count, "Car:", address[0], "Gear:", gear, "Speed:", signed, flush=True)
    except KeyboardInterrupt:
        print("\nRecording stopped.", flush=True)
    finally:
        stop.set()
print("Saved:", path)
