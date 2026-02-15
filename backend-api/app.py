# app.py (MySQL local)
from __future__ import annotations

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import heapq

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
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    contact_number = db.Column(db.String(30), nullable=True)

    password_hash = db.Column(db.String(255), nullable=False)

    vehicles = db.relationship("Vehicle", backref="user", lazy=True, cascade="all, delete-orphan")
    reservations = db.relationship("Reservation", backref="user", lazy=True, cascade="all, delete-orphan")
    notifications = db.relationship("Notification", backref="user", lazy=True, cascade="all, delete-orphan")


class Vehicle(db.Model):
    __tablename__ = "vehicles"
    id = db.Column(db.Integer, primary_key=True)

    plate_number = db.Column(db.String(60), nullable=False)
    vehicle_type = db.Column(db.String(60), nullable=False)  # CAR / MOTOR BIKE / VAN

    # from Vehicle Details UI
    length_m = db.Column(db.Float, nullable=True)
    width_m = db.Column(db.Float, nullable=True)
    door_opening_type = db.Column(db.String(80), nullable=True)
    terms_accepted = db.Column(db.Boolean, default=False)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    reservations = db.relationship("Reservation", backref="vehicle", lazy=True, cascade="all, delete-orphan")


class ParkingArea(db.Model):
    __tablename__ = "parking_areas"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False)

    slots = db.relationship("ParkingSlot", backref="area", lazy=True, cascade="all, delete-orphan")


class ParkingSlot(db.Model):
    __tablename__ = "parking_slots"
    id = db.Column(db.Integer, primary_key=True)

    slot_code = db.Column(db.String(20), unique=True, nullable=False)
    length_m = db.Column(db.Float, nullable=False)
    width_m = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="available")  # available/reserved/occupied

    area_id = db.Column(db.Integer, db.ForeignKey("parking_areas.id"), nullable=False)

    reservations = db.relationship("Reservation", backref="slot", lazy=True, cascade="all, delete-orphan")


class Reservation(db.Model):
    __tablename__ = "reservations"
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey("parking_slots.id"), nullable=False)

    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)

    status = db.Column(db.String(20), default="active")  # active/cancelled/completed


class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.String(300), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


# =========================================================
# HELPERS
# =========================================================

def require_fields(data, fields):
    missing = [f for f in fields if data.get(f) in (None, "", [])]
    if missing:
        return jsonify({"error": f"{', '.join(missing)} are required"}), 400
    return None


def parse_dt(dt_str: str) -> datetime:
    dt_str = (dt_str or "").strip()
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M"):
        try:
            return datetime.strptime(dt_str, fmt)
        except ValueError:
            pass
    raise ValueError("Invalid datetime format. Use 'YYYY-MM-DD HH:MM' or 'YYYY-MM-DDTHH:MM'.")


def ensure_area(area_id=1) -> ParkingArea:
    area = ParkingArea.query.get(area_id)
    if not area:
        area = ParkingArea(name=f"Area {area_id}")
        db.session.add(area)
        db.session.commit()
    return area


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
# SLOT ALLOCATION (Best-fit)
# =========================================================

def best_slot_for_vehicle(vehicle: Vehicle, area_id=None):
    q = ParkingSlot.query.filter_by(status="available")
    if area_id is not None:
        q = q.filter_by(area_id=area_id)

    # If vehicle dimensions not yet provided, just pick smallest available slot
    if vehicle.length_m is None or vehicle.width_m is None:
        slots = q.order_by((ParkingSlot.length_m * ParkingSlot.width_m)).all()
        return slots[0] if slots else None

    candidates = []
    for s in q.all():
        if s.length_m >= vehicle.length_m and s.width_m >= vehicle.width_m:
            candidates.append(s)

    if not candidates:
        return None

    candidates.sort(key=lambda s: (s.length_m * s.width_m))
    return candidates[0]


def next_slot_code(prefix="A"):
    slots = ParkingSlot.query.filter(ParkingSlot.slot_code.like(f"{prefix}%")).all()
    max_num = 0
    for s in slots:
        num = s.slot_code.replace(prefix, "")
        if num.isdigit():
            max_num = max(max_num, int(num))
    return f"{prefix}{max_num + 1}"


