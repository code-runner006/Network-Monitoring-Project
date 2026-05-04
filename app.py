from flask import Flask, render_template, jsonify, request
import sniffer

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/start", methods=["POST"])
def start():
    sniffer.begin_capture()
    return jsonify({"status": "started"})


@app.route("/stop", methods=["POST"])
def stop():
    sniffer.end_capture()
    return jsonify({"status": "stopped"})


@app.route("/packets")
def packets():
    protocol = request.args.get("protocol", "")
    src_ip = request.args.get("src_ip", "")
    dst_ip = request.args.get("dst_ip", "")

    if protocol == "":
        protocol = None

    if src_ip == "":
        src_ip = None

    if dst_ip == "":
        dst_ip = None

    data = sniffer.get_packets(protocol=protocol, src_ip=src_ip, dst_ip=dst_ip)
    return jsonify(data)


@app.route("/stats")
def stats():
    data = sniffer.get_stats()
    return jsonify(data)


@app.route("/status")
def status():
    return jsonify({"capture_active": sniffer.capture_active})


@app.route("/logs")
def logs():
    session = request.args.get("session", None)
    data = sniffer.load_csv_logs(session=session)
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True)
