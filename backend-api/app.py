# app.py
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import heapq
import random

from db_config import SQLALCHEMY_DATABASE_URI

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# =========================================================
# MODELS
# =========================================================

class User(db.Model):
    __tablename__ = "users"  # safer than "user"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    vehicles = db.relationship("Vehicle", backref="user", lazy=True)
    reservations = db.relationship("Reservation", backref="user", lazy=True)


class Vehicle(db.Model):
    __tablename__ = "vehicles"
    id = db.Column(db.Integer, primary_key=True)
    plate_number = db.Column(db.String(60), nullable=False)
    vehicle_type = db.Column(db.String(60), nullable=False)
    length_m = db.Column(db.Float, nullable=False)
    width_m = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    reservations = db.relationship("Reservation", backref="vehicle", lazy=True)


class ParkingArea(db.Model):
    __tablename__ = "parking_areas"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

    slots = db.relationship("ParkingSlot", backref="area", lazy=True)


class ParkingSlot(db.Model):
    __tablename__ = "parking_slots"
    id = db.Column(db.Integer, primary_key=True)
    slot_code = db.Column(db.String(20), unique=True, nullable=False)
    length_m = db.Column(db.Float, nullable=False)
    width_m = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="available")  # available/reserved/occupied
    area_id = db.Column(db.Integer, db.ForeignKey("parking_areas.id"), nullable=False)

    reservations = db.relationship("Reservation", backref="slot", lazy=True)


class Reservation(db.Model):
    __tablename__ = "reservations"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey("parking_slots.id"), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="active")  # active/cancelled/completed


# =========================================================
# HELPERS
# =========================================================

def require_fields(data, fields):
    missing = [f for f in fields if data.get(f) in (None, "", [])]
    if missing:
        return jsonify({"error": f"{', '.join(missing)} are required"}), 400
    return None


def parse_dt(dt_str):
    dt_str = (dt_str or "").strip()
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M"):
        try:
            return datetime.strptime(dt_str, fmt)
        except ValueError:
            pass
    raise ValueError("Invalid datetime format. Use 'YYYY-MM-DD HH:MM' or 'YYYY-MM-DDTHH:MM'.")


def ensure_area(area_id=1):
    area = ParkingArea.query.get(area_id)
    if not area:
        area = ParkingArea(name=f"Area {area_id}")
        db.session.add(area)
        db.session.commit()
    return area


# ✅ Auto-expire reservations and free slots
def expire_reservations():
    now = datetime.now()

    expired = Reservation.query.filter(
        Reservation.status == "active",
        Reservation.end_time <= now
    ).all()

    for r in expired:
        r.status = "completed"
        if r.slot and r.slot.status == "reserved":
            r.slot.status = "available"

    if expired:
        db.session.commit()


# =========================================================
# MODEL 1: SLOT ALLOCATION (Best-fit)
# =========================================================

def best_slot_for_vehicle(vehicle, area_id=None):
    q = ParkingSlot.query.filter_by(status="available")
    if area_id is not None:
        q = q.filter_by(area_id=area_id)

    candidates = []
    for s in q.all():
        if s.length_m >= vehicle.length_m and s.width_m >= vehicle.width_m:
            candidates.append(s)

    if not candidates:
        return None

    candidates.sort(key=lambda s: (s.length_m * s.width_m))  # best fit
    return candidates[0]


def next_slot_code(prefix="A"):
    slots = ParkingSlot.query.filter(ParkingSlot.slot_code.like(f"{prefix}%")).all()
    max_num = 0
    for s in slots:
        code = s.slot_code.replace(prefix, "")
        if code.isdigit():
            max_num = max(max_num, int(code))
    return f"{prefix}{max_num + 1}"


def create_slot_for_vehicle(vehicle, area_id=1):
    area = ensure_area(area_id)

    code = next_slot_code("A")

    # safety margins
    new_slot = ParkingSlot(
        slot_code=code,
        length_m=float(vehicle.length_m) + 0.5,
        width_m=float(vehicle.width_m) + 0.3,
        status="available",
        area_id=area.id
    )
    db.session.add(new_slot)
    db.session.commit()
    return new_slot


# =========================================================
# MODEL 2: PATH GUIDANCE (Graph + Dijkstra)
# =========================================================

def build_graph(row="A", n=50):
    g = {"ENTRANCE": {}}

    for i in range(1, min(6, n + 1)):
        g["ENTRANCE"][f"{row}{i}"] = i

    for i in range(1, n + 1):
        node = f"{row}{i}"
        g[node] = {}
        if i < n:
            g[node][f"{row}{i+1}"] = 1
        if i > 1:
            g[node][f"{row}{i-1}"] = 1

    return g


PARK_GRAPH = build_graph(row="A", n=50)