def create_slot_for_vehicle(vehicle: Vehicle, area_id=1):
    area = ensure_area(area_id)
    code = next_slot_code("A")

    # default size if vehicle dimensions not known yet
    base_len = float(vehicle.length_m) if vehicle.length_m else 4.5
    base_wid = float(vehicle.width_m) if vehicle.width_m else 2.0

    new_slot = ParkingSlot(
        slot_code=code,
        length_m=base_len + 0.5,
        width_m=base_wid + 0.3,
        status="available",
        area_id=area.id,
    )
    db.session.add(new_slot)
    db.session.commit()
    return new_slot


# =========================================================
# PATH GUIDANCE (Graph + Dijkstra) - simple demo
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


def add_notification(user_id: int, title: str, message: str):
    n = Notification(user_id=user_id, title=title, message=message)
    db.session.add(n)
    db.session.commit()


# =========================================================
# ROUTES
# =========================================================

@app.get("/")
def home():
    return "SmartPark Backend Running ✅"


@app.get("/health")
def health():
    return jsonify({"ok": True}), 200


@app.get("/debug/routes")
def debug_routes():
    return jsonify(sorted([str(r) for r in app.url_map.iter_rules()])), 200


@app.get("/debug/db")
def debug_db():
    """Quick check in browser: /debug/db"""
    return jsonify({
        "users": [{"id": u.id, "name": u.name, "email": u.email, "contact": u.contact_number} for u in User.query.all()],
        "vehicles": [{"id": v.id, "plate": v.plate_number, "type": v.vehicle_type, "user_id": v.user_id} for v in Vehicle.query.all()],
        "areas": [{"id": a.id, "name": a.name} for a in ParkingArea.query.all()],
        "slots": [{"id": s.id, "code": s.slot_code, "status": s.status} for s in ParkingSlot.query.all()],
        "reservations": [{"id": r.id, "user_id": r.user_id, "slot": r.slot.slot_code if r.slot else None, "status": r.status} for r in Reservation.query.all()],
        "notifications": [{"id": n.id, "title": n.title, "message": n.message, "created_at": n.created_at.isoformat()} for n in Notification.query.all()],
    }), 200


# ---------------- AUTH ----------------

@app.post("/signup")
def signup():
    expire_reservations()
    data = request.get_json() or {}

    required = require_fields(data, ["name", "email", "password", "vehicle_type", "plate_number"])
    if required:
        return required

    email = data["email"].strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    user = User(
        name=data["name"].strip(),
        email=email,
        contact_number=str(data.get("contact_number", "")).strip() or None,
        password_hash=generate_password_hash(data["password"]),
    )
    db.session.add(user)
    db.session.commit()

    vehicle = Vehicle(
        user_id=user.id,
        plate_number=str(data["plate_number"]).strip().upper(),
        vehicle_type=str(data["vehicle_type"]).strip().upper(),
    )
    db.session.add(vehicle)
    db.session.commit()

    add_notification(user.id, "Welcome", "Your account has been created successfully.")

    return jsonify({
        "message": "User registered successfully",
        "user": {"id": user.id, "name": user.name, "email": user.email},
        "vehicle": {"id": vehicle.id, "plate_number": vehicle.plate_number, "vehicle_type": vehicle.vehicle_type},
    }), 201


@app.post("/login")
def login():
    expire_reservations()
    data = request.get_json() or {}

    required = require_fields(data, ["email", "password"])
    if required:
        return required

    email = data["email"].strip().lower()
    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    # return user vehicles too (useful for reservation screen)
    vehicles = Vehicle.query.filter_by(user_id=user.id).all()

    return jsonify({
        "message": "Login successful",
        "user": {"id": user.id, "name": user.name, "email": user.email, "contact_number": user.contact_number},
        "vehicles": [{"id": v.id, "plate_number": v.plate_number, "vehicle_type": v.vehicle_type} for v in vehicles],
    }), 200


# ---------------- VEHICLE DETAILS SCREEN ----------------

