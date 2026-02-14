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
DEFAULT_PLANS = {
    "monthly": {"name": "RF Pro Monthly", "amount": 99.99, "currency": "usd", "days": 30},
    "yearly": {"name": "RF Pro Yearly", "amount": 999.99, "currency": "usd", "days": 365},
}

async def get_subscription_plans():
    plans = await db.settings.find_one({"key": "subscription_plans"}, {"_id": 0})
    if plans and "data" in plans:
        return plans["data"]
    return DEFAULT_PLANS

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
    driver_transistor: str = "none"
    driver_box_size: int = 0
    driver_heatsink: str = "medium"
    final_transistor: str = "none"
    final_box_size: int = 0
    final_heatsink: str = "medium"
    antenna: str
    antenna_position: str = "center"
    vehicle: str
    bonding: bool = True
    alternator_count: int = 1
    alternator_amps: int = 130
    battery_type: str = "lead"
    battery_count: int = 1
    regulator_voltages: list = [14.2]
    tip_length: float = 48

class ConfigResponse(BaseModel):
    id: str
    user_id: str
    name: str
    radio: str
    driver_transistor: str = "none"
    driver_box_size: int = 0
    driver_heatsink: str = "medium"
    final_transistor: str = "none"
    final_box_size: int = 0
    final_heatsink: str = "medium"
    antenna: str
    antenna_position: str = "center"
    vehicle: str
    bonding: bool = True
    created_at: str = ""

class SubscribeRequest(BaseModel):
    plan: str
    origin_url: str

class RFCalcRequest(BaseModel):
    radio: str
    driver_transistor: str = "none"
    driver_box_size: int = 0
    driver_heatsink: str = "medium"
    final_transistor: str = "none"
    final_box_size: int = 0
    final_heatsink: str = "medium"
    antenna: str
    antenna_position: str = "center"
    vehicle: str
    bonding: bool = True
    alternator_count: int = 1
    alternator_amps: int = 130
    battery_type: str = "lead"
    battery_count: int = 1
    regulator_voltages: list = [14.2]
    tip_length: float = 48

# ──── RF Equipment Database ────

RADIOS = {
    "cobra-29": {"name": "Cobra 29 LTD", "dead_key": 0.75, "peak_key": 25, "type": "AM", "impedance": 50},
    "galaxy-959": {"name": "Galaxy DX 959", "dead_key": 2, "peak_key": 40, "type": "AM/SSB", "impedance": 50},
    "stryker-955": {"name": "Stryker SR-955HPC", "dead_key": 3, "peak_key": 125, "type": "AM/SSB", "impedance": 50},
    "connex-4300": {"name": "Connex 4300HP", "dead_key": 3.5, "peak_key": 160, "type": "AM/SSB", "impedance": 50},
    "ranger-rci2970": {"name": "Ranger RCI-2970N2", "dead_key": 4, "peak_key": 225, "type": "AM/SSB", "impedance": 50},
}

TRANSISTORS = {
    "toshiba-2sc2879": {"name": "Toshiba 2SC2879", "watts_pep": 100, "gain_db": 13, "dissipation": 250, "tj_max": 175, "efficiency": 0.35, "drive_watts": 4, "current_max": 25},
    "hg-2sc2879": {"name": "HG 2SC2879", "watts_pep": 125, "gain_db": 11.5, "dissipation": 250, "tj_max": 175, "efficiency": 0.35, "drive_watts": 5, "current_max": 25},
    "mitsubishi-2sc3240": {"name": "Mitsubishi 2SC3240", "watts_pep": 105, "gain_db": 11.5, "dissipation": 270, "tj_max": 175, "efficiency": 0.575, "drive_watts": 7, "current_max": 25},
    "mrf454": {"name": "MRF454", "watts_pep": 80, "gain_db": 10, "dissipation": 150, "tj_max": 175, "efficiency": 0.65, "drive_watts": 8, "current_max": 15},
    "sd1446": {"name": "SD1446", "watts_pep": 70, "gain_db": 10, "dissipation": 183, "tj_max": 175, "efficiency": 0.55, "drive_watts": 7, "current_max": 12},
    "hg-sd1446": {"name": "HG SD1446", "watts_pep": 75, "gain_db": 10, "dissipation": 183, "tj_max": 175, "efficiency": 0.55, "drive_watts": 7.5, "current_max": 12},
}