def shortest_path(graph, start, goal):
    pq = [(0, start, [])]
    visited = set()

    while pq:
        cost, node, path = heapq.heappop(pq)
        if node in visited:
            continue

        visited.add(node)
        path = path + [node]

        if node == goal:
            return path, cost

        for nxt, w in graph.get(node, {}).items():
            if nxt not in visited:
                heapq.heappush(pq, (cost + w, nxt, path))

    return None, None


# =========================================================
# ROUTES
# =========================================================

@app.get("/")
def home():
    return "SmartPark Backend Running ✅"


@app.get("/health")
def health():
    return jsonify({"ok": True}), 200


# ---------------- USER ----------------

@app.post("/signup")
def signup():
    data = request.get_json() or {}
    required = require_fields(data, ["name", "email", "password"])
    if required:
        return required

    email = data["email"].strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    user = User(
        name=data["name"].strip(),
        email=email,
        password_hash=generate_password_hash(data["password"]),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201


@app.post("/login")
def login():
    data = request.get_json() or {}
    required = require_fields(data, ["email", "password"])
    if required:
        return required

    email = data["email"].strip().lower()
    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {"id": user.id, "name": user.name, "email": user.email}
    }), 200


# ---------------- AREA ----------------

@app.post("/area/add")
def add_area():
    data = request.get_json() or {}
    required = require_fields(data, ["name"])
    if required:
        return required

    name = data["name"].strip()
    if ParkingArea.query.filter_by(name=name).first():
        return jsonify({"error": "Area already exists"}), 409

    area = ParkingArea(name=name)
    db.session.add(area)
    db.session.commit()
    return jsonify({"message": "Area added", "area_id": area.id}), 201


@app.get("/area/list")
def list_areas():
    expire_reservations()
    areas = ParkingArea.query.all()
    return jsonify([{"id": a.id, "name": a.name} for a in areas]), 200


# ---------------- SLOT ----------------

@app.post("/slot/add")
def add_slot():
    data = request.get_json() or {}
    required = require_fields(data, ["slot_code", "length_m", "width_m", "area_id"])
    if required:
        return required

    code = str(data["slot_code"]).strip().upper()
    if ParkingSlot.query.filter_by(slot_code=code).first():
        return jsonify({"error": "slot_code already exists"}), 409

    area = ParkingArea.query.get(int(data["area_id"]))
    if not area:
        return jsonify({"error": "Area not found"}), 404

    slot = ParkingSlot(
        slot_code=code,
        length_m=float(data["length_m"]),
        width_m=float(data["width_m"]),
        area_id=area.id,
        status="available",
    )
    db.session.add(slot)
    db.session.commit()
    return jsonify({"message": "Slot added", "slot_code": slot.slot_code}), 201


@app.get("/slot/list")
def list_slots():
    expire_reservations()
    slots = ParkingSlot.query.all()
    return jsonify([{
        "id": s.id,
        "slot_code": s.slot_code,
        "status": s.status,
        "area_id": s.area_id,
        "length_m": s.length_m,
        "width_m": s.width_m
    } for s in slots]), 200


# ---------------- VEHICLE ----------------

@app.post("/vehicle/add")
def add_vehicle():
    data = request.get_json() or {}
    required = require_fields(data, ["email", "plate_number", "vehicle_type", "length_m", "width_m"])
    if required:
        return required

    email = data["email"].strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    vehicle = Vehicle(
        user_id=user.id,
        plate_number=str(data["plate_number"]).strip().upper(),
        vehicle_type=str(data["vehicle_type"]).strip(),
        length_m=float(data["length_m"]),
        width_m=float(data["width_m"]),
    )
    db.session.add(vehicle)
    db.session.commit()
    return jsonify({"message": "Vehicle added", "vehicle_id": vehicle.id}), 201


@app.get("/vehicle/list/<email>")
def list_vehicles(email):
    expire_reservations()
    email = email.strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    vehicles = Vehicle.query.filter_by(user_id=user.id).all()
    return jsonify([{
        "id": v.id,
        "plate_number": v.plate_number,
        "vehicle_type": v.vehicle_type,
        "length_m": v.length_m,
        "width_m": v.width_m
    } for v in vehicles]), 200


@app.post("/vehicle/delete")
def delete_vehicle():
    expire_reservations()
    data = request.get_json() or {}
    required = require_fields(data, ["email", "vehicle_id"])
    if required:
        return required

    email = data["email"].strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    v = Vehicle.query.get(int(data["vehicle_id"]))
    if not v or v.user_id != user.id:
        return jsonify({"error": "Vehicle not found for this user"}), 404

    active = Reservation.query.filter_by(vehicle_id=v.id, status="active").first()
    if active:
        return jsonify({"error": "Cannot delete vehicle with an active reservation"}), 409

    db.session.delete(v)
    db.session.commit()
    return jsonify({"message": "Vehicle deleted"}), 200


