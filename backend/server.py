from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe
stripe_api_key = os.environ.get('STRIPE_API_KEY', '')

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 72

# Subscription Plans (fixed on server - never from frontend)
SUBSCRIPTION_PLANS = {
    "monthly": {"name": "RF Pro Monthly", "amount": 9.99, "currency": "usd", "days": 30},
    "yearly": {"name": "RF Pro Yearly", "amount": 99.99, "currency": "usd", "days": 365},
}

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ──── Pydantic Models ────

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_plan: Optional[str] = None
    active: Optional[bool] = None

class EquipmentItem(BaseModel):
    key: str
    category: str
    data: Dict

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    subscription_status: str = "free"
    subscription_plan: Optional[str] = None
    subscription_end: Optional[str] = None

class ConfigCreate(BaseModel):
    name: str
    radio: str
    driver_amp: str
    final_amp: str
    antenna: str
    vehicle: str
    bonding: bool = True
    extra_alternators: bool = False

class ConfigResponse(BaseModel):
    id: str
    user_id: str
    name: str
    radio: str
    driver_amp: str
    final_amp: str
    antenna: str
    vehicle: str
    bonding: bool
    extra_alternators: bool
    created_at: str

class SubscribeRequest(BaseModel):
    plan: str
    origin_url: str

class RFCalcRequest(BaseModel):
    radio: str
    driver_amp: str
    final_amp: str
    antenna: str
    vehicle: str
    bonding: bool = True
    extra_alternators: bool = False

# ──── RF Equipment Database ────

RADIOS = {
    "cobra-29": {"name": "Cobra 29 LTD", "dead_key": 1.0, "peak_key": 4.0, "impedance": 50},
    "galaxy-959": {"name": "Galaxy DX 959", "dead_key": 5.0, "peak_key": 15.0, "impedance": 50},
    "stryker-955": {"name": "Stryker SR-955HPC", "dead_key": 8.0, "peak_key": 25.0, "impedance": 50},
    "connex-4300": {"name": "Connex 4300HP", "dead_key": 10.0, "peak_key": 30.0, "impedance": 50},
    "ranger-rci2970": {"name": "Ranger RCI-2970N2", "dead_key": 12.0, "peak_key": 40.0, "impedance": 50},
}

DRIVER_AMPS = {
    "none": {"name": "No Driver", "gain_db": 0, "transistors": 0, "current_draw": 0},
    "2-pill": {"name": "2-Pill Driver", "gain_db": 20, "transistors": 2, "current_draw": 12},
    "4-pill": {"name": "4-Pill Driver", "gain_db": 31, "transistors": 4, "current_draw": 25},
}

FINAL_AMPS = {
    "none": {"name": "No Final", "gain_db": 0, "transistors": 0, "current_draw": 0},
    "4-pill": {"name": "4-Pill Amp", "gain_db": 4, "transistors": 4, "current_draw": 40},
    "8-pill": {"name": "8-Pill Amp", "gain_db": 6, "transistors": 8, "current_draw": 90},
    "16-pill": {"name": "16-Pill Amp", "gain_db": 8, "transistors": 16, "current_draw": 160},
}

ANTENNAS = {
    "whip-102": {"name": "102\" Whip", "gain_dbi": 0, "type": "vertical"},
    "center-load": {"name": "Center-Load", "gain_dbi": -1.5, "type": "vertical"},
    "wilson-1000": {"name": "Wilson 1000", "gain_dbi": 3.0, "type": "mag-mount"},
    "predator-10k": {"name": "Predator 10K", "gain_dbi": 5.0, "type": "base-load"},
}

VEHICLES = {
    "suburban": {"name": "Suburban/SUV", "ground_plane": 0.85, "directional": 0.15, "takeoff": 25},
    "f150": {"name": "Ford F-150", "ground_plane": 0.65, "directional": 0.45, "takeoff": 35},
    "ram": {"name": "Dodge Ram", "ground_plane": 0.70, "directional": 0.40, "takeoff": 32},
    "van": {"name": "Cargo Van", "ground_plane": 0.90, "directional": 0.10, "takeoff": 20},
    "wagon": {"name": "Station Wagon", "ground_plane": 0.80, "directional": 0.20, "takeoff": 28},
}