HEATSINKS = {
    "small": {"name": "Small (passive/small fins)", "thermal_resistance": 2.0, "cool_rate": 0.8},
    "medium": {"name": "Medium (finned + fan)", "thermal_resistance": 0.8, "cool_rate": 2.0},
    "large": {"name": "Large (big fins + high-CFM)", "thermal_resistance": 0.3, "cool_rate": 4.0},
}

BOX_SIZES = [1, 2, 3, 4, 6, 8, 16, 24, 32]

COMBINING_BONUS_PER_STAGE = 1.2

ANTENNAS = {
    "whip-102": {"name": "102\" Stainless Whip", "gain_dbi": 0, "type": "vertical", "tunable": False},
    "center-load": {"name": "Center-Load", "gain_dbi": -1.5, "type": "vertical", "tunable": False},
    "wilson-1000": {"name": "Wilson 1000", "gain_dbi": 3.0, "type": "mag-mount", "tunable": False},
    "predator-k1-9": {"name": "Predator 10K K-1-9 (9\" shaft)", "gain_dbi": 4.0, "type": "base-load", "tunable": True, "tip_min": 30, "tip_max": 58, "tip_default": 48},
    "predator-k1-12": {"name": "Predator 10K K-1-12 (12\" shaft)", "gain_dbi": 4.5, "type": "base-load", "tunable": True, "tip_min": 30, "tip_max": 58, "tip_default": 46},
    "predator-k1-17": {"name": "Predator 10K K-1-17 (17\" shaft)", "gain_dbi": 5.0, "type": "base-load", "tunable": True, "tip_min": 30, "tip_max": 58, "tip_default": 44},
    "predator-k1-22": {"name": "Predator 10K K-1-22 (22\" shaft)", "gain_dbi": 5.5, "type": "base-load", "tunable": True, "tip_min": 28, "tip_max": 56, "tip_default": 42},
    "predator-k1-27": {"name": "Predator 10K K-1-27 (27\" shaft)", "gain_dbi": 6.0, "type": "base-load", "tunable": True, "tip_min": 28, "tip_max": 49, "tip_default": 40},
    "predator-k2-9": {"name": "Predator 20K K-2-9 Double Coil", "gain_dbi": 6.5, "type": "base-load", "tunable": True, "tip_min": 28, "tip_max": 56, "tip_default": 44},
    "predator-k2-12": {"name": "Predator 20K K-2-12 Double Coil (12\")", "gain_dbi": 7.0, "type": "base-load", "tunable": True, "tip_min": 28, "tip_max": 56, "tip_default": 42},
    "predator-k2-17": {"name": "Predator 20K K-2-17 Double Coil (17\")", "gain_dbi": 7.5, "type": "base-load", "tunable": True, "tip_min": 26, "tip_max": 54, "tip_default": 40},
    "predator-comp-9": {"name": "Predator Comp 9\" Adj", "gain_dbi": 5.0, "type": "base-load", "tunable": True, "tip_min": 26, "tip_max": 58, "tip_default": 46},
    "predator-comp-12": {"name": "Predator Comp 12\" Adj", "gain_dbi": 5.5, "type": "base-load", "tunable": True, "tip_min": 26, "tip_max": 58, "tip_default": 44},
    "predator-comp-17": {"name": "Predator Comp 17\" Adj", "gain_dbi": 6.0, "type": "base-load", "tunable": True, "tip_min": 26, "tip_max": 56, "tip_default": 42},
    "predator-comp-22": {"name": "Predator Comp 22\" Adj", "gain_dbi": 6.5, "type": "base-load", "tunable": True, "tip_min": 24, "tip_max": 54, "tip_default": 40},
    "fight-stix-6": {"name": "Fight Stix 6' (4ft shaft + whip)", "gain_dbi": 4.5, "type": "vertical", "tunable": True, "tip_min": 36, "tip_max": 60, "tip_default": 52},
    "fight-stix-8": {"name": "Fight Stix 8' (6ft shaft + whip)", "gain_dbi": 5.5, "type": "vertical", "tunable": True, "tip_min": 36, "tip_max": 60, "tip_default": 50},
    "fight-stix-10": {"name": "Fight Stix 10' (8ft shaft + whip)", "gain_dbi": 7.0, "type": "vertical", "tunable": True, "tip_min": 36, "tip_max": 60, "tip_default": 50},
    "fight-stix-12": {"name": "Fight Stix 12' (10ft shaft + whip)", "gain_dbi": 8.0, "type": "vertical", "tunable": True, "tip_min": 34, "tip_max": 58, "tip_default": 48},
}

