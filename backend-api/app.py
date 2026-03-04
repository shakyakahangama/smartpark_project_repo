# app.py

from __future__ import annotations
from flask import Flask, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import cv2
import numpy as np
import threading

from db_config import SQLALCHEMY_DATABASE_URI

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# ==========================================================
# MODELS
# ==========================================================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)


class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    plate_number = db.Column(db.String(60), nullable=False)
    vehicle_type = db.Column(db.String(60), default="CAR")
    length = db.Column(db.Float, nullable=True)
    width = db.Column(db.Float, nullable=True)
    height = db.Column(db.Float, nullable=True)
    door_type = db.Column(db.String(60), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


class ParkingSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slot_code = db.Column(db.String(20), unique=True, nullable=False)
    status = db.Column(db.String(20), default="available")
    # available / reserved / occupied


class Reservation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicle.id"), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey("parking_slot.id"), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="active")


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    title = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)


class Feedback(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)


# ==========================================================
# HELPERS
# ==========================================================

def require_fields(data, fields):
    missing = [f for f in fields if not data.get(f)]
    if missing:
        return jsonify({"message": f"{', '.join(missing)} required"}), 400
    return None


def push_notification(user_id, title, message):
    """Create and persist a notification for the given user."""
    note = Notification(user_id=user_id, title=title, message=message)
    db.session.add(note)
    # commit is done by caller inside its own commit


def parse_dt(dt_str):
    return datetime.strptime(dt_str.strip(), "%Y-%m-%d %H:%M")


def ensure_slots():
    if ParkingSlot.query.count() == 0:
        for i in range(1, 13):
            db.session.add(ParkingSlot(
                slot_code=f"A{i}",
                status="available"
            ))
        db.session.commit()


def expire_reservations():
    now = datetime.now()
    expired = Reservation.query.filter(
        Reservation.status == "active",
        Reservation.end_time <= now
    ).all()

    for r in expired:
        r.status = "completed"
        slot = ParkingSlot.query.get(r.slot_id)
        if slot and slot.status != "occupied":
            slot.status = "available"

    if expired:
        db.session.commit()


# ==========================================================
# AUTH
# ==========================================================

@app.post("/signup")
def signup():
    data = request.get_json() or {}
    required = require_fields(data, ["name", "email", "password"])
    if required:
        return required

    email = data["email"].lower().strip()
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email exists"}), 409

    user = User(
        name=data["name"],
        email=email,
        password_hash=generate_password_hash(data["password"])
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "User registered"}), 201


