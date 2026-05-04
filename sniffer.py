import threading
import csv
import os
from datetime import datetime
from scapy.all import sniff, IP, TCP, UDP, ICMP

PORT_SERVICES = {
    20: "FTP-Data",
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    67: "DHCP",
    68: "DHCP",
    80: "HTTP",
    110: "POP3",
    123: "NTP",
    143: "IMAP",
    161: "SNMP",
    443: "HTTPS",
    3306: "MySQL",
    3389: "RDP",
    5432: "PostgreSQL",
    6379: "Redis",
    8080: "HTTP-ALT",
    8443: "HTTPS-ALT",
}

LOG_FILE = "traffic_log.csv"
CSV_FIELDS = ["session", "time", "src_ip", "dst_ip", "protocol", "src_port", "dst_port", "service", "size"]

packets_list = []
capture_active = False
sniff_thread = None
lock = threading.Lock()
session_number = 0


def get_service(port):
    if port in PORT_SERVICES:
        return PORT_SERVICES[port]
    return "Port " + str(port)


def write_to_csv(record):
    file_exists = os.path.exists(LOG_FILE)
    f = open(LOG_FILE, "a", newline="")
    writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
    if file_exists == False:
        writer.writeheader()
    writer.writerow(record)
    f.close()


def packet_callback(packet):
    if IP not in packet:
        return

    record = {
        "session": session_number,
        "time": datetime.now().strftime("%H:%M:%S"),
        "src_ip": packet[IP].src,
        "dst_ip": packet[IP].dst,
        "protocol": "OTHER",
        "src_port": "-",
        "dst_port": "-",
        "service": "-",
        "size": len(packet)
    }

    if TCP in packet:
        record["protocol"] = "TCP"
        record["src_port"] = packet[TCP].sport
        record["dst_port"] = packet[TCP].dport
        record["service"] = get_service(packet[TCP].dport)

    elif UDP in packet:
        record["protocol"] = "UDP"
        record["src_port"] = packet[UDP].sport
        record["dst_port"] = packet[UDP].dport
        record["service"] = get_service(packet[UDP].dport)

    elif ICMP in packet:
        record["protocol"] = "ICMP"

    with lock:
        packets_list.append(record)

    write_to_csv(record)


def should_stop(packet):
    if capture_active == False:
        return True
    return False


def sniff_loop():
    sniff(
        prn=packet_callback,
        store=False,
        stop_filter=should_stop
    )


def begin_capture():
    global sniff_thread, capture_active, packets_list, session_number

    packets_list = []
    session_number = session_number + 1
    capture_active = True

    sniff_thread = threading.Thread(target=sniff_loop, daemon=True)
    sniff_thread.start()


def end_capture():
    global capture_active
    if capture_active == True:
        capture_active = False


def get_packets(protocol=None, src_ip=None, dst_ip=None):
    with lock:
        all_packets = packets_list.copy()

    filtered = []

    for p in all_packets:
        if protocol != None:
            if p["protocol"] != protocol:
                continue
        if src_ip != None:
            if src_ip not in p["src_ip"]:
                continue
        if dst_ip != None:
            if dst_ip not in p["dst_ip"]:
                continue
        filtered.append(p)

    return filtered


def load_csv_logs(session=None):
    if os.path.exists(LOG_FILE) == False:
        return []

    records = []

    f = open(LOG_FILE, "r", newline="")
    reader = csv.DictReader(f)

    for row in reader:
        if session != None:
            if str(row["session"]) == str(session):
                records.append(row)
        else:
            records.append(row)

    f.close()
    return records


def sort_key(value):
    return int(value)


def get_stats():
    with lock:
        data = packets_list.copy()

    total = len(data)
    total_size = 0
    protocol_counts = {"TCP": 0, "UDP": 0, "ICMP": 0, "OTHER": 0}

    for p in data:
        proto = p["protocol"]
        if proto in protocol_counts:
            protocol_counts[proto] = protocol_counts[proto] + 1
        total_size = total_size + p["size"]

    if total > 0:
        avg_size = round(total_size / total, 2)
    else:
        avg_size = 0

    result = {
    "total_packets": total,
    "protocol_counts": protocol_counts,
    "avg_size": avg_size,
    }

    return result
