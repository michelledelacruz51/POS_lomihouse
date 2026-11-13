from flask import Flask, jsonify, request, send_from_directory
from dotenv import load_dotenv
import requests
import os
import re

load_dotenv()

app = Flask(__name__, static_folder=".", static_url_path="")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()


def load_supabase_config():
    global SUPABASE_URL, SUPABASE_ANON_KEY

    if SUPABASE_URL and SUPABASE_ANON_KEY:
        return

    config_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "supabase-config.js"
    )

    if not os.path.exists(config_path):
        return

    try:
        content = open(config_path, "r", encoding="utf-8").read()

        url_match = re.search(
            r'url\s*:\s*["\']([^"\']+)["\']',
            content
        )
        key_match = re.search(
            r'anonKey\s*:\s*["\']([^"\']+)["\']',
            content
        )

        if url_match and not SUPABASE_URL:
            SUPABASE_URL = url_match.group(1)

        if key_match and not SUPABASE_ANON_KEY:
            SUPABASE_ANON_KEY = key_match.group(1)

    except OSError:
        pass


load_supabase_config()


def get_access_token():
    authorization = request.headers.get("Authorization", "")

    if not authorization.startswith("Bearer "):
        return None

    return authorization[7:].strip()


def supabase_headers(token):
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def supabase_request(
    method,
    path,
    token,
    params=None,
    json_data=None,
    headers=None,
):
    url = f"{SUPABASE_URL}/rest/v1/{path}"

    request_headers = supabase_headers(token)

    if headers:
        request_headers.update(headers)

    return requests.request(
        method=method,
        url=url,
        headers=request_headers,
        params=params,
        json=json_data,
        timeout=15,
    )


def authenticate():
    token = get_access_token()

    if not token or not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None, None

    try:
        response = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
            timeout=15,
        )

        if not response.ok:
            return None, None

        user = response.json()
        user_id = user.get("id")

        if not user_id:
            return None, None

        return user_id, token

    except requests.RequestException:
        return None, None


def require_auth():
    user_id, token = authenticate()

    if not user_id or not token:
        return None, None, (
            jsonify({"detail": "Authentication required."}),
            401,
        )

    return user_id, token, None


def supabase_error(response):
    try:
        body = response.json()
    except ValueError:
        body = {}

    if isinstance(body, dict):
        message = (
            body.get("message")
            or body.get("error_description")
            or body.get("detail")
            or response.text
            or response.reason
        )
        error = {
            "detail": str(message),
        }

        for field in ("code", "details", "hint"):
            if body.get(field):
                error[field] = body[field]
    else:
        error = {
            "detail": str(body)
            if body
            else response.text or response.reason,
        }

    return jsonify(error), response.status_code


# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "backend": "Flask",
        "database": "Supabase",
    })


# =========================================================
# FRONTEND
# =========================================================

@app.get("/")
def home():
    return send_from_directory(
        os.path.dirname(os.path.abspath(__file__)),
        "index.html",
    )


@app.get("/<path:filename>")
def serve_frontend(filename):
    base_directory = os.path.dirname(
        os.path.abspath(__file__)
    )

    file_path = os.path.join(base_directory, filename)

    if os.path.isfile(file_path):
        return send_from_directory(
            base_directory,
            filename,
        )

    return jsonify({"detail": "File not found."}), 404


# =========================================================
# PRODUCTS
# =========================================================

