"""
System Statistics Service using psutil - FIXED VERSION
Provides real-time system metrics for CPU, Memory, Disk, and Network
"""

import psutil
import time
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

# Global variables to track network and disk stats for rate calculations
_last_network_stats = None
_last_network_time = None
_last_disk_stats = None
_last_disk_time = None


def get_cpu_stats() -> Dict[str, Any]:
    """Get CPU statistics including per-core usage"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        cpu_per_core = psutil.cpu_percent(interval=0.1, percpu=True)
        cpu_count = psutil.cpu_count(logical=True)
        cpu_count_physical = psutil.cpu_count(logical=False)

        # CPU frequency info
        cpu_freq = psutil.cpu_freq()
        freq_info = {
            "current": cpu_freq.current if cpu_freq else 0,
            "min": cpu_freq.min if cpu_freq else 0,
            "max": cpu_freq.max if cpu_freq else 0,
        }

        # Load averages (Unix only)
        try:
            load_avg = psutil.getloadavg()
        except (AttributeError, OSError):
            load_avg = [0, 0, 0]

        return {
            "usage": cpu_percent,
            "per_core": cpu_per_core,
            "cores": cpu_count,
            "cores_physical": cpu_count_physical,
            "frequency": freq_info,
            "load_average": {
                "1min": load_avg[0],
                "5min": load_avg[1],
                "15min": load_avg[2],
            },
        }
    except Exception as e:
        logger.error(f"Error getting CPU stats: {e}")
        return {
            "usage": 0,
            "per_core": [],
            "cores": 0,
            "cores_physical": 0,
            "frequency": {"current": 0, "min": 0, "max": 0},
            "load_average": {"1min": 0, "5min": 0, "15min": 0},
        }


def get_memory_stats() -> Dict[str, Any]:
    """Get memory statistics"""
    try:
        # Virtual memory
        vm = psutil.virtual_memory()

        # Swap memory
        swap = psutil.swap_memory()

        return {
            "total": vm.total,
            "available": vm.available,
            "used": vm.used,
            "free": vm.free,
            "percent": vm.percent,
            "cached": getattr(vm, "cached", 0),
            "buffers": getattr(vm, "buffers", 0),
            "swap": {
                "total": swap.total,
                "used": swap.used,
                "free": swap.free,
                "percent": swap.percent,
            },
        }
    except Exception as e:
        logger.error(f"Error getting memory stats: {e}")
        return {
            "total": 0,
            "available": 0,
            "used": 0,
            "free": 0,
            "percent": 0,
            "cached": 0,
            "buffers": 0,
            "swap": {"total": 0, "used": 0, "free": 0, "percent": 0},
        }


def get_disk_stats() -> Dict[str, Any]:
    """Get disk statistics for all mounted filesystems with I/O rates"""
    global _last_disk_stats, _last_disk_time

    try:
        disk_usage = []
        disk_io = psutil.disk_io_counters()
        current_time = time.time()

        # Get all disk partitions
        partitions = psutil.disk_partitions()

        for partition in partitions:
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disk_usage.append(
                    {
                        "device": partition.device,
                        "mountpoint": partition.mountpoint,
                        "filesystem": partition.fstype,
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                        "percent": (usage.used / usage.total) * 100
                        if usage.total > 0
                        else 0,
                    }
                )
            except (PermissionError, OSError):
                # Skip partitions we can't access
                continue

        # Current disk I/O stats
        current_disk_stats = {
            "read_count": disk_io.read_count if disk_io else 0,
            "write_count": disk_io.write_count if disk_io else 0,
            "read_bytes": disk_io.read_bytes if disk_io else 0,
            "write_bytes": disk_io.write_bytes if disk_io else 0,
            "read_time": disk_io.read_time if disk_io else 0,
            "write_time": disk_io.write_time if disk_io else 0,
        }

        # Calculate I/O rates
        read_rate = 0
        write_rate = 0
        if _last_disk_stats and _last_disk_time:
            time_delta = current_time - _last_disk_time
            if time_delta > 0:
                read_rate = (
                    current_disk_stats["read_bytes"] - _last_disk_stats["read_bytes"]
                ) / time_delta
                write_rate = (
                    current_disk_stats["write_bytes"] - _last_disk_stats["write_bytes"]
                ) / time_delta

        # Update tracking variables
        _last_disk_stats = current_disk_stats.copy()
        _last_disk_time = current_time

        # Add rates to I/O stats
        io_stats = {
            **current_disk_stats,
            "read_rate": max(0, read_rate),  # Ensure non-negative
            "write_rate": max(0, write_rate),
        }

        return {"partitions": disk_usage, "io": io_stats}
    except Exception as e:
        logger.error(f"Error getting disk stats: {e}")
        return {
            "partitions": [],
            "io": {
                "read_count": 0,
                "write_count": 0,
                "read_bytes": 0,
                "write_bytes": 0,
                "read_time": 0,
                "write_time": 0,
                "read_rate": 0,
                "write_rate": 0,
            },
        }


def get_network_stats() -> Dict[str, Any]:
    """Get network statistics with rate calculations"""
    global _last_network_stats, _last_network_time

    try:
        current_time = time.time()
        net_io = psutil.net_io_counters()

        # Current totals
        current_stats = {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv,
            "errin": net_io.errin,
            "errout": net_io.errout,
            "dropin": net_io.dropin,
            "dropout": net_io.dropout,
        }

        # Calculate rates if we have previous data
        rates = {
            "bytes_sent_rate": 0,
            "bytes_recv_rate": 0,
            "packets_sent_rate": 0,
            "packets_recv_rate": 0,
        }

        if _last_network_stats and _last_network_time:
            time_delta = current_time - _last_network_time
            if time_delta > 0:
                rates = {
                    "bytes_sent_rate": max(
                        0,
                        (
                            current_stats["bytes_sent"]
                            - _last_network_stats["bytes_sent"]
                        )
                        / time_delta,
                    ),
                    "bytes_recv_rate": max(
                        0,
                        (
                            current_stats["bytes_recv"]
                            - _last_network_stats["bytes_recv"]
                        )
                        / time_delta,
                    ),
                    "packets_sent_rate": max(
                        0,
                        (
                            current_stats["packets_sent"]
                            - _last_network_stats["packets_sent"]
                        )
                        / time_delta,
                    ),
                    "packets_recv_rate": max(
                        0,
                        (
                            current_stats["packets_recv"]
                            - _last_network_stats["packets_recv"]
                        )
                        / time_delta,
                    ),
                }

        # Update global tracking variables
        _last_network_stats = current_stats.copy()
        _last_network_time = current_time

        # Get per-interface stats with proper attribute handling
        interfaces = []
        try:
            net_if_stats = psutil.net_if_stats()
            net_if_addrs = psutil.net_if_addrs()

            for interface_name, interface_io in psutil.net_io_counters(
                pernic=True
            ).items():
                # Get interface status safely
                iface_info = net_if_stats.get(interface_name)
                is_up = getattr(iface_info, "isup", False) if iface_info else False
                speed = getattr(iface_info, "speed", 0) if iface_info else 0

                interface_info = {
                    "name": interface_name,
                    "bytes_sent": interface_io.bytes_sent,
                    "bytes_recv": interface_io.bytes_recv,
                    "packets_sent": interface_io.packets_sent,
                    "packets_recv": interface_io.packets_recv,
                    "is_up": is_up,
                    "speed": speed,
                    "addresses": [],
                }

                # Get IP addresses for this interface
                if interface_name in net_if_addrs:
                    for addr in net_if_addrs[interface_name]:
                        try:
                            interface_info["addresses"].append(
                                {
                                    "family": str(addr.family),
                                    "address": addr.address,
                                    "netmask": getattr(addr, "netmask", None),
                                    "broadcast": getattr(addr, "broadcast", None),
                                }
                            )
                        except:
                            pass  # Skip problematic addresses

                interfaces.append(interface_info)
        except Exception as e:
            logger.warning(f"Error getting interface details: {e}")

        return {**current_stats, **rates, "interfaces": interfaces}

    except Exception as e:
        logger.error(f"Error getting network stats: {e}")
        return {
            "bytes_sent": 0,
            "bytes_recv": 0,
            "packets_sent": 0,
            "packets_recv": 0,
            "errin": 0,
            "errout": 0,
            "dropin": 0,
            "dropout": 0,
            "bytes_sent_rate": 0,
            "bytes_recv_rate": 0,
            "packets_sent_rate": 0,
            "packets_recv_rate": 0,
            "interfaces": [],
        }


def get_system_stats() -> Dict[str, Any]:
    """Get all system statistics combined"""
    try:
        return {
            "cpu": get_cpu_stats(),
            "memory": get_memory_stats(),
            "disk": get_disk_stats(),
            "network": get_network_stats(),
            "timestamp": time.time(),
        }
    except Exception as e:
        logger.error(f"Error getting system stats: {e}")
        return {
            "cpu": {"usage": 0, "per_core": [], "cores": 0},
            "memory": {"total": 0, "used": 0, "percent": 0},
            "disk": {"partitions": [], "io": {}},
            "network": {"bytes_sent": 0, "bytes_recv": 0, "interfaces": []},
            "timestamp": time.time(),
            "error": str(e),
        }
