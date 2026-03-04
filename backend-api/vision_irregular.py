"""
vision_irregular.py  —  Smart Parking Vision System
────────────────────────────────────────────────────
Rules (inside white boundary only):
  • RED / YELLOW objects → CARS   (slot becomes occupied)
  • GREEN objects        → BLOCKED (slot cannot be allocated)
  • Empty slots          → AVAILABLE for booking

Dynamic allocation:
  • Each frame we decide which grid cell each detected object is in
  • Changes are POSTed to the Flask backend (/update-slot)
  • Backend handles: reallocation when green enters a reserved slot
"""

import cv2
import numpy as np
import requests

SERVER_URL = "http://127.0.0.1:5000/update-slot"

ROWS = 3
COLS = 4

MIN_BOUNDARY_AREA = 3000   # white sheet minimum pixel area
MIN_CAR_AREA      = 700    # car object minimum pixels
MIN_GREEN_AREA    = 400    # green obstacle minimum pixels

CLR_AVAILABLE = (200, 200, 200)
CLR_OCCUPIED  = (  0,   0, 255)
CLR_BLOCKED   = (  0, 200,   0)
CLR_BOUNDARY  = (255, 200,   0)
CLR_CAR_RED   = (  0,   0, 255)
CLR_CAR_YEL   = (  0, 220, 255)
CLR_HUD       = (255, 255,   0)


# ─────────────────────────────────────────────────────────────────────────────
# 1. BOUNDARY DETECTION
#    Uses the BOUNDING RECTANGLE of the white area (not the filled polygon).
#    This is intentionally robust: when toys sit on the white paper they break
#    the white mask, but the bounding rect of the largest white piece still
#    covers the correct area.
# ─────────────────────────────────────────────────────────────────────────────

def detect_boundary(frame, hsv):
    """
    Find the white parking-lot boundary.
    Returns (boundary_contour, bounding_rect (x,y,w,h), rect_mask)
    where rect_mask is a simple FILLED RECTANGLE mask (robust to toys on paper).
    All None if no boundary found.
    """
    mask = cv2.inRange(hsv, np.array([0, 0, 150]), np.array([180, 70, 255]))

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  kernel)

    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts:
        return None, None, None

    boundary = max(cnts, key=cv2.contourArea)
    if cv2.contourArea(boundary) < MIN_BOUNDARY_AREA:
        return None, None, None

    bx, by, bw, bh = cv2.boundingRect(boundary)

    # Build a simple RECTANGLE mask — robust when objects sit on the paper
    h, w = frame.shape[:2]
    rect_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.rectangle(rect_mask, (bx, by), (bx + bw, by + bh), 255, cv2.FILLED)

    return boundary, (bx, by, bw, bh), rect_mask


# ─────────────────────────────────────────────────────────────────────────────
# 2. COLOUR DETECTION INSIDE BOUNDARY RECT
# ─────────────────────────────────────────────────────────────────────────────