@app.get("/api/products")
def get_products():
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "GET",
        "products",
        token,
        params={
            "select": "id,name,category,price,recipe",
            "user_id": f"eq.{user_id}",
            "order": "id.asc",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


@app.post("/api/products")
def create_product():
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    product = {
        "user_id": user_id,
        "name": data.get("name"),
        "category": data.get("category"),
        "price": data.get("price", 0),
        "recipe": data.get("recipe", {}),
    }

    response = supabase_request(
        "POST",
        "products",
        token,
        json_data=product,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json()), 201


@app.put("/api/products/<int:product_id>")
def update_product(product_id):
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    allowed_fields = [
        "name",
        "category",
        "price",
        "recipe",
    ]

    update_data = {
        key: data[key]
        for key in allowed_fields
        if key in data
    }

    if not update_data:
        return jsonify({
            "detail": "No product fields to update."
        }), 400

    response = supabase_request(
        "PATCH",
        "products",
        token,
        params={
            "id": f"eq.{product_id}",
            "user_id": f"eq.{user_id}",
        },
        json_data=update_data,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


@app.delete("/api/products/<int:product_id>")
def delete_product(product_id):
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "DELETE",
        "products",
        token,
        params={
            "id": f"eq.{product_id}",
            "user_id": f"eq.{user_id}",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify({"success": True})


# =========================================================
# INVENTORY
# =========================================================

@app.get("/api/inventory")
def get_inventory():
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "GET",
        "inventory",
        token,
        params={
            "select": "id,item_name,stock",
            "user_id": f"eq.{user_id}",
            "order": "id.asc",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


@app.post("/api/inventory")
def create_inventory():
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    item_name = str(data.get("item_name") or data.get("name") or "").strip()

    if not item_name:
        return jsonify({
            "detail": "Inventory item name is required."
        }), 400

    inventory = {
        "user_id": user_id,
        "item_name": item_name,
        "stock": data.get("stock", 0),
    }

    response = supabase_request(
        "POST",
        "inventory",
        token,
        json_data=inventory,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json()), 201


@app.put("/api/inventory/<int:inventory_id>")
def update_inventory(inventory_id):
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    allowed_fields = [
        "item_name",
        "stock",
    ]

    update_data = {
        key: data[key]
        for key in allowed_fields
        if key in data
    }

    if not update_data:
        return jsonify({
            "detail": "No inventory fields to update."
        }), 400

    response = supabase_request(
        "PATCH",
        "inventory",
        token,
        params={
            "id": f"eq.{inventory_id}",
            "user_id": f"eq.{user_id}",
        },
        json_data=update_data,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


# =========================================================
# ORDERS
# =========================================================

@app.get("/api/orders")
def get_orders():
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "GET",
        "orders",
        token,
        params={
            "select": "id,order_number,order_type,status,total,delivery_fee,table_number,delivery_channel,delivery_order_number,payment_method,inventory_deducted",
            "user_id": f"eq.{user_id}",
            "order": "id.desc",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


@app.post("/api/orders")
def create_order():
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    order = {
        "user_id": user_id,
        "order_number": str(data.get("order_number", "")),
        "order_type": data.get("order_type", "Dine-In"),
        "table_number": data.get("table_number", data.get("table")),
        "delivery_fee": (
            data.get("delivery_fee", 0)
            if "delivery" in str(data.get("order_type", "")).lower()
            else None
        ),
        "total": data.get("total", 0),
        "status": data.get("status", "New"),
        "payment_method": data.get("payment_method"),
        "delivery_channel": data.get("delivery_channel"),
        "delivery_order_number": data.get("delivery_order_number"),
        "inventory_deducted": False,
    }

    order = {
        key: value
        for key, value in order.items()
        if value is not None
    }

    response = supabase_request(
        "POST",
        "orders",
        token,
        json_data=order,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json()), 201


@app.put("/api/orders/<int:order_id>")
def update_order(order_id):
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    allowed_fields = [
        "order_number",
        "order_type",
        "table_number",
        "delivery_fee",
        "total",
        "status",
        "payment_method",
        "delivery_channel",
        "delivery_order_number",
    ]

    update_data = {
        key: data[key]
        for key in allowed_fields
        if key in data
    }

    if "delivery_fee" in update_data and "delivery" not in str(
        data.get("order_type", "")
    ).lower():
        update_data["delivery_fee"] = None

    if not update_data:
        return jsonify({
            "detail": "No order fields to update."
        }), 400

    response = supabase_request(
        "PATCH",
        "orders",
        token,
        params={
            "id": f"eq.{order_id}",
            "user_id": f"eq.{user_id}",
        },
        json_data=update_data,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


# =========================================================
# ORDER ITEMS
# =========================================================

@app.get("/api/orders/<int:order_id>/items")
def get_order_items(order_id):
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "GET",
        "order_items",
        token,
        params={
            "select": "id,product_name,category,price,quantity,total",
            "order_id": f"eq.{order_id}",
            "user_id": f"eq.{user_id}",
            "order": "id.asc",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


@app.post("/api/orders/<int:order_id>/items")
def add_order_item(order_id):
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    item = {
        "user_id": user_id,
        "order_id": order_id,
        "product_name": data.get("product_name"),
        "category": data.get("category") or "Other",
        "quantity": data.get("quantity", 1),
        "price": data.get("price", data.get("unit_price", 0)),
        "total": data.get(
            "total",
            data.get("price", data.get("unit_price", 0))
            * data.get("quantity", 1),
        ),
    }

    response = supabase_request(
        "POST",
        "order_items",
        token,
        json_data=item,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json()), 201


@app.delete("/api/orders/<int:order_id>/items")
def delete_order_items(order_id):
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "DELETE",
        "order_items",
        token,
        params={
            "order_id": f"eq.{order_id}",
            "user_id": f"eq.{user_id}",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify({"success": True})


# =========================================================
# PAYMENTS
# =========================================================

@app.get("/api/orders/<int:order_id>/payments")
def get_payments(order_id):
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "GET",
        "payments",
        token,
        params={
            "select": "id,payment_method,amount,status,paid_at",
            "order_id": f"eq.{order_id}",
            "user_id": f"eq.{user_id}",
            "order": "id.asc",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


@app.post("/api/orders/<int:order_id>/payments")
def create_payment(order_id):
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    payment = {
        "user_id": user_id,
        "order_id": order_id,
        "payment_method": data.get(
            "payment_method",
            "Cash",
        ),
        "amount": data.get("amount", 0),
        "status": data.get("status", "Paid"),
        "paid_at": data.get("paid_at"),
    }

    payment = {
        key: value
        for key, value in payment.items()
        if value is not None
    }

    response = supabase_request(
        "POST",
        "payments",
        token,
        json_data=payment,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json()), 201


# =========================================================
# KITCHEN
# =========================================================

@app.get("/api/kitchen")
def get_kitchen():
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "GET",
        "kitchen_orders",
        token,
        params={
            "select": "id,order_id,status,started_at,ready_at,completed_at",
            "user_id": f"eq.{user_id}",
            "order": "id.desc",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


@app.post("/api/kitchen")
def create_kitchen():
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    kitchen_order = {
        "user_id": user_id,
        "order_id": data.get("order_id"),
        "status": data.get("status", "New"),
    }

    response = supabase_request(
        "POST",
        "kitchen_orders",
        token,
        json_data=kitchen_order,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json()), 201


@app.put("/api/kitchen/<int:kitchen_id>")
def update_kitchen(kitchen_id):
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    update_data = {}

    if "order_id" in data:
        update_data["order_id"] = data["order_id"]

    if "status" in data:
        update_data["status"] = data["status"]

    if not update_data:
        return jsonify({
            "detail": "No kitchen fields to update."
        }), 400

    response = supabase_request(
        "PATCH",
        "kitchen_orders",
        token,
        params={
            "id": f"eq.{kitchen_id}",
            "user_id": f"eq.{user_id}",
        },
        json_data=update_data,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


# =========================================================
# INVENTORY DEDUCTION
# =========================================================

@app.post("/api/orders/<int:order_id>/deduct-inventory")
def deduct_order_inventory(order_id):
    user_id, token, error = require_auth()

    if error:
        return error

    # Get the order.
    order_response = supabase_request(
        "GET",
        "orders",
        token,
        params={
            "select": "id,inventory_deducted,status",
            "id": f"eq.{order_id}",
            "user_id": f"eq.{user_id}",
        },
    )

    if not order_response.ok:
        return supabase_error(order_response)

    orders = order_response.json()

    if not orders:
        return jsonify({
            "detail": "Order not found."
        }), 404

    order = orders[0]

    if order.get("status") not in {"Preparing", "Completed", "Delivered"}:
        return jsonify({
            "detail": (
                "Inventory can only be deducted when an order is accepted "
                "(Preparing) or completed."
            ),
            "order_status": order.get("status"),
        }), 409

    # Never deduct the same order twice.
    if order.get("inventory_deducted") is True:
        return jsonify({
            "success": True,
            "already_deducted": True,
            "order_id": order_id,
        })

    # Get order items.
    items_response = supabase_request(
        "GET",
        "order_items",
        token,
        params={
            "select": "id,product_name,quantity",
            "order_id": f"eq.{order_id}",
            "user_id": f"eq.{user_id}",
            "order": "id.asc",
        },
    )

    if not items_response.ok:
        return supabase_error(items_response)

    order_items = items_response.json()

    if not order_items:
        return jsonify({
            "detail": "This order has no order items."
        }), 400

    # Get products so recipes can be resolved.
    products_response = supabase_request(
        "GET",
        "products",
        token,
        params={
            "select": "id,name,recipe",
            "user_id": f"eq.{user_id}",
        },
    )

    if not products_response.ok:
        return supabase_error(products_response)

    products = products_response.json()

    product_by_name = {
        str(product.get("name", "")).strip().lower(): product
        for product in products
    }

    # Get inventory.
    inventory_response = supabase_request(
        "GET",
        "inventory",
        token,
        params={
            "select": "id,item_name,stock",
            "user_id": f"eq.{user_id}",
        },
    )

    if not inventory_response.ok:
        return supabase_error(inventory_response)

    inventory = inventory_response.json()

    inventory_by_key = {
        re.sub(
            r"[^a-z0-9]+",
            "_",
            str(item.get("item_name", "")).strip().lower(),
        ).strip("_"): item
        for item in inventory
    }

    required = {}
    products_without_recipe = []

    for item in order_items:
        quantity = float(item.get("quantity") or 0)

        product = product_by_name.get(
            str(item.get("product_name", "")).strip().lower()
        )

        if product is None:
            return jsonify({
                "detail": (
                    f"Product '{item.get('product_name', 'Unknown')}' "
                    "was not found in Products."
                )
            }), 400

        recipe = product.get("recipe") or {}

        if not isinstance(recipe, dict) or not recipe:
            products_without_recipe.append(
                product.get("name", item.get("product_name", "Unknown"))
            )
            continue

        for item_key, amount in recipe.items():
            try:
                amount_per_unit = float(amount)
            except (TypeError, ValueError):
                return jsonify({
                    "detail": (
                        f"Invalid recipe quantity for "
                        f"'{item_key}' in '{product.get('name')}'."
                    )
                }), 400

            if amount_per_unit < 0:
                return jsonify({
                    "detail": (
                        f"Recipe quantity for '{item_key}' "
                        "cannot be negative."
                    )
                }), 400

            normalized_key = re.sub(
                r"[^a-z0-9]+",
                "_",
                str(item_key).strip().lower(),
            ).strip("_")

            required[normalized_key] = (
                required.get(normalized_key, 0)
                + amount_per_unit * quantity
            )

    if products_without_recipe:
        return jsonify({
            "detail": (
                "Inventory deduction cannot continue because these "
                "products do not have recipes yet: "
                + ", ".join(products_without_recipe)
            )
        }), 422

    # Validate EVERY ingredient before changing ANY stock.
    shortages = []

    for item_key, required_amount in required.items():
        inventory_item = inventory_by_key.get(item_key)

        if inventory_item is None:
            shortages.append({
                "item_key": item_key,
                "required": required_amount,
                "available": 0,
                "reason": "Inventory item not found",
            })
            continue

        available = float(inventory_item.get("stock") or 0)

        if available < required_amount:
            shortages.append({
                "item_key": item_key,
                "required": required_amount,
                "available": available,
                "reason": "Insufficient stock",
            })

    if shortages:
        return jsonify({
            "detail": "Insufficient inventory.",
            "shortages": shortages,
        }), 409

    # Deduct the calculated quantities.
    deducted_items = []

    for item_key, required_amount in required.items():
        inventory_item = inventory_by_key[item_key]

        current_stock = float(
            inventory_item.get("stock") or 0
        )
        new_stock = current_stock - required_amount

        update_response = supabase_request(
            "PATCH",
            "inventory",
            token,
            params={
                "id": f"eq.{inventory_item['id']}",
                "user_id": f"eq.{user_id}",
            },
            json_data={
                "stock": new_stock
            },
            headers={
                "Prefer": "return=representation"
            },
        )

        if not update_response.ok:
            return supabase_error(update_response)

        deducted_items.append({
            "item_key": item_key,
            "item_name": inventory_item.get("item_name"),
            "deducted": required_amount,
            "remaining": new_stock,
        })

    # Mark the order as already deducted.
    order_update = supabase_request(
        "PATCH",
        "orders",
        token,
        params={
            "id": f"eq.{order_id}",
            "user_id": f"eq.{user_id}",
        },
        json_data={
            "inventory_deducted": True
        },
        headers={
            "Prefer": "return=representation"
        },
    )

    if not order_update.ok:
        return supabase_error(order_update)

    return jsonify({
        "success": True,
        "already_deducted": False,
        "order_id": order_id,
        "inventory": deducted_items,
    })


# =========================================================
# STAFF
# =========================================================

@app.get("/api/staff")
def get_staff():
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "GET",
        "staff",
        token,
        params={
            "select": "id,name,role,email",
            "user_id": f"eq.{user_id}",
            "order": "id.asc",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


@app.post("/api/staff")
def create_staff():
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}

    staff = {
        "user_id": user_id,
        "name": data.get("name"),
        "role": data.get("role"),
        "email": data.get("email"),
    }

    response = supabase_request(
        "POST",
        "staff",
        token,
        json_data=staff,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json()), 201


@app.put("/api/staff/<int:staff_id>")
def update_staff(staff_id):
    user_id, token, error = require_auth()

    if error:
        return error

    data = request.get_json(silent=True) or {}
    update_data = {
        key: data[key]
        for key in ("name", "role", "email")
        if key in data
    }

    if not update_data:
        return jsonify({"detail": "No staff fields to update."}), 400

    response = supabase_request(
        "PATCH",
        "staff",
        token,
        params={
            "id": f"eq.{staff_id}",
            "user_id": f"eq.{user_id}",
        },
        json_data=update_data,
        headers={"Prefer": "return=representation"},
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify(response.json())


@app.delete("/api/staff/<int:staff_id>")
def delete_staff(staff_id):
    user_id, token, error = require_auth()

    if error:
        return error

    response = supabase_request(
        "DELETE",
        "staff",
        token,
        params={
            "id": f"eq.{staff_id}",
            "user_id": f"eq.{user_id}",
        },
    )

    if not response.ok:
        return supabase_error(response)

    return jsonify({"success": True})


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True,
    )
