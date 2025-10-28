from flask import Flask, jsonify, request
import serial.tools.list_ports
import time

app = Flask(__name__)

connected_port = None

@app.route("/api/ports", methods=["GET"])
def get_ports():
    """Return list of available serial ports"""
    ports = [port.device for port in serial.tools.list_ports.comports()]
    return jsonify({"ports": ports})

@app.route("/api/connect", methods=["POST"])
def connect_port():
    """Connect to selected serial port"""
    global connected_port
    data = request.json
    port_name = data.get("port")

    # Simulate connection
    time.sleep(1)  # loading delay
    connected_port = port_name
    return jsonify({"status": "connected", "port": port_name})

@app.route("/api/disconnect", methods=["POST"])
def disconnect_port():
    """Disconnect the serial port"""
    global connected_port
    connected_port = None
    return jsonify({"status": "disconnected"})

@app.route("/api/status", methods=["GET"])
def status():
    """Return current connection status"""
    if connected_port:
        return jsonify({"connected": True, "port": connected_port})
    else:
        return jsonify({"connected": False})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
