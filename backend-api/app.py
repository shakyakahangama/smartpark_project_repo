from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from db_config import SQLALCHEMY_DATABASE_URI

# ------------------ APP ------------------

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ------------------ MODELS ------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ERD fields
    name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=True)     # optional (you can use email as username too)
    contact_no = db.Column(db.String(20), nullable=True)               # ContactNo in ERD

    # Your existing field (keep)
    email = db.Column(db.String(150), unique=True, nullable=False)

    # NOTE: plain text for now; later we will hash passwords
    password = db.Column(db.String(100), nullable=False)


class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # ERD fields
    plate_number = db.Column(db.String(50), nullable=False)
    vehicle_type = db.Column(db.String(50), nullable=False)

    # Your size approach (better than a single "Size")
    length_m = db.Column(db.Float, nullable=False)
    width_m = db.Column(db.Float, nullable=False)

    # ERD relationship: User (1) owns (M) Vehicle
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


class ParkingArea(db.Model):
    # ERD: AreaId
    id = db.Column(db.Integer, primary_key=True)

    # ERD fields
    location = db.Column(db.String(200), nullable=False)
    config_type = db.Column(db.String(50), nullable=False)  # e.g., "camera", "sensor", "manual"
    capacity = db.Column(db.Integer, nullable=False)


class ParkingSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slot_code = db.Column(db.String(20), unique=True, nullable=False)

    length_m = db.Column(db.Float, nullable=False)
    width_m = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="available")  # available/reserved/occupied

    # NEW: slot belongs to an area
    area_id = db.Column(db.Integer, db.ForeignKey("parking_area.id"), nullable=False)


class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # ERD relationships
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicle.id"), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey("parking_slot.id"), nullable=False)

    # ERD: TimeIn/TimeOut + Date (we keep strings for beginner simplicity)
    start_time = db.Column(db.String(30), nullable=False)   # TimeIn
    end_time = db.Column(db.String(30), nullable=False)     # TimeOut
    status = db.Column(db.String(20), nullable=False, default="active")


# ------------------ HELPERS ------------------

def allocate_slot_for_vehicle(vehicle: Vehicle, area_id: int | None = None):
    """
    Choose the first available slot that fits vehicle.
    If area_id is given, allocate inside that parking area only.
    """
    q = ParkingSlot.query.filter_by(status="available")
    if area_id is not None:
        q = q.filter_by(area_id=int(area_id))

    slots = q.all()

    # pick smallest fitting slot (by area)
    candidates = []
    for s in slots:
        if s.length_m >= vehicle.length_m and s.width_m >= vehicle.width_m:
            candidates.append(s)

    candidates.sort(key=lambda x: x.length_m * x.width_m)
    return candidates[0] if candidates else None


# ------------------ ROUTES ------------------

@app.get("/")
def home():
    return "Hello SmartPark ✅ Backend is running with MySQL!"


# ---------- AUTH ----------

@app.post("/signup")
def signup():
    data = request.get_json() or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    # new optional fields
    username = data.get("username")      # can be None
    contact_no = data.get("contact_no")  # can be None

    if not name or not email or not password:
        return jsonify({"error": "name, email, password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    if username and User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409

    user = User(
        name=name,
        email=email,
        password=password,
        username=username,
        contact_no=contact_no,
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.post("/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email, password=password).first()
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "username": user.username,
            "contact_no": user.contact_no,
        }
    }), 200


# ---------- VEHICLES ----------

@app.post("/vehicle/add")
def add_vehicle():
    data = request.get_json() or {}

    email = data.get("email")
    plate = data.get("plate_number")
    vtype = data.get("vehicle_type")
    length_m = data.get("length_m")
    width_m = data.get("width_m")

    if not email or not plate or not vtype or length_m is None or width_m is None:
        return jsonify({"error": "email, plate_number, vehicle_type, length_m, width_m are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    vehicle = Vehicle(
        user_id=user.id,
        plate_number=plate,
        vehicle_type=vtype,
        length_m=float(length_m),
        width_m=float(width_m),
    )
    db.session.add(vehicle)
    db.session.commit()

    return jsonify({"message": "Vehicle added successfully", "vehicle_id": vehicle.id}), 201


@app.get("/vehicle/list/<email>")
def list_vehicles(email):
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
    } for v in vehicles])