# ---------------- RESERVATION ----------------

@app.post("/reservation/create")
def create_reservation():
    expire_reservations()

    data = request.get_json() or {}
    required = require_fields(data, ["email", "vehicle_id", "start_time", "end_time"])
    if required:
        return required

    email = data["email"].strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    vehicle = Vehicle.query.get(int(data["vehicle_id"]))
    if not vehicle or vehicle.user_id != user.id:
        return jsonify({"error": "Vehicle not found for this user"}), 404

    try:
        start = parse_dt(data["start_time"])
        end = parse_dt(data["end_time"])
        if end <= start:
            return jsonify({"error": "end_time must be after start_time"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    created = False
    slot = best_slot_for_vehicle(vehicle)
    if not slot:
        slot = create_slot_for_vehicle(vehicle, area_id=1)
        created = True

    slot.status = "reserved"

    r = Reservation(
        user_id=user.id,
        vehicle_id=vehicle.id,
        slot_id=slot.id,
        start_time=start,
        end_time=end,
        status="active",
    )
    db.session.add(r)
    db.session.commit()

    return jsonify({
        "message": "Reservation created",
        "reservation_id": r.id,
        "slot": slot.slot_code,
        "slot_created": created
    }), 201


@app.get("/reservation/list/<email>")
def list_reservations(email):
    expire_reservations()

    email = email.strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # ✅ only active (so cancelled won’t appear after refresh)
    res = Reservation.query.filter_by(user_id=user.id, status="active") \
        .order_by(Reservation.id.desc()).all()

    out = []
    for r in res:
        out.append({
            "id": r.id,
            "vehicle_id": r.vehicle_id,
            "slot_id": r.slot_id,
            "slot": r.slot.slot_code if r.slot else None,
            "plate": r.vehicle.plate_number if r.vehicle else None,
            "status": r.status,
            "start_time": r.start_time.strftime("%Y-%m-%d %H:%M"),
            "end_time": r.end_time.strftime("%Y-%m-%d %H:%M"),
        })

    return jsonify(out), 200


@app.post("/reservation/cancel")
def cancel_reservation():
    expire_reservations()

    data = request.get_json() or {}
    required = require_fields(data, ["reservation_id"])
    if required:
        return required

    r = Reservation.query.get(int(data["reservation_id"]))
    if not r:
        return jsonify({"error": "Reservation not found"}), 404

    if r.status != "active":
        return jsonify({"error": "Reservation is not active"}), 409

    r.status = "cancelled"
    if r.slot:
        r.slot.status = "available"

    db.session.commit()
    return jsonify({"message": "Reservation cancelled"}), 200


@app.post("/reservation/delete")
def delete_reservation():
    expire_reservations()

    data = request.get_json() or {}
    required = require_fields(data, ["reservation_id"])
    if required:
        return required

    r = Reservation.query.get(int(data["reservation_id"]))
    if not r:
        return jsonify({"error": "Reservation not found"}), 404

    if r.status == "active" and r.slot:
        r.slot.status = "available"

    db.session.delete(r)
    db.session.commit()
    return jsonify({"message": "Reservation deleted"}), 200


# ---------------- PATH GUIDANCE ----------------

@app.get("/guidance/<slot_code>")
def guidance(slot_code):
    expire_reservations()

    slot_code = slot_code.strip().upper()
    path, dist = shortest_path(PARK_GRAPH, "ENTRANCE", slot_code)
    if not path:
        return jsonify({"error": "No route found for that slot (graph supports A1-A50)"}), 404

    return jsonify({
        "slot": slot_code,
        "path": path,
        "distance": dist,
        "instructions": [f"Go to {n}" for n in path]
    }), 200


# ---------------- AI DETECT (SIMULATED) ----------------

@app.post("/ai/detect")
def ai_detect():
    expire_reservations()

    slots = ParkingSlot.query.all()
    if not slots:
        return jsonify({"error": "No slots found"}), 404

    for s in slots:
        if s.status == "reserved":
            continue
        if random.random() < 0.2:
            s.status = "occupied" if s.status == "available" else "available"

    db.session.commit()
    return jsonify({
        "message": "AI detection updated slot statuses (simulated)",
        "slots": [{"slot": s.slot_code, "status": s.status} for s in slots]
    }), 200


# ---------------- DEBUG ----------------

@app.get("/debug/routes")
def debug_routes():
    return jsonify(sorted([str(r) for r in app.url_map.iter_rules()])), 200


# =========================================================
# START
# =========================================================

if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(host="0.0.0.0", port=5000, debug=False)