VEHICLES = {
    "suburban": {"name": "Suburban/SUV", "ground_plane": 0.88, "surface_sqft": 42, "directional": 0.12, "takeoff": 22, "shape": "suv", "ground_height": 5.5},
    "wagon": {"name": "Station Wagon", "ground_plane": 0.80, "surface_sqft": 36, "directional": 0.20, "takeoff": 26, "shape": "wagon", "ground_height": 4.5},
    "jeep": {"name": "Jeep Wrangler", "ground_plane": 0.55, "surface_sqft": 22, "directional": 0.55, "takeoff": 40, "shape": "jeep", "ground_height": 4.0},
    "shootout": {"name": "Shootout Truck (Built)", "ground_plane": 0.92, "surface_sqft": 38, "directional": 0.12, "takeoff": 18, "shape": "truck", "ground_height": 4.2},
    "silverado-rcsb": {"name": "Silverado 1500 RCSB", "ground_plane": 0.70, "surface_sqft": 34, "directional": 0.35, "takeoff": 28, "shape": "truck", "ground_height": 5.8},
    "c10": {"name": "Chevy C10 ('67-'72)", "ground_plane": 0.65, "surface_sqft": 28, "directional": 0.40, "takeoff": 32, "shape": "truck", "ground_height": 4.8},
    "silverado-3500": {"name": "Silverado 3500HD Crew/Long", "ground_plane": 0.82, "surface_sqft": 46, "directional": 0.18, "takeoff": 20, "shape": "truck", "ground_height": 6.5},
    "f150": {"name": "Ford F-150", "ground_plane": 0.68, "surface_sqft": 32, "directional": 0.38, "takeoff": 30, "shape": "truck", "ground_height": 5.5},
    "f350": {"name": "Ford F-350 Super Duty", "ground_plane": 0.80, "surface_sqft": 48, "directional": 0.20, "takeoff": 22, "shape": "truck", "ground_height": 6.8},
    "ram": {"name": "Ram 1500", "ground_plane": 0.68, "surface_sqft": 31, "directional": 0.42, "takeoff": 32, "shape": "truck", "ground_height": 5.2},
    "ram-3500": {"name": "Ram 3500 Crew Cab", "ground_plane": 0.78, "surface_sqft": 45, "directional": 0.22, "takeoff": 23, "shape": "truck", "ground_height": 6.5},
    "van": {"name": "Cargo Van", "ground_plane": 0.92, "surface_sqft": 52, "directional": 0.08, "takeoff": 18, "shape": "van", "ground_height": 7.0},
    "semi": {"name": "Semi Truck", "ground_plane": 0.95, "surface_sqft": 65, "directional": 0.05, "takeoff": 15, "shape": "semi", "ground_height": 8.5},
}

