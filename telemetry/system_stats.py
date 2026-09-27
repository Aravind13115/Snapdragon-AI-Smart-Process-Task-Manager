"""Real host telemetry via psutil. READ-ONLY.

Every value returned is sampled live from this machine.
Nothing here modifies any process or system setting.
"""
from __future__ import annotations

import time

import psutil

_boot_time = psutil.boot_time()

# Module-level state for rate calculations (disk activity, net throughput)
_last_disk_io = None
_last_net_io = None
_last_sample_ts = 0.0


def _battery() -> dict:
    try:
        b = psutil.sensors_battery()
    except Exception:
        b = None
    if b is None:
        return {"present": False, "simulated": False}
    return {
        "present": True,
        "simulated": False,
        "percent": round(b.percent, 1),
        "plugged": bool(b.power_plugged),
        "secs_left": None if b.secsleft in (None, -1, -2) else int(b.secsleft),
    }


def _disk_activity() -> dict:
    """Compute disk activity % and throughput from io_counters delta."""
    global _last_disk_io, _last_sample_ts
    try:
        io = psutil.disk_io_counters()
    except Exception:
        return {"activity_pct": None, "read_mb_s": None, "write_mb_s": None,
                "simulated": False, "note": "disk I/O counters unavailable"}
    now = time.time()
    if _last_disk_io is None or _last_sample_ts == 0.0:
        _last_disk_io = io
        _last_sample_ts = now
        return {"activity_pct": None, "read_mb_s": None, "write_mb_s": None,
                "simulated": False, "note": "warming up (first sample)"}
    dt = now - _last_sample_ts
    if dt < 0.01:
        return {"activity_pct": None, "read_mb_s": None, "write_mb_s": None,
                "simulated": False, "note": "warming up"}
    read_time_delta = (io.read_time or 0) - (_last_disk_io.read_time or 0)
    write_time_delta = (io.write_time or 0) - (_last_disk_io.write_time or 0)
    total_ms = dt * 1000.0
    activity_pct = round(min(100.0, (read_time_delta + write_time_delta) / total_ms * 100), 1)
    read_bytes_delta = (io.read_bytes or 0) - (_last_disk_io.read_bytes or 0)
    write_bytes_delta = (io.write_bytes or 0) - (_last_disk_io.write_bytes or 0)
    read_mb_s = round(max(0.0, read_bytes_delta) / dt / 1e6, 2)
    write_mb_s = round(max(0.0, write_bytes_delta) / dt / 1e6, 2)
    _last_disk_io = io
    _last_sample_ts = now
    return {
        "activity_pct": activity_pct,
        "read_mb_s": read_mb_s,
        "write_mb_s": write_mb_s,
        "simulated": False,
    }


def _net_throughput() -> dict:
    """Compute network throughput from net_io_counters delta."""
    global _last_net_io
    try:
        io = psutil.net_io_counters()
    except Exception:
        return {"down_mb_s": None, "up_mb_s": None, "simulated": False,
                "note": "network I/O counters unavailable"}
    now = time.time()
    if _last_net_io is None:
        _last_net_io = (now, io)
        return {"down_mb_s": None, "up_mb_s": None, "simulated": False,
                "note": "warming up (first sample)"}
    prev_ts, prev_io = _last_net_io
    dt = now - prev_ts
    if dt < 0.01:
        return {"down_mb_s": None, "up_mb_s": None, "simulated": False,
                "note": "warming up"}
    down_delta = (io.bytes_recv or 0) - (prev_io.bytes_recv or 0)
    up_delta = (io.bytes_sent or 0) - (prev_io.bytes_sent or 0)
    down_mb_s = round(max(0.0, down_delta) / dt / 1e6, 2)
    up_mb_s = round(max(0.0, up_delta) / dt / 1e6, 2)
    _last_net_io = (now, io)
    return {
        "down_mb_s": down_mb_s,
        "up_mb_s": up_mb_s,
        "simulated": False,
    }


def snapshot() -> dict:
    """Single live sample. Callers poll this every few seconds."""
    # Non-blocking per-call sampling: interval=None compares against last call.
    cpu_total = psutil.cpu_percent(interval=None)
    per_core = psutil.cpu_percent(interval=None, percpu=True)
    vm = psutil.virtual_memory()
    du = psutil.disk_usage("C:\\")
    net = psutil.net_io_counters()
    freq = None
    try:
        f = psutil.cpu_freq()
        if f:
            freq = {"current_mhz": round(f.current, 1), "max_mhz": round(f.max or 0, 1)}
    except Exception:
        pass
    disk_io = _disk_activity()
    net_io = _net_throughput()
    return {
        "simulated": False,
        "timestamp": time.time(),
        "cpu": {
            "total_pct": round(cpu_total, 1),
            "per_core_pct": [round(x, 1) for x in per_core],
            "logical": psutil.cpu_count(logical=True),
            "physical": psutil.cpu_count(logical=False),
            "freq": freq,
        },
        "memory": {
            "total_gb": round(vm.total / 1e9, 2),
            "used_gb": round(vm.used / 1e9, 2),
            "available_gb": round(vm.available / 1e9, 2),
            "pct": round(vm.percent, 1),
        },
        "disk": {
            "total_gb": round(du.total / 1e9, 2),
            "used_gb": round(du.used / 1e9, 2),
            "pct": round(du.percent, 1),
            **disk_io,
        },
        "net": {
            "mb_sent": round(net.bytes_sent / 1e6, 2),
            "mb_recv": round(net.bytes_recv / 1e6, 2),
            **net_io,
        },
        "battery": _battery(),
        "uptime_s": int(time.time() - _boot_time),
    }