# ---------- PARKING AREAS (NEW) ----------

@app.post("/area/add")
def add_area():
    data = request.get_json() or {}
    location = data.get("location")
    config_type = data.get("config_type")
    capacity = data.get("capacity")

    if not location or not config_type or capacity is None:
        return jsonify({"error": "location, config_type, capacity are required"}), 400

    area = ParkingArea(
        location=location,
        config_type=config_type,
        capacity=int(capacity)
    )
    db.session.add(area)
    db.session.commit()

    return jsonify({"message": "Area added", "area_id": area.id}), 201


@app.get("/area/list")
def list_areas():
    areas = ParkingArea.query.order_by(ParkingArea.id.asc()).all()
    return jsonify([{
        "area_id": a.id,
        "location": a.location,
        "config_type": a.config_type,
        "capacity": a.capacity
    } for a in areas])


# ---------- SLOTS (UPDATED: must include area_id) ----------

@app.post("/slot/add")
def add_slot():
    data = request.get_json() or {}

    slot_code = data.get("slot_code")
    length_m = data.get("length_m")
    width_m = data.get("width_m")
    area_id = data.get("area_id")

    if not slot_code or length_m is None or width_m is None or area_id is None:
        return jsonify({"error": "slot_code, length_m, width_m, area_id are required"}), 400

    if ParkingSlot.query.filter_by(slot_code=slot_code).first():
        return jsonify({"error": "Slot already exists"}), 409

    area = ParkingArea.query.filter_by(id=int(area_id)).first()
    if not area:
        return jsonify({"error": "Parking area not found"}), 404

    slot = ParkingSlot(
        slot_code=slot_code,
        length_m=float(length_m),
        width_m=float(width_m),
        status="available",
        area_id=area.id
    )
    db.session.add(slot)
    db.session.commit()

    return jsonify({"message": "Slot added", "slot_code": slot.slot_code, "area_id": slot.area_id}), 201


@app.get("/slot/list")
def list_slots():
    slots = ParkingSlot.query.order_by(ParkingSlot.slot_code.asc()).all()
    return jsonify([{
        "slot_code": s.slot_code,
        "length_m": s.length_m,
        "width_m": s.width_m,
        "status": s.status,
        "area_id": s.area_id
    } for s in slots])


# ---------- RESERVATION (UPDATED: optional area_id for area-specific reservation) ----------

@app.post("/reservation/create")
def create_reservation():
    data = request.get_json() or {}

    email = data.get("email")
    vehicle_id = data.get("vehicle_id")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    area_id = data.get("area_id")  # optional

    if not email or not vehicle_id or not start_time or not end_time:
        return jsonify({"error": "email, vehicle_id, start_time, end_time are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    vehicle = Vehicle.query.filter_by(id=int(vehicle_id), user_id=user.id).first()
    if not vehicle:
        return jsonify({"error": "Vehicle not found"}), 404

    # allocate slot (optionally inside an area)
    slot = allocate_slot_for_vehicle(vehicle, area_id=area_id)
    if not slot:
        return jsonify({"error": "No suitable slot available"}), 409

    slot.status = "reserved"

    reservation = Reservation(
        user_id=user.id,
        vehicle_id=vehicle.id,
        slot_id=slot.id,
        start_time=start_time,
        end_time=end_time,
        status="active"
    )
    db.session.add(reservation)
    db.session.commit()

    return jsonify({
        "message": "Reservation created",
        "reservation_id": reservation.id,
        "slot_code": slot.slot_code,
        "area_id": slot.area_id
    }), 201


# ---------- DEBUG ----------

@app.get("/debug/routes")
def debug_routes():
    return jsonify(sorted([str(rule) for rule in app.url_map.iter_rules()]))


# ------------------ START ------------------

if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(host="0.0.0.0", port=5000, debug=False)

