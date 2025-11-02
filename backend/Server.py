from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import serial
import serial.tools.list_ports
import threading

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])
socketio = SocketIO(app, cors_allowed_origins="*")

ser = None
reading_thread = None
stop_reading = False


@app.route('/api/ports', methods=['GET'])
def get_ports():
    ports = [port.device for port in serial.tools.list_ports.comports()]
    return jsonify({"ports": ports})


@app.route('/api/connect', methods=['POST'])
def connect_port():
    global ser
    data = request.get_json()
    port = data.get("port")

    if not port:
        return jsonify({"error": "No port specified"}), 400

    try:
        ser = serial.Serial(port, 9600, timeout=1)
        print(f"Connected to {port}")
        return jsonify({"message": f"Connected to {port}", "status": "connected"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/mode', methods=['POST'])
def set_mode():
    """Send mode command to Arduino"""
    global ser, stop_reading, reading_thread

    data = request.get_json()
    mode = data.get("mode")

    if not ser or not ser.is_open:
        return jsonify({"status": "error", "message": "Serial not connected"}), 400

    try:
        if mode == "read":
            ser.write(b'-')
            stop_reading = False
            print(" Read mode started — waiting for RFID data...")
            reading_thread = threading.Thread(target=read_from_serial, daemon=True)
            reading_thread.start()

        elif mode == "write":
            ser.write(b';')
            print(" Write mode started")

        else:
            return jsonify({"status": "error", "message": "Invalid mode"}), 400

        return jsonify({"status": "success", "mode": mode})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/stop_read', methods=['POST'])
def stop_read():
    """Stop reading mode by sending '_'"""
    global ser, stop_reading
    if ser and ser.is_open:
        ser.write(b'_')
        stop_reading = True
        print(" Stop command sent to Arduino")
        return jsonify({"status": "stopped"})
    return jsonify({"error": "Serial not connected"}), 400


@app.route('/api/write_student', methods=['POST'])
def write_student():
    data = request.get_json()
    roll_no = data.get('roll_no')

    if not roll_no:
        return jsonify({"status": "error", "message": "Roll number missing"}), 400

    ser.write(f"{roll_no}\n".encode('utf-8'))
    print(" Sent roll number to ATmega:", roll_no)

    return jsonify({"status": "ok", "message": "Roll number sent to ATmega"})


@app.route('/api/write_book', methods=['POST'])
def write_book():
    data = request.get_json()
    book_id = data.get('book_id')

    if not book_id:
        return jsonify({"status": "error", "message": "Book ID missing"}), 400

    ser.write(f"{book_id}\n".encode('utf-8'))
    print(" Sent Book ID:", book_id)
    return jsonify({"status": "ok", "message": f"Book ID '{book_id}' sent to ATmega"})


@app.route('/api/stop_write', methods=['POST'])
def stop_write():
    """Stop write mode by sending ':'"""
    global ser
    if ser and ser.is_open:
        ser.write(b':')
        print(" Write mode stopped")
        return jsonify({"status": "stopped"})
    return jsonify({"error": "Serial not connected"}), 400


@app.route('/api/disconnect', methods=['POST'])
def disconnect_port():
    global ser
    if ser and ser.is_open:
        port_name = ser.port
        ser.close()
        print(f" Disconnected from {port_name}")
        return jsonify({"message": f"Disconnected from {port_name}", "status": "disconnected"})
    return jsonify({"message": "No active connection", "status": "idle"})


def read_from_serial():
    """Continuously read from Arduino and emit via Socket.IO"""
    global ser, stop_reading

    while not stop_reading:
        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if not line:
                    continue

                # Stop signal
                if line == "_":
                    print(" Arduino requested stop reading")
                    stop_reading = True
                    socketio.emit('serial_data', {"data": "_STOP_"})
                    break

                print("From Atmega : ", line)
                socketio.emit('serial_data', {"data": line})

        except Exception as e:
            print(f" Serial read error: {e}")
            break


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