@app.post("/login")
def login():
    data = request.get_json() or {}
    required = require_fields(data, ["email", "password"])
    if required:
        return required

    user = User.query.filter_by(email=data["email"].lower().strip()).first()

    if not user or not check_password_hash(user.password_hash, data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    return jsonify({
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }), 200


# ==========================================================
# VEHICLES
# ==========================================================

# THIS FIXES YOUR 404 ERROR
@app.post("/vehicle/details")
def save_vehicle_details():
    data = request.get_json() or {}

    required = require_fields(data, ["email", "plate_number"])
    if required:
        return required

    user = User.query.filter_by(email=data["email"].lower().strip()).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    plate = data["plate_number"].strip().upper()

    vehicle = Vehicle.query.filter_by(
        user_id=user.id,
        plate_number=plate
    ).first()

    if not vehicle:
        vehicle = Vehicle(
            plate_number=plate,
            vehicle_type="CAR",
            user_id=user.id
        )
        db.session.add(vehicle)

    if "length_m" in data: vehicle.length = float(data["length_m"])
    if "width_m" in data: vehicle.width = float(data["width_m"])
    if "height_m" in data: vehicle.height = float(data["height_m"])
    if "door_opening_type" in data: vehicle.door_type = data["door_opening_type"]

    db.session.commit()

    return jsonify({"message": "Vehicle saved successfully"}), 200


@app.get("/vehicle/list/<email>")
def list_vehicles(email):
    user = User.query.filter_by(email=email.lower().strip()).first()
    if not user:
        return jsonify([]), 200

    vehicles = Vehicle.query.filter_by(user_id=user.id).all()

    return jsonify([
        {
            "id": v.id,
            "plate_number": v.plate_number,
            "vehicle_type": v.vehicle_type,
            "length": v.length,
            "width": v.width,
            "height": v.height,
            "door_type": v.door_type,
        }
        for v in vehicles
    ]), 200


# ==========================================================
# RESERVATION
# ==========================================================

@app.post("/reservation/create")
def create_reservation():
    expire_reservations()
    ensure_slots()

    data = request.get_json() or {}
    required = require_fields(data, ["email", "vehicle_id", "start_time", "end_time"])
    if required:
        return required

    user = User.query.filter_by(email=data["email"].lower().strip()).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    vehicle = Vehicle.query.get(data["vehicle_id"])
    if not vehicle:
        return jsonify({"message": "Vehicle not found"}), 404

    slot = ParkingSlot.query.filter_by(status="available").first()
    if not slot:
        return jsonify({"message": "Parking Full"}), 404

    start = parse_dt(data["start_time"])
    end = parse_dt(data["end_time"])

    slot.status = "reserved"

    reservation = Reservation(
        user_id=user.id,
        vehicle_id=vehicle.id,
        slot_id=slot.id,
        start_time=start,
        end_time=end
    )

    db.session.add(reservation)

    # Auto-notification
    push_notification(
        user_id=user.id,
        title="Reservation Confirmed",
        message=(
            f"Your slot {slot.slot_code} has been reserved from "
            f"{start.strftime('%Y-%m-%d %H:%M')} to {end.strftime('%Y-%m-%d %H:%M')}."
        )
    )

    db.session.commit()

    return jsonify({
        "slot": slot.slot_code,
        "reservation_id": reservation.id,
        "start_time": start.strftime("%Y-%m-%d %H:%M"),
        "end_time": end.strftime("%Y-%m-%d %H:%M")
    }), 201


@app.get("/reservation/list/<email>")
def list_reservations(email):
    user = User.query.filter_by(email=email.lower().strip()).first()
    if not user:
        return jsonify([]), 200

    reservations = (
        Reservation.query
        .filter_by(user_id=user.id, status="active")
        .order_by(Reservation.start_time.desc())
        .all()
    )

    result = []
    for r in reservations:
        slot = ParkingSlot.query.get(r.slot_id)
        result.append({
            "id": r.id,
            "slot": slot.slot_code if slot else "?",
            "slot_id": r.slot_id,
            "start_time": r.start_time.strftime("%Y-%m-%d %H:%M"),
            "end_time": r.end_time.strftime("%Y-%m-%d %H:%M"),
            "status": r.status,
        })

    return jsonify(result), 200


# ==========================================================
# SLOT STATUS
# ==========================================================

@app.get("/slots/status")
def slot_status():
    ensure_slots()
    slots = ParkingSlot.query.all()

    return jsonify([
        {"slot_code": s.slot_code, "status": s.status}
        for s in slots
        if s.status != "blocked"          # hide vision-blocked slots from the UI
    ]), 200


# ==========================================================
# VISION SYSTEM UPDATE
# ==========================================================

@app.post("/update-slot")
def update_slot():
    data = request.get_json() or {}
    slot_code = data.get("slot_code")
    new_status = data.get("status")

    slot = ParkingSlot.query.filter_by(slot_code=slot_code).first()
    if not slot:
        return jsonify({"message": "Slot not found"}), 404

    # Log incoming update for debugging
    print(f"[DEBUG] Slot {slot_code} Update: {slot.status} -> {new_status}")

    # PROTECT 'reserved' status from being overwritten by 'available'
    # If the database thinks it's reserved, we don't let vision say 'available'
    # because vision only sees if a car is PHYSICALLY there, not the booking.
    if slot.status == "reserved" and new_status == "available":
        return jsonify({"message": "Kept as reserved"}), 200

    # DYNAMIC RE-ALLOCATION LOGIC
    # If a green obstacle enters a reserved OR occupied slot, move the reservation.
    if new_status == "blocked" and slot.status in ("reserved", "occupied"):
        # Find the active reservation for this slot
        res = Reservation.query.filter_by(slot_id=slot.id, status="active").first()
        if res:
            # Find a NEW available slot (not the current one, not blocked)
            new_slot = (
                ParkingSlot.query
                .filter(
                    ParkingSlot.status == "available",
                    ParkingSlot.id != slot.id
                )
                .first()
            )
            if new_slot:
                old_code = slot.slot_code
                print(f"[RE-ALLOCATE] Moving reservation {res.id} from {old_code} → {new_slot.slot_code}")
                res.slot_id = new_slot.id
                new_slot.status = "reserved"
                slot.status = "blocked"

                push_notification(
                    user_id=res.user_id,
                    title="Parking Slot Changed",
                    message=(
                        f"A green obstacle was detected in your slot {old_code}. "
                        f"Your reservation has been automatically moved to slot {new_slot.slot_code}."
                    )
                )
                db.session.commit()
                return jsonify({
                    "message": "Slot blocked; reservation moved",
                    "new_slot": new_slot.slot_code
                }), 200
            else:
                # No free slot to move to — still block it and notify
                slot.status = "blocked"
                push_notification(
                    user_id=res.user_id,
                    title="Slot Blocked — No Alternative",
                    message=(
                        f"A green obstacle was detected in your slot {slot.slot_code} "
                        f"and no alternative slot is currently available. "
                        f"Please contact parking staff."
                    )
                )
                db.session.commit()
                return jsonify({"message": "Slot blocked; no free slot for reallocation"}), 200

    slot.status = new_status
    db.session.commit()
    return jsonify({"message": "Updated"}), 200


# ==========================================================
# WEBCAM FEED (laptop camera → mobile app)
# ==========================================================

ROWS, COLS = 3, 4                        # parking grid layout
_cam = None
_cam_lock = threading.Lock()


def _get_camera():
    """Lazy-open the webcam so it only starts when needed."""
    global _cam
    if _cam is None or not _cam.isOpened():
        # Try camera indices 0, 1, 2 to find an available device
        for idx in [0, 1, 2]:
            _cam = cv2.VideoCapture(idx)
            if _cam.isOpened():
                break
    return _cam


def _detect_car(hsv):
    """Detect the largest RED or YELLOW object as a car. Returns (x,y,w,h) or None."""
    # --- Red range 1 (hue 0-10) ---
    mask_r1 = cv2.inRange(hsv, np.array([0,   70, 50]),  np.array([10,  255, 255]))
    # --- Red range 2 (hue 160-180) ---
    mask_r2 = cv2.inRange(hsv, np.array([160,  70, 50]), np.array([180, 255, 255]))
    # --- Yellow (hue 15-35) ---
    mask_y  = cv2.inRange(hsv, np.array([15,  80, 80]),  np.array([35,  255, 255]))

    mask = mask_r1 | mask_r2 | mask_y

    # Remove noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best = None
    best_area = 0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 800 and area > best_area:       # ignore tiny specks
            best = cnt
            best_area = area

    if best is not None:
        return cv2.boundingRect(best)
    return None


def _draw_overlay(frame, target_slot=None):
    """Detect red/yellow car, draw grid, size the slot to the car, and guide it."""
    h, w = frame.shape[:2]
    slot_w = w // COLS
    slot_h = h // ROWS
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # ---- Draw faint grid lines & slot labels ----
    for r in range(ROWS + 1):
        y = r * slot_h
        cv2.line(frame, (0, y), (w, y), (180, 180, 180), 1)
    for c in range(COLS + 1):
        x = c * slot_w
        cv2.line(frame, (x, 0), (x, h), (180, 180, 180), 1)

    for r in range(ROWS):
        for c in range(COLS):
            slot_num = r * COLS + c + 1
            code = f"A{slot_num}"
            lx = c * slot_w + slot_w // 2 - 12
            ly = r * slot_h + slot_h // 2 + 6
            cv2.putText(frame, code, (lx, ly),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

    # ---- Detect the car (red / yellow object) ----
    car_rect = _detect_car(hsv)

    if car_rect:
        cx, cy, cw, ch = car_rect
        car_cx = cx + cw // 2
        car_cy = cy + ch // 2

        # Draw bounding box around the detected car
        cv2.rectangle(frame, (cx, cy), (cx + cw, cy + ch), (255, 255, 0), 2)
        cv2.putText(frame, "CAR", (cx, cy - 8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 0), 2)

        # ---- Highlight the target slot sized to match the car ----
        if target_slot:
            try:
                num = int(target_slot.replace("A", "")) - 1
                tr = num // COLS
                tc = num % COLS

                # Slot centre (grid-based)
                slot_cx = tc * slot_w + slot_w // 2
                slot_cy = tr * slot_h + slot_h // 2

                # Size the slot rectangle to match the car size (with a small pad)
                pad = 6
                s_x1 = slot_cx - cw // 2 - pad
                s_y1 = slot_cy - ch // 2 - pad
                s_x2 = slot_cx + cw // 2 + pad
                s_y2 = slot_cy + ch // 2 + pad

                # Draw the car-sized slot box
                cv2.rectangle(frame, (s_x1, s_y1), (s_x2, s_y2), (0, 255, 0), 3)
                cv2.putText(frame, target_slot, (s_x1, s_y1 - 8),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

                # ---- Guidance arrow from car centre to slot centre ----
                cv2.arrowedLine(frame, (car_cx, car_cy), (slot_cx, slot_cy),
                                (0, 255, 0), 2, tipLength=0.06)

                # Distance indicator (pixels)
                dist = int(np.hypot(slot_cx - car_cx, slot_cy - car_cy))
                mid_lx = (car_cx + slot_cx) // 2
                mid_ly = (car_cy + slot_cy) // 2
                cv2.putText(frame, f"{dist}px", (mid_lx + 5, mid_ly - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1)

                # ---- Direction hint text ----
                hints = []
                if car_cx < slot_cx - 20:
                    hints.append("RIGHT")
                elif car_cx > slot_cx + 20:
                    hints.append("LEFT")
                if car_cy < slot_cy - 20:
                    hints.append("DOWN")
                elif car_cy > slot_cy + 20:
                    hints.append("UP")

                if dist < 40:
                    direction = "PARKED!"
                    color = (0, 255, 0)
                else:
                    direction = "Move " + " & ".join(hints) if hints else "ALIGNED"
                    color = (0, 200, 255)

                cv2.putText(frame, direction, (10, h - 15),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

            except Exception:
                pass
    else:
        # No car detected
        cv2.putText(frame, "No vehicle detected", (10, h - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 100, 255), 2)
        # Still show static slot highlight when no car
        if target_slot:
            try:
                num = int(target_slot.replace("A", "")) - 1
                tr = num // COLS
                tc = num % COLS
                x1, y1 = tc * slot_w, tr * slot_h
                x2, y2 = x1 + slot_w, y1 + slot_h
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, target_slot, (x1 + 4, y1 + 18),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
            except Exception:
                pass

    return frame


def _generate_mjpeg(target_slot):
    """Generator that yields MJPEG frames."""
    while True:
        with _cam_lock:
            cam = _get_camera()
            ok, frame = cam.read()
        if not ok:
            continue
        frame = _draw_overlay(frame, target_slot)
        _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        yield (b"--frame\r\n"
               b"Content-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n")


@app.get("/video-feed")
def video_feed():
    """MJPEG stream — open in a browser for live video."""
    slot = request.args.get("slot", None)
    return Response(_generate_mjpeg(slot),
                    mimetype="multipart/x-mixed-replace; boundary=frame")


@app.get("/video-snapshot")
def video_snapshot():
    """Single JPEG frame — used by the mobile app (polled every 500 ms)."""
    slot = request.args.get("slot", None)
    with _cam_lock:
        cam = _get_camera()
        ok, frame = cam.read()
    if not ok:
        return jsonify({"message": "Camera not available"}), 503
    frame = _draw_overlay(frame, slot)
    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
    return Response(buf.tobytes(), mimetype="image/jpeg")


# ==========================================================
# PATH GUIDANCE (text instructions)
# ==========================================================

@app.get("/guidance/<slot_code>")
def guidance(slot_code):
    """Return turn-by-turn text instructions for reaching the given slot."""
    try:
        num = int(slot_code.upper().replace("A", "")) - 1
    except ValueError:
        return jsonify({"instructions": ["Invalid slot code."]}), 400

    row = num // COLS  # 0-based row
    col = num % COLS   # 0-based column

    steps = ["Enter the parking lot through the main gate."]

    if row == 0:
        steps.append("Stay on the ground-floor level (Row 1).")
    elif row == 1:
        steps.append("Continue straight past Row 1 to Row 2.")
    else:
        steps.append("Drive all the way to the far end — Row 3.")

    if col == 0:
        steps.append("Take the first left — your slot is on the left side.")
    elif col == 1:
        steps.append("Take the second left — your slot is in the centre-left.")
    elif col == 2:
        steps.append("Take the third left — your slot is in the centre-right.")
    else:
        steps.append("Take the last left — your slot is on the far right.")

    steps.append(f"Park in slot {slot_code.upper()}. You have arrived!")

    return jsonify({"instructions": steps}), 200


# ==========================================================
# FEEDBACK
# ==========================================================

@app.post("/feedback")
def submit_feedback():
    data = request.get_json() or {}
    required = require_fields(data, ["email", "message", "rating"])
    if required:
        return required

    user = User.query.filter_by(email=data["email"].lower().strip()).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    fb = Feedback(
        user_id=user.id,
        message=data["message"],
        rating=int(data["rating"])
    )
    db.session.add(fb)
    db.session.commit()

    return jsonify({"message": "Feedback submitted successfully"}), 201


# ==========================================================
# RESET ROUTE
# ==========================================================

@app.get("/reset-slots")
def reset_slots():
    ParkingSlot.query.update({"status": "available"})
    Reservation.query.delete()
    db.session.commit()
    return jsonify({"message": "Reset complete"}), 200


# ==========================================================
# NOTIFICATIONS
# ==========================================================

@app.get("/notifications/<email>")
def get_notifications(email):
    user = User.query.filter_by(email=email.lower().strip()).first()
    if not user:
        return jsonify([]), 200

    notes = (
        Notification.query
        .filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )

    return jsonify([
        {
            "id":         n.id,
            "title":      n.title,
            "message":    n.message,
            "created_at": n.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for n in notes
    ]), 200


# also expose reservation cancel notification
@app.post("/reservation/cancel")
def cancel_reservation():
    data = request.get_json() or {}
    rid = data.get("reservation_id")
    r = Reservation.query.get(rid)
    if not r:
        return jsonify({"message": "Reservation not found"}), 404

    r.status = "cancelled"
    slot = ParkingSlot.query.get(r.slot_id)
    if slot and slot.status not in ("occupied", "blocked"):
        slot.status = "available"

    push_notification(
        user_id=r.user_id,
        title="Reservation Cancelled",
        message=f"Your reservation (ID {r.id}) for slot {slot.slot_code if slot else ''} has been cancelled."
    )
    db.session.commit()
    return jsonify({"message": "Cancelled"}), 200


# ==========================================================

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)