def _detect_colour(hsv, rect_mask, colour_ranges, min_area, frame,
                   draw_colour, label):
    """
    Build colour mask, restrict to inside boundary rect, find contour centres.
    """
    combo = np.zeros(hsv.shape[:2], dtype=np.uint8)
    for lo, hi in colour_ranges:
        combo |= cv2.inRange(hsv, np.array(lo), np.array(hi))

    # Keep only pixels inside the white boundary rectangle
    combo = cv2.bitwise_and(combo, rect_mask)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    combo = cv2.morphologyEx(combo, cv2.MORPH_OPEN,  kernel)
    combo = cv2.morphologyEx(combo, cv2.MORPH_CLOSE, kernel)

    cnts, _ = cv2.findContours(combo, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    centres = []
    for cnt in cnts:
        if cv2.contourArea(cnt) < min_area:
            continue
        rx, ry, rw, rh = cv2.boundingRect(cnt)
        cx, cy = rx + rw // 2, ry + rh // 2
        centres.append((cx, cy))
        cv2.rectangle(frame, (rx, ry), (rx + rw, ry + rh), draw_colour, 2)
        cv2.putText(frame, label, (rx, max(ry - 6, 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, draw_colour, 2)
    return centres


def detect_cars(hsv, rect_mask, frame):
    """RED + YELLOW → cars. Strict inside-boundary."""
    red_ranges    = [([  0, 60, 50], [10,  255, 255]),
                     ([160, 60, 50], [180, 255, 255])]
    yellow_ranges = [([15, 70, 70],  [40,  255, 255])]

    r = _detect_colour(hsv, rect_mask, red_ranges,    MIN_CAR_AREA, frame, CLR_CAR_RED, "RED")
    y = _detect_colour(hsv, rect_mask, yellow_ranges, MIN_CAR_AREA, frame, CLR_CAR_YEL, "YELLOW")
    return r + y


def detect_green(hsv, rect_mask, frame):
    """GREEN → obstacles / blocked slots."""
    green_ranges = [([38, 55, 50], [85, 255, 255])]
    return _detect_colour(hsv, rect_mask, green_ranges, MIN_GREEN_AREA, frame,
                          CLR_BLOCKED, "OBSTACLE")


# ─────────────────────────────────────────────────────────────────────────────
# 3. PIXEL → GRID CELL
# ─────────────────────────────────────────────────────────────────────────────

def pix_to_cell(cx, cy, bx, by, bw, bh):
    slot_w = bw / COLS
    slot_h = bh / ROWS
    c = int((cx - bx) / slot_w)
    r = int((cy - by) / slot_h)
    return max(0, min(r, ROWS-1)), max(0, min(c, COLS-1))


# ─────────────────────────────────────────────────────────────────────────────
# 4. DRAW GRID OVERLAY
# ─────────────────────────────────────────────────────────────────────────────

def draw_grid(frame, bx, by, bw, bh, car_cells, green_cells):
    sw = bw / COLS
    sh = bh / ROWS

    for r in range(ROWS):
        for c in range(COLS):
            x1 = int(bx + c * sw);  y1 = int(by + r * sh)
            x2 = int(x1 + sw);      y2 = int(y1 + sh)
            code = f"A{r * COLS + c + 1}"

            if (r, c) in green_cells:
                cv2.rectangle(frame, (x1, y1), (x2, y2), CLR_BLOCKED, 2)
                for sy in range(y1, y2, 10):
                    cv2.line(frame, (x1, sy), (x2, sy), CLR_BLOCKED, 1)
                cv2.putText(frame, "BLOCKED", (x1+4, y1+20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.35, CLR_BLOCKED, 1)
            elif (r, c) in car_cells:
                overlay = frame.copy()
                cv2.rectangle(overlay, (x1,y1), (x2,y2), (40,0,80), cv2.FILLED)
                cv2.addWeighted(overlay, 0.3, frame, 0.7, 0, frame)
                cv2.rectangle(frame, (x1,y1), (x2,y2), CLR_OCCUPIED, 2)
                cv2.putText(frame, f"{code} CAR", (x1+4, y1+20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.35, CLR_OCCUPIED, 1)
            else:
                cv2.rectangle(frame, (x1,y1), (x2,y2), CLR_AVAILABLE, 1)
                cv2.putText(frame, code, (x1+4, y1+20),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, CLR_AVAILABLE, 1)


# ─────────────────────────────────────────────────────────────────────────────
# 5. BACKEND SYNC  (only post when status changes)
# ─────────────────────────────────────────────────────────────────────────────

def sync_slots(car_cells, green_cells, slot_states):
    for r in range(ROWS):
        for c in range(COLS):
            code = f"A{r * COLS + c + 1}"
            if (r, c) in green_cells:
                status = "blocked"
            elif (r, c) in car_cells:
                status = "occupied"
            else:
                status = "available"

            if slot_states.get(code) != status:
                try:
                    resp = requests.post(SERVER_URL,
                                         json={"slot_code": code, "status": status},
                                         timeout=2)
                    slot_states[code] = status
                    print(f"[SYNC] {code} → {status}  (HTTP {resp.status_code})")
                except Exception as e:
                    print(f"[SYNC ERR] {code}: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# 6. MAIN LOOP
# ─────────────────────────────────────────────────────────────────────────────

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("[ERROR] Cannot open camera.")
    exit(1)

slot_states = {}
print("SmartPark Vision started.  Press 'q' to quit.")
print(f"Grid: {ROWS}x{COLS}  |  RED/YELLOW=car  GREEN=blocked  WHITE=boundary\n")

while True:
    ret, frame = cap.read()
    if not ret:
        continue

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # ── 1. Find boundary ──────────────────────────────────────────────────────
    boundary, rect, rect_mask = detect_boundary(frame, hsv)

    if boundary is None:
        cv2.putText(frame, "No white boundary detected", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 80, 255), 2)
        cv2.putText(frame, "Place white sheet in camera view", (20, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 80, 255), 1)
        cv2.imshow("SmartPark Vision", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        continue

    bx, by, bw, bh = rect
    cv2.drawContours(frame, [boundary], -1, CLR_BOUNDARY, 2)

    # ── 2. Detect colours inside boundary ────────────────────────────────────
    car_centres   = detect_cars(hsv, rect_mask, frame)
    green_centres = detect_green(hsv, rect_mask, frame)

    # ── 3. Map to grid cells ──────────────────────────────────────────────────
    car_cells   = {pix_to_cell(cx, cy, bx, by, bw, bh) for cx, cy in car_centres}
    green_cells = {pix_to_cell(gx, gy, bx, by, bw, bh) for gx, gy in green_centres}
    car_cells  -= green_cells   # obstacle wins

    # ── 4. Overlay ────────────────────────────────────────────────────────────
    draw_grid(frame, bx, by, bw, bh, car_cells, green_cells)

    # ── 5. Sync to backend ────────────────────────────────────────────────────
    sync_slots(car_cells, green_cells, slot_states)

    # ── 6. HUD ────────────────────────────────────────────────────────────────
    free = ROWS * COLS - len(car_cells) - len(green_cells)
    hud  = (f"  Cars:{len(car_cells)}  Blocked:{len(green_cells)}  "
            f"Free:{free}  Boundary:{bw}x{bh}")
    cv2.putText(frame, hud, (10, frame.shape[0] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, CLR_HUD, 1)

    cv2.imshow("SmartPark Vision", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("\nVision stopped.")
        break

cap.release()
cv2.destroyAllWindows()