ANTENNA_POSITIONS = {
    "center":     {"name": "Center Roof",  "db_loss": 0},
    "rear":       {"name": "Rear Mount",   "db_loss": 2.1},
    "front":      {"name": "Front Mount",  "db_loss": 1.5},
    "back-right": {"name": "Back Right",   "db_loss": 2.8},
    "back-left":  {"name": "Back Left",    "db_loss": 2.8},
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
        "antenna_position": data.antenna_position,
        "vehicle": data.vehicle,
        "bonding": data.bonding,
        "alternator_count": data.alternator_count,
        "alternator_amps": data.alternator_amps,
        "battery_type": data.battery_type,
        "battery_count": data.battery_count,
        "regulator_voltages": data.regulator_voltages,
        "tip_length": data.tip_length,
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
    plans = await get_subscription_plans()
    if data.plan not in plans:
        raise HTTPException(status_code=400, detail="Invalid plan")
    plan = plans[data.plan]
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
        plans = await get_subscription_plans()
        plan = plans.get(plan_key, plans.get("monthly", DEFAULT_PLANS["monthly"]))
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
                plans = await get_subscription_plans()
                plan = plans.get(plan_key, plans.get("monthly", DEFAULT_PLANS["monthly"]))
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

    # Signal chain calculation — each 2SC2879 pill produces ~550W max
    dead_key_power = radio["dead_key"]
    peak_power = radio["peak_key"]

    # Driver stage: high gain but capped at pills x wpp x compounded combining bonus
    if driver["gain_db"] > 0:
        driver_gain = 10 ** (driver["gain_db"] / 10)
        stages = driver.get("combining_stages", 0)
        combining = COMBINING_BONUS_PER_STAGE ** stages
        driver_max = driver["transistors"] * driver.get("watts_per_pill", 275) * combining
        dead_key_power = min(dead_key_power * driver_gain, driver_max)
        peak_power = min(peak_power * driver_gain, driver_max)

    # Final stage: lower gain but capped at pills x wpp x compounded combining bonus
    if final["gain_db"] > 0:
        final_gain = 10 ** (final["gain_db"] / 10)
        stages = final.get("combining_stages", 0)
        combining = COMBINING_BONUS_PER_STAGE ** stages
        final_max = final["transistors"] * final.get("watts_per_pill", 275) * combining
        dead_key_power = min(dead_key_power * final_gain, final_max)
        peak_power = min(peak_power * final_gain, final_max)

    # Bonding effect
    bonding_factor = 1.0 if data.bonding else 0.6
    dead_key_power *= bonding_factor
    peak_power *= bonding_factor

    # Antenna position affects pattern shape only, NOT total power output
    # The amp puts out the same watts — the ground plane redirects it

    # Antenna gain
    antenna_factor = 10 ** (antenna["gain_dbi"] / 10)
    effective_dead = dead_key_power * antenna_factor
    effective_peak = peak_power * antenna_factor

    # Voltage — external regulators control alternator output voltage
    demand_current = driver["current_draw"] + final["current_draw"]
    reg_voltages = data.regulator_voltages or [14.2]
    reg_count = len(reg_voltages)
    alts_per_reg = math.ceil(data.alternator_count / max(1, reg_count))
    weighted_voltage = 0
    total_assigned = 0
    for i in range(reg_count):
        alts_this = min(alts_per_reg, data.alternator_count - total_assigned)
        if alts_this > 0:
            weighted_voltage += reg_voltages[i] * alts_this
            total_assigned += alts_this
    battery_voltage = weighted_voltage / total_assigned if total_assigned > 0 else 14.2

    alternator_max = data.alternator_count * data.alternator_amps * 1.08
    wire_resistance = (0.0001 * 12) / max(1, data.alternator_count)

    BATTERY_SPECS = {
        "none":    {"ah": 0,   "c_rate": 0,   "internal_r": 999},
        "lead":    {"ah": 100, "c_rate": 3,   "internal_r": 0.012},
        "agm":     {"ah": 100, "c_rate": 5,   "internal_r": 0.006},
        "lithium": {"ah": 100, "c_rate": 15,  "internal_r": 0.002},
        "caps":    {"ah": 5,   "c_rate": 200, "internal_r": 0.0005},
    }
    batt = BATTERY_SPECS.get(data.battery_type, BATTERY_SPECS["none"])
    bank_ah = batt["ah"] * data.battery_count
    bank_max_discharge = bank_ah * batt["c_rate"]
    bank_resistance = batt["internal_r"] / data.battery_count if data.battery_count > 0 else 999

    bank_provides = min(demand_current, bank_max_discharge)
    alt_direct = min(max(0, demand_current - bank_provides), alternator_max)
    actual_current = bank_provides + alt_direct
    overloaded = demand_current > (bank_max_discharge + alternator_max)

    bank_drop = bank_provides * bank_resistance
    wire_drop = alt_direct * wire_resistance
    effective_voltage = battery_voltage - bank_drop - wire_drop

    if overloaded:
        demand_ratio = demand_current / (bank_max_discharge + alternator_max)
        sag = min(4.5, (demand_ratio - 1) * 2.5)
        effective_voltage -= sag

    effective_voltage = max(8.0, effective_voltage)
    total_current = round(actual_current)

    net_drain = max(0, bank_provides - alternator_max)
    hold_time_sec = int((bank_ah / net_drain) * 3600) if net_drain > 0 else 9999

    if overloaded:
        power_reduction = max(0.3, effective_voltage / battery_voltage)
        effective_dead *= power_reduction
        effective_peak *= power_reduction

    # Take-off angle
    base_takeoff = vehicle["takeoff"]
    bonding_penalty = 0 if data.bonding else 15
    takeoff_angle = base_takeoff + bonding_penalty

    # SWR calculation — based on antenna type, vehicle surface area, and tip tuning
    base_swr = 1.0
    if antenna["type"] == "mag-mount":
        base_swr = 1.2
    elif antenna["type"] == "base-load":
        base_swr = 1.05
    surface_penalty = (1 - vehicle["ground_plane"]) * 2.5
    swr = base_swr + surface_penalty
    if not data.bonding:
        swr += 0.9
    # Tunable tip adjustment
    if antenna.get("tunable") and data.tip_length:
        sweet_spot = antenna.get("tip_default", 44)
        deviation = abs(data.tip_length - sweet_spot)
        tip_penalty = deviation * 0.05
        tip_bonus = max(0, 0.4 - tip_penalty)
        swr = swr - tip_bonus + max(0, tip_penalty - 0.4) * 0.5
    swr = round(max(1.0, swr), 1)

    # Ground plane quality
    gp_quality = vehicle["ground_plane"] * (1.0 if data.bonding else 0.5)

    # Under-driven detection
    drive_watts = radio["dead_key"]
    if driver["gain_db"] > 0:
        driver_gain_raw = 10 ** (driver["gain_db"] / 10)
        d_stages = driver.get("combining_stages", 0)
        d_combining = COMBINING_BONUS_PER_STAGE ** d_stages
        d_max = driver["transistors"] * driver.get("watts_per_pill", 275) * d_combining
        drive_watts = min(drive_watts * driver_gain_raw, d_max)

    under_driven = False
    drive_ratio = 1.0
    ideal_drive = 0
    if final["gain_db"] > 0:
        f_gain = 10 ** (final["gain_db"] / 10)
        f_stages = final.get("combining_stages", 0)
        f_combining = COMBINING_BONUS_PER_STAGE ** f_stages
        f_capacity = final["transistors"] * final.get("watts_per_pill", 275) * f_combining
        ideal_drive = f_capacity / f_gain
        drive_ratio = drive_watts / ideal_drive if ideal_drive > 0 else 1.0
        under_driven = drive_ratio < 0.6

    return {
        "dead_key_watts": round(effective_dead, 1),
        "peak_watts": round(effective_peak, 1),
        "raw_dead_key": round(dead_key_power / bonding_factor if bonding_factor else 0, 1),
        "raw_peak": round(peak_power / bonding_factor if bonding_factor else 0, 1),
        "voltage": round(effective_voltage, 2),
        "voltage_drop": round(battery_voltage - effective_voltage, 3),
        "overloaded": overloaded,
        "current_draw": total_current,
        "swr": round(swr, 1),
        "takeoff_angle": takeoff_angle,
        "ground_plane_quality": round(gp_quality, 2),
        "directional_bias": vehicle["directional"],
        "under_driven": under_driven,
        "drive_ratio": round(drive_ratio, 2),
        "drive_watts": round(drive_watts),
        "ideal_drive": round(ideal_drive),
    }

# ──── Equipment Data Route ────

@api_router.get("/equipment")
async def get_equipment():
    equipment = {}
    for cat in ["radios", "driver_amps", "final_amps", "antennas", "vehicles"]:
        items = await db.equipment.find({"category": cat}, {"_id": 0}).to_list(100)
        equipment[cat] = {item["key"]: item["data"] for item in items}
    # Fallback to defaults if DB is empty
    if not equipment.get("radios"):
        return {"radios": RADIOS, "driver_amps": DRIVER_AMPS, "final_amps": FINAL_AMPS, "antennas": ANTENNAS, "vehicles": VEHICLES}
    return equipment

# ──── Admin Routes ────

@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    active_subs = await db.users.count_documents({"subscription_status": "active"})
    total_configs = await db.configurations.count_documents({})
    total_payments = await db.payment_transactions.count_documents({})
    return {
        "total_users": total_users,
        "active_subscriptions": active_subs,
        "total_configurations": total_configs,
        "total_payments": total_payments,
    }

@api_router.get("/admin/users")
async def admin_list_users(user: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return users

@api_router.patch("/admin/users/{user_id}")
async def admin_update_user(user_id: str, data: AdminUserUpdate, admin: dict = Depends(get_admin_user)):
    update = {}
    if data.role is not None:
        if data.role not in ("user", "subadmin", "admin"):
            raise HTTPException(status_code=400, detail="Invalid role")
        # Only admin can set admin role; subadmin can only set user/subadmin
        if data.role == "admin" and admin.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admin can assign admin role")
        update["role"] = data.role
    if data.subscription_status is not None:
        update["subscription_status"] = data.subscription_status
    if data.subscription_plan is not None:
        update["subscription_plan"] = data.subscription_plan
    if data.active is not None:
        update["active"] = data.active
    if data.subscription_status == "active" and data.subscription_plan:
        plans_data = await get_subscription_plans()
        plan = plans_data.get(data.subscription_plan, plans_data.get("monthly", DEFAULT_PLANS["monthly"]))
        update["subscription_end"] = (datetime.now(timezone.utc) + timedelta(days=plan["days"])).isoformat()
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.users.update_one({"id": user_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return updated

@api_router.get("/admin/configurations")
async def admin_list_configs(admin: dict = Depends(get_admin_user)):
    configs = await db.configurations.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return configs

@api_router.delete("/admin/configurations/{config_id}")
async def admin_delete_config(config_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.configurations.delete_one({"id": config_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return {"status": "deleted"}

@api_router.get("/admin/payments")
async def admin_list_payments(admin: dict = Depends(get_admin_user)):
    payments = await db.payment_transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return payments

@api_router.get("/admin/equipment")
async def admin_list_equipment(admin: dict = Depends(get_admin_user)):
    items = await db.equipment.find({}, {"_id": 0}).to_list(500)
    return items

@api_router.post("/admin/equipment")
async def admin_add_equipment(item: EquipmentItem, admin: dict = Depends(get_admin_user)):
    if item.category not in ("radios", "driver_amps", "final_amps", "antennas", "vehicles"):
        raise HTTPException(status_code=400, detail="Invalid category")
    existing = await db.equipment.find_one({"key": item.key, "category": item.category}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Equipment key already exists in this category")
    doc = {"key": item.key, "category": item.category, "data": item.data}
    await db.equipment.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.put("/admin/equipment/{category}/{key}")
async def admin_update_equipment(category: str, key: str, data: Dict, admin: dict = Depends(get_admin_user)):
    result = await db.equipment.update_one(
        {"key": key, "category": category},
        {"$set": {"data": data}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"status": "updated"}

@api_router.delete("/admin/equipment/{category}/{key}")
async def admin_delete_equipment(category: str, key: str, admin: dict = Depends(get_admin_user)):
    result = await db.equipment.delete_one({"key": key, "category": category})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return {"status": "deleted"}

# ──── Admin Pricing Routes ────

class PricingUpdate(BaseModel):
    monthly_amount: float
    yearly_amount: float

@api_router.get("/pricing")
async def get_pricing():
    plans = await get_subscription_plans()
    return {
        "monthly": {"amount": plans["monthly"]["amount"], "currency": plans["monthly"]["currency"]},
        "yearly": {"amount": plans["yearly"]["amount"], "currency": plans["yearly"]["currency"]},
    }

@api_router.get("/admin/pricing")
async def admin_get_pricing(admin: dict = Depends(get_admin_user)):
    return await get_subscription_plans()

@api_router.put("/admin/pricing")
async def admin_update_pricing(data: PricingUpdate, admin: dict = Depends(get_admin_user)):
    plans = await get_subscription_plans()
    plans["monthly"]["amount"] = data.monthly_amount
    plans["yearly"]["amount"] = data.yearly_amount
    await db.settings.update_one(
        {"key": "subscription_plans"},
        {"$set": {"key": "subscription_plans", "data": plans}},
        upsert=True
    )
    return plans

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

# ──── Startup: Seed Admin + Equipment ────

DEFAULT_EQUIPMENT = {
    "radios": RADIOS,
    "driver_amps": DRIVER_AMPS,
    "final_amps": FINAL_AMPS,
    "antennas": ANTENNAS,
    "vehicles": VEHICLES,
}

@app.on_event("startup")
async def seed_data():
    # Seed admin account
    admin_email = "fallstommy@gmail.com"
    existing = await db.users.find_one({"email": admin_email}, {"_id": 0})
    if not existing:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password("admin123"),
            "role": "admin",
            "active": True,
            "subscription_status": "active",
            "subscription_plan": "yearly",
            "subscription_end": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(admin_doc)
        logger.info("Admin account seeded: %s", admin_email)
    else:
        # Ensure existing admin has role set
        if existing.get("role") != "admin":
            await db.users.update_one({"email": admin_email}, {"$set": {"role": "admin", "active": True}})

    # Sync equipment — upsert all default items and update specs to stay in sync
    synced = 0
    for category, items in DEFAULT_EQUIPMENT.items():
        for key, data in items.items():
            result = await db.equipment.update_one(
                {"key": key, "category": category},
                {"$set": {"key": key, "category": category, "data": data}},
                upsert=True,
            )
            if result.upserted_id or result.modified_count:
                synced += 1
    if synced:
        logger.info("Synced %d equipment items into DB", synced)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