# ──── Auth Helpers ────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str = "user") -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("active") is False:
        raise HTTPException(status_code=403, detail="Account deactivated")
    return user

async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in ("admin", "subadmin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ──── Auth Routes ────

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email,
        "name": data.name,
        "password_hash": hash_password(data.password),
        "role": "user",
        "active": True,
        "subscription_status": "free",
        "subscription_plan": None,
        "subscription_end": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.email, "user")
    return {
        "token": token,
        "user": {
            "id": user_id, "email": data.email, "name": data.name,
            "role": "user", "subscription_status": "free",
            "subscription_plan": None, "subscription_end": None
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"], user.get("role", "user"))
    return {
        "token": token,
        "user": {
            "id": user["id"], "email": user["email"], "name": user["name"],
            "role": user.get("role", "user"),
            "subscription_status": user.get("subscription_status", "free"),
            "subscription_plan": user.get("subscription_plan"),
            "subscription_end": user.get("subscription_end"),
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"], "email": user["email"], "name": user["name"],
        "role": user.get("role", "user"),
        "subscription_status": user.get("subscription_status", "free"),
        "subscription_plan": user.get("subscription_plan"),
        "subscription_end": user.get("subscription_end"),
    }

# ──── Configuration Routes ────

@api_router.post("/configurations")
async def create_config(data: ConfigCreate, user: dict = Depends(get_current_user)):
    config_id = str(uuid.uuid4())
    config_doc = {
        "id": config_id,
        "user_id": user["id"],
        "name": data.name,
        "radio": data.radio,
        "driver_amp": data.driver_amp,
        "final_amp": data.final_amp,
        "antenna": data.antenna,
        "vehicle": data.vehicle,
        "bonding": data.bonding,
        "extra_alternators": data.extra_alternators,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.configurations.insert_one(config_doc)
    return {k: v for k, v in config_doc.items() if k != "_id"}

@api_router.get("/configurations")
async def list_configs(user: dict = Depends(get_current_user)):
    configs = await db.configurations.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return configs

@api_router.delete("/configurations/{config_id}")
async def delete_config(config_id: str, user: dict = Depends(get_current_user)):
    result = await db.configurations.delete_one({"id": config_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return {"status": "deleted"}

# ──── Subscription / Stripe Routes ────

@api_router.post("/subscribe")
async def subscribe(data: SubscribeRequest, request: Request, user: dict = Depends(get_current_user)):
    if data.plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    plan = SUBSCRIPTION_PLANS[data.plan]
    origin = data.origin_url.rstrip("/")
    success_url = origin + "/subscription?session_id={CHECKOUT_SESSION_ID}"
    cancel_url = origin + "/subscription"

    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

    checkout_req = CheckoutSessionRequest(
        amount=plan["amount"],
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"user_id": user["id"], "plan": data.plan, "plan_name": plan["name"]}
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_req)

    # Create payment transaction record
    tx_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": session.session_id,
        "amount": plan["amount"],
        "currency": plan["currency"],
        "plan": data.plan,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(tx_doc)

    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # If already processed, return cached status
    if tx.get("payment_status") == "paid":
        return {"status": "complete", "payment_status": "paid"}

    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)

    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    except Exception as e:
        logger.error(f"Stripe status check failed: {e}")
        return {"status": tx.get("payment_status", "pending"), "payment_status": tx.get("payment_status", "pending")}

    # Update transaction
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": status.payment_status, "status": status.status}}
    )

    # If paid, update user subscription (only once)
    if status.payment_status == "paid":
        plan_key = tx.get("plan", "monthly")
        plan = SUBSCRIPTION_PLANS.get(plan_key, SUBSCRIPTION_PLANS["monthly"])
        end_date = (datetime.now(timezone.utc) + timedelta(days=plan["days"])).isoformat()
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {
                "subscription_status": "active",
                "subscription_plan": plan_key,
                "subscription_end": end_date,
            }}
        )

    return {"status": status.status, "payment_status": status.payment_status}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    try:
        event = await stripe_checkout.handle_webhook(body, sig)
        if event.payment_status == "paid" and event.session_id:
            tx = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
            if tx and tx.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"payment_status": "paid", "status": "complete"}}
                )
                plan_key = tx.get("plan", "monthly")
                plan = SUBSCRIPTION_PLANS.get(plan_key, SUBSCRIPTION_PLANS["monthly"])
                end_date = (datetime.now(timezone.utc) + timedelta(days=plan["days"])).isoformat()
                await db.users.update_one(
                    {"id": tx["user_id"]},
                    {"$set": {
                        "subscription_status": "active",
                        "subscription_plan": plan_key,
                        "subscription_end": end_date,
                    }}
                )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ──── RF Calculation Route ────

