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
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)


class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    plate_number = db.Column(db.String(50), nullable=False)
    vehicle_type = db.Column(db.String(50), nullable=False)
    length_m = db.Column(db.Float, nullable=False)
    width_m = db.Column(db.Float, nullable=False)

    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


class ParkingSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slot_code = db.Column(db.String(20), unique=True, nullable=False)
    length_m = db.Column(db.Float, nullable=False)
    width_m = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="available")


class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicle.id"), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey("parking_slot.id"), nullable=False)

    start_time = db.Column(db.String(30), nullable=False)
    end_time = db.Column(db.String(30), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="active")

# ------------------ ROUTES ------------------

@app.get("/")
def home():
    return "Hello SmartPark ✅ Backend is running with MySQL!"


@app.post("/signup")
def signup():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=name, email=email, password=password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.post("/login")
def login():
    data = request.get_json()
    user = User.query.filter_by(
        email=data.get("email"),
        password=data.get("password")
    ).first()

    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({"message": "Login successful"}), 200


@app.post("/vehicle/add")
def add_vehicle():
    data = request.get_json()

    user = User.query.filter_by(email=data.get("email")).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    vehicle = Vehicle(
        user_id=user.id,
        plate_number=data.get("plate_number"),
        vehicle_type=data.get("vehicle_type"),
        length_m=data.get("length_m"),
        width_m=data.get("width_m"),
    )
    db.session.add(vehicle)
    db.session.commit()

    return jsonify({"message": "Vehicle added successfully"}), 201


@app.get("/vehicle/list/<email>")
def list_vehicles(email):
    user = User.query.filter_by(email=email).first()
    vehicles = Vehicle.query.filter_by(user_id=user.id).all()
    return jsonify([{
        "id": v.id,
        "plate": v.plate_number,
        "type": v.vehicle_type
    } for v in vehicles])


@app.post("/slot/add")
def add_slot():
    data = request.get_json()
    slot = ParkingSlot(
        slot_code=data.get("slot_code"),
        length_m=data.get("length_m"),
        width_m=data.get("width_m"),
        status="available"
    )
    db.session.add(slot)
    db.session.commit()
    return jsonify({"message": "Slot added"}), 201


@app.get("/slot/list")
def list_slots():
    slots = ParkingSlot.query.all()
    return jsonify([{
        "slot_code": s.slot_code,
        "status": s.status
    } for s in slots])


@app.post("/reservation/create")
def create_reservation():
    data = request.get_json()

    user = User.query.filter_by(email=data.get("email")).first()
    vehicle = Vehicle.query.filter_by(id=data.get("vehicle_id")).first()

    slots = ParkingSlot.query.filter_by(status="available").all()
    slot = slots[0] if slots else None

    if not slot:
        return jsonify({"error": "No slot available"}), 409

    slot.status = "reserved"

    reservation = Reservation(
        user_id=user.id,
        vehicle_id=vehicle.id,
        slot_id=slot.id,
        start_time=data.get("start_time"),
        end_time=data.get("end_time"),
    )
    db.session.add(reservation)
    db.session.commit()

    return jsonify({"message": "Reservation created", "slot": slot.slot_code}), 201


@app.get("/debug/routes")
def debug_routes():
    return jsonify(sorted([str(rule) for rule in app.url_map.iter_rules()]))

# ------------------ START ------------------

if __name__ == "__main__":
    with app.app_context():
        db.create_all()

    app.run(host="127.0.0.1", port=5000, debug=False)