@app.post("/vehicle/details")
def save_vehicle_details():
    """Vehicle Details UI -> saves dimensions + door opening type + terms accepted"""
    expire_reservations()
    data = request.get_json() or {}

    required = require_fields(data, ["email", "plate_number", "length_m", "width_m", "door_opening_type", "terms_accepted"])
    if required:
        return required

    email = str(data["email"]).strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    plate = str(data["plate_number"]).strip().upper()
    vehicle = Vehicle.query.filter_by(user_id=user.id, plate_number=plate).first()
    if not vehicle:
        return jsonify({"error": "Vehicle not found"}), 404

    vehicle.length_m = float(data["length_m"])
    vehicle.width_m = float(data["width_m"])
    vehicle.door_opening_type = str(data["door_opening_type"]).strip()
    vehicle.terms_accepted = bool(data["terms_accepted"])

    db.session.commit()
    return jsonify({"message": "Vehicle details saved"}), 200


@app.get("/vehicle/list/<email>")
def list_vehicles(email):
    expire_reservations()
    email = (email or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    vehicles = Vehicle.query.filter_by(user_id=user.id).all()
    return jsonify([{
        "id": v.id,
        "plate_number": v.plate_number,
        "vehicle_type": v.vehicle_type,
        "length_m": v.length_m,
        "width_m": v.width_m,
        "door_opening_type": v.door_opening_type,
        "terms_accepted": v.terms_accepted,
    } for v in vehicles]), 200


# ---------------- RESERVATION ----------------

@app.post("/reservation/create")
def create_reservation():
    expire_reservations()
    data = request.get_json() or {}

    required = require_fields(data, ["email", "vehicle_id", "start_time", "end_time"])
    if required:
        return required

    email = str(data["email"]).strip().lower()
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

    add_notification(user.id, "Reservation Successful", f"Your slot is {slot.slot_code}. Please arrive within 15 minutes.")

    return jsonify({
        "message": "Reservation created",
        "reservation": {
            "id": r.id,
            "slot": slot.slot_code,
            "slot_created": created,
            "start_time": r.start_time.strftime("%Y-%m-%d %H:%M"),
            "end_time": r.end_time.strftime("%Y-%m-%d %H:%M"),
            "status": r.status,
        }
    }), 201


@app.get("/reservation/list/<email>")
def list_reservations(email):
    expire_reservations()
    email = (email or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    res = Reservation.query.filter_by(user_id=user.id).order_by(Reservation.id.desc()).all()
    return jsonify([{
        "id": r.id,
        "status": r.status,
        "slot": r.slot.slot_code if r.slot else None,
        "vehicle_plate": r.vehicle.plate_number if r.vehicle else None,
        "start_time": r.start_time.strftime("%Y-%m-%d %H:%M"),
        "end_time": r.end_time.strftime("%Y-%m-%d %H:%M"),
    } for r in res]), 200


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
    if r.slot and r.slot.status == "reserved":
        r.slot.status = "available"

    db.session.commit()
    add_notification(r.user_id, "Reservation Cancelled", "Your reservation has been cancelled.")
    return jsonify({"message": "Reservation cancelled"}), 200


# ---------------- PATH GUIDANCE ----------------

@app.get("/guidance/<slot_code>")
def guidance(slot_code):
    expire_reservations()
    slot_code = (slot_code or "").strip().upper()
    path, dist = shortest_path(PARK_GRAPH, "ENTRANCE", slot_code)

    if not path:
        return jsonify({"error": "No route found (demo supports A1-A50)"}), 404

    return jsonify({
        "slot": slot_code,
        "path": path,
        "distance": dist,
        "instructions": [f"Go to {n}" for n in path],
    }), 200


# ---------------- NOTIFICATIONS ----------------

@app.get("/notifications/<email>")
def notifications(email):
    expire_reservations()
    email = (email or "").strip().lower()
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    notes = Notification.query.filter_by(user_id=user.id).order_by(Notification.id.desc()).all()
    return jsonify([{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "created_at": n.created_at.strftime("%Y-%m-%d %H:%M"),
    } for n in notes]), 200


# =========================================================
# START (LOCAL)
# =========================================================


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=False)