@api_router.post("/calculate")
async def calculate_rf(data: RFCalcRequest):
    radio = RADIOS.get(data.radio)
    driver = DRIVER_AMPS.get(data.driver_amp)
    final = FINAL_AMPS.get(data.final_amp)
    antenna = ANTENNAS.get(data.antenna)
    vehicle = VEHICLES.get(data.vehicle)

    if not all([radio, driver, final, antenna, vehicle]):
        raise HTTPException(status_code=400, detail="Invalid equipment selection")

    # Signal chain calculation
    dead_key_power = radio["dead_key"]
    if driver["gain_db"] > 0:
        dead_key_power *= 10 ** (driver["gain_db"] / 10)
    if final["gain_db"] > 0:
        dead_key_power *= 10 ** (final["gain_db"] / 10)

    peak_power = radio["peak_key"]
    if driver["gain_db"] > 0:
        peak_power *= 10 ** (driver["gain_db"] / 10)
    if final["gain_db"] > 0:
        peak_power *= 10 ** (final["gain_db"] / 10)

    # Bonding effect
    bonding_factor = 1.0 if data.bonding else 0.6
    dead_key_power *= bonding_factor
    peak_power *= bonding_factor

    # Antenna gain
    antenna_factor = 10 ** (antenna["gain_dbi"] / 10)
    effective_dead = dead_key_power * antenna_factor
    effective_peak = peak_power * antenna_factor

    # Voltage drop
    total_current = driver["current_draw"] + final["current_draw"]
    battery_voltage = 14.2
    alternator_capacity = 300 if data.extra_alternators else 130
    wire_resistance = 0.005
    voltage_drop = total_current * wire_resistance
    effective_voltage = battery_voltage - voltage_drop
    overloaded = total_current > alternator_capacity

    if overloaded:
        voltage_sag = (total_current - alternator_capacity) * 0.02
        effective_voltage -= voltage_sag
        power_reduction = max(0.3, effective_voltage / battery_voltage)
        effective_dead *= power_reduction
        effective_peak *= power_reduction

    # Take-off angle
    base_takeoff = vehicle["takeoff"]
    bonding_penalty = 0 if data.bonding else 15
    takeoff_angle = base_takeoff + bonding_penalty

    # SWR calculation (simplified)
    swr = 1.5 if data.bonding else 3.2
    if antenna["type"] == "mag-mount":
        swr += 0.3

    # Ground plane quality
    gp_quality = vehicle["ground_plane"] * (1.0 if data.bonding else 0.5)

    return {
        "dead_key_watts": round(effective_dead, 1),
        "peak_watts": round(effective_peak, 1),
        "raw_dead_key": round(dead_key_power / bonding_factor if bonding_factor else 0, 1),
        "raw_peak": round(peak_power / bonding_factor if bonding_factor else 0, 1),
        "voltage": round(effective_voltage, 2),
        "voltage_drop": round(voltage_drop, 3),
        "overloaded": overloaded,
        "current_draw": total_current,
        "swr": round(swr, 1),
        "takeoff_angle": takeoff_angle,
        "ground_plane_quality": round(gp_quality, 2),
        "directional_bias": vehicle["directional"],
    }

# ──── Equipment Data Route ────

@api_router.get("/equipment")
async def get_equipment():
    return {
        "radios": RADIOS,
        "driver_amps": DRIVER_AMPS,
        "final_amps": FINAL_AMPS,
        "antennas": ANTENNAS,
        "vehicles": VEHICLES,
    }

# ──── Include Router & Middleware ────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
