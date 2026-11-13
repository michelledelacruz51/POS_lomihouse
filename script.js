/* ================= DATE ================= */

const dateElement = document.getElementById("currentDate");

const today = new Date();

dateElement.textContent = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
});


/* ================= PAGE NAVIGATION ================= */

function showPage(pageId, clickedButton = null) {

    // Hide all pages
    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
        page.classList.remove("active-page");
    });

    // Show selected page
    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }

    // Remove active from sidebar
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        item.classList.remove("active");
    });

    // Add active to clicked button
    if (clickedButton) {
        clickedButton.classList.add("active");
    }

    // Page titles
    const titles = {
        dashboard: [
            "Dashboard",
            "Welcome back! Here's today's overview."
        ],

        pos: [
            "POS / New Order",
            "Create a new customer order."
        ],

        orders: [
            "Order Management",
            "Manage and monitor restaurant orders."
        ],

        kitchen: [
            "Kitchen Display",
            "Manage orders being prepared in the kitchen."
        ],

        inventory: [
            "Inventory",
            "Monitor ingredients and stock levels."
        ],

        products: [
            "Products",
            "Manage your restaurant menu."
        ],

        reports: [
            "Sales & Reports",
            "View restaurant sales and performance."
        ],

        settings: [
            "POS Settings",
            "Configure your restaurant operations and preferences."
        ]
    };

    if (titles[pageId]) {

        document.getElementById("pageTitle").textContent =
            titles[pageId][0];

        document.getElementById("pageSubtitle").textContent =
            titles[pageId][1];
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* ================= POS ORDER ================= */

let cart = [];
const savedOrderNumber = Number.parseInt(readStoredData("foodHubNextOrderNumber"), 10);

let nextOrderNumber = Number.isInteger(savedOrderNumber) && savedOrderNumber >= 1029 ? savedOrderNumber : 1029;
let selectedPaymentMethod = "Cash";
let selectedDeliveryChannel = "Grab";
const pendingKitchenOrders = {};
const productAvailability = {};
const removedProductNames = new Set(["chicken rice", "classic burger", "allen", "french fries", "iced tea", "spaghetti", "chicken wings"]);
const defaultProductImages = {
    "Lomi": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=85",
    "Canton Bihon": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=85",
    "Sizzling With Rice": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=85",
    "Silog": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=85",
    "Guisado": "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=700&q=85",
    "Pulutan": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=85",
    "Chami": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=85",
    "Add Ons": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=85",
    "Drinks": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=700&q=85"
};
const defaultProducts = [
    { name: "Lomi Regular", price: 75, category: "Lomi", description: "Classic lomi noodles" },
    { name: "Lomi Special", price: 90, category: "Lomi", description: "Special lomi noodles" },
    { name: "Lomi Jumbo", price: 100, category: "Lomi", description: "Jumbo serving of lomi" },
    { name: "Lomi Overload", price: 130, category: "Lomi", description: "Loaded lomi noodles" },
    { name: "Canton Bihon Regular", price: 85, category: "Canton Bihon", description: "Classic canton bihon" },
    { name: "Canton Bihon with Chicken", price: 135, category: "Canton Bihon", description: "Canton bihon with chicken" },
    { name: "Canton Bihon with Liempo", price: 135, category: "Canton Bihon", description: "Canton bihon with liempo" },
    { name: "Canton Bihon with Lechon Kawali", price: 145, category: "Canton Bihon", description: "Canton bihon with lechon kawali" },
    { name: "Sizzling Sausage", price: 0, category: "Sizzling With Rice", description: "Sizzling sausage with rice" },
    { name: "Sizzling Liempo", price: 0, category: "Sizzling With Rice", description: "Sizzling liempo with rice" },
    { name: "Sizzling Chicken", price: 0, category: "Sizzling With Rice", description: "Sizzling chicken with rice" },
    { name: "Sizzling Lechon Kawali", price: 0, category: "Sizzling With Rice", description: "Sizzling lechon kawali with rice" },
    { name: "Sizzling Sisig with Egg", price: 0, category: "Sizzling With Rice", description: "Sizzling sisig with egg and rice" },
    { name: "Hotdog Silog", price: 80, category: "Silog", description: "Hotdog with garlic rice and egg" },
    { name: "Tocilog", price: 80, category: "Silog", description: "Tocino with garlic rice and egg" },
    { name: "Longsilog", price: 80, category: "Silog", description: "Longganisa with garlic rice and egg" },
    { name: "Sausage Silog", price: 100, category: "Silog", description: "Sausage with garlic rice and egg" },
    { name: "Bangsilog", price: 100, category: "Silog", description: "Bangus with garlic rice and egg" },
    { name: "Tapsilog", price: 0, category: "Silog", description: "Beef tapa with garlic rice and egg" },
    { name: "Chicksilog", price: 0, category: "Silog", description: "Chicken with garlic rice and egg" },
    { name: "Liempo Silog", price: 0, category: "Silog", description: "Liempo with garlic rice and egg" },
    { name: "Porkchop Silog", price: 0, category: "Silog", description: "Porkchop with garlic rice and egg" },
    { name: "Guisado Regular", price: 0, category: "Guisado", description: "Classic guisado" },
    { name: "Guisado with Chicken", price: 0, category: "Guisado", description: "Guisado with chicken" },
    { name: "Guisado with Liempo", price: 0, category: "Guisado", description: "Guisado with liempo" },
    { name: "Guisado with Lechon Kawali", price: 0, category: "Guisado", description: "Guisado with lechon kawali" },
    { name: "Chicharon Regular", price: 0, category: "Pulutan", description: "Crispy chicharon" },
    { name: "Sizzling Hotdog", price: 0, category: "Pulutan", description: "Sizzling hotdog" },
    { name: "Sizzling Sisig", price: 0, category: "Pulutan", description: "Sizzling sisig" },
    { name: "Sizzling Lechon Kawali (Pulutan)", price: 0, category: "Pulutan", description: "Sizzling lechon kawali" },
    { name: "Chami Tamis Anghang", price: 0, category: "Chami", description: "Sweet and spicy chami" },
    { name: "Chami with Chicken", price: 0, category: "Chami", description: "Chami with chicken" },
    { name: "Chami with Liempo", price: 0, category: "Chami", description: "Chami with liempo" },
    { name: "Chami with Lechon Kawali", price: 0, category: "Chami", description: "Chami with lechon kawali" },
    { name: "Fried Rice", price: 0, category: "Add Ons", description: "Flavorful fried rice" },
    { name: "Plain Rice", price: 0, category: "Add Ons", description: "Steamed plain rice" },
    { name: "Egg", price: 0, category: "Add Ons", description: "Fresh egg" },
    { name: "Double Toppings", price: 0, category: "Add Ons", description: "Double serving of toppings" },
    { name: "Coke Mismo", price: 0, category: "Drinks", description: "Coke mismo" },
    { name: "Sprite", price: 0, category: "Drinks", description: "Refreshing Sprite" },
    { name: "Mountain Dew", price: 0, category: "Drinks", description: "Refreshing Mountain Dew" },
    { name: "Royal", price: 0, category: "Drinks", description: "Refreshing Royal" },
    { name: "Bottled Water", price: 0, category: "Drinks", description: "Chilled bottled water" },
    { name: "Coke Kasalo", price: 0, category: "Drinks", description: "Coke Kasalo" }
];
const productImages = {
    "Lomi Regular": "image/regular.png",
    "Lomi Special": "image/special.png",
    "Lomi Jumbo": "image/jumbo.png",
    "Lomi Overload": "image/overload.png",
    "Canton Bihon Regular": "PASTE_IMAGE_URL_HERE",
    "Canton Bihon with Chicken": "PASTE_IMAGE_URL_HERE",
    "Canton Bihon with Liempo": "PASTE_IMAGE_URL_HERE",
    "Canton Bihon with Lechon Kawali": "PASTE_IMAGE_URL_HERE",
    "Sizzling Sausage": "PASTE_IMAGE_URL_HERE",
    "Sizzling Liempo": "PASTE_IMAGE_URL_HERE",
    "Sizzling Chicken": "PASTE_IMAGE_URL_HERE",
    "Sizzling Lechon Kawali": "PASTE_IMAGE_URL_HERE",
    "Sizzling Sisig with Egg": "PASTE_IMAGE_URL_HERE",
    "Hotdog Silog": "image/hotdog.png",
    "Tocilog": "image/tocilog.png",
    "Longsilog": "image/longsilog.png",
    "Sausage Silog": "image/sausage.png",
    "Bangsilog": "image/bangsilog.png",
    "Tapsilog": "image/tapsilog.png",
    "Chicksilog": "image/chicken.png",
    "Liempo Silog": "image/liempo.png",
    "Porkchop Silog": "image/porksilog.png",
    "Guisado Regular": "PASTE_IMAGE_URL_HERE",
    "Guisado with Chicken": "PASTE_IMAGE_URL_HERE",
    "Guisado with Liempo": "PASTE_IMAGE_URL_HERE",
    "Guisado with Lechon Kawali": "PASTE_IMAGE_URL_HERE",
    "Chicharon Regular": "PASTE_IMAGE_URL_HERE",
    "Sizzling Hotdog": "PASTE_IMAGE_URL_HERE",
    "Sizzling Sisig": "PASTE_IMAGE_URL_HERE",
    "Sizzling Lechon Kawali (Pulutan)": "PASTE_IMAGE_URL_HERE",
    "Chami Tamis Anghang": "image/tamisanghang.png",
    "Chami with Chicken": "PASTE_IMAGE_URL_HERE",
    "Chami with Liempo": "PASTE_IMAGE_URL_HERE",
    "Chami with Lechon Kawali": "PASTE_IMAGE_URL_HERE",
    "Fried Rice": "image/friedrice.png",
    "Plain Rice": "image/rice.png",
    "Egg": "image/egg.png",
    "Double Toppings": "PASTE_IMAGE_URL_HERE",
    "Coke Mismo": "image/coke.jpg",
    "Sprite": "image/sprite.webp",
    "Mountain Dew": "image/mountaindew.webp",
    "Royal": "PASTE_IMAGE_URL_HERE",
    "Bottled Water": "image/water.webp",
    "Coke Kasalo": "PASTE_IMAGE_URL_HERE"
};
const defaultInventoryIngredients = [
    { name: "Lomi Noodles", category: "Noodles", stock: 45, unit: "kg", reorderLevel: 15 },
    { name: "Canton Noodles", category: "Noodles", stock: 35, unit: "kg", reorderLevel: 12 },
    { name: "Bihon Noodles", category: "Noodles", stock: 30, unit: "kg", reorderLevel: 10 },
    { name: "Rice", category: "Grains", stock: 180, unit: "kg", reorderLevel: 60 },
    { name: "Chicken", category: "Meat", stock: 90, unit: "kg", reorderLevel: 30 },
    { name: "Liempo", category: "Meat", stock: 75, unit: "kg", reorderLevel: 25 },
    { name: "Lechon Kawali", category: "Meat", stock: 65, unit: "kg", reorderLevel: 22 },
    { name: "Porkchop", category: "Meat", stock: 45, unit: "kg", reorderLevel: 15 },
    { name: "Beef Tapa", category: "Meat", stock: 35, unit: "kg", reorderLevel: 12 },
    { name: "Sausage", category: "Meat", stock: 900, unit: "pieces", reorderLevel: 300 },
    { name: "Hotdog", category: "Meat", stock: 900, unit: "pieces", reorderLevel: 300 },
    { name: "Longganisa", category: "Meat", stock: 600, unit: "pieces", reorderLevel: 200 },
    { name: "Tocino", category: "Meat", stock: 35, unit: "kg", reorderLevel: 12 },
    { name: "Bangus", category: "Seafood", stock: 35, unit: "kg", reorderLevel: 12 },
    { name: "Sisig", category: "Meat", stock: 35, unit: "kg", reorderLevel: 12 },
    { name: "Chicharon", category: "Pulutan", stock: 25, unit: "kg", reorderLevel: 8 },
    { name: "Eggs", category: "Dairy", stock: 1500, unit: "pieces", reorderLevel: 500 },
    { name: "Cooking Oil", category: "Supplies", stock: 60, unit: "liter", reorderLevel: 20 },
    { name: "Garlic", category: "Seasonings", stock: 20, unit: "kg", reorderLevel: 7 },
    { name: "Onion", category: "Seasonings", stock: 25, unit: "kg", reorderLevel: 8 },
    { name: "Soy Sauce", category: "Sauces", stock: 30, unit: "liter", reorderLevel: 10 },
    { name: "Oyster Sauce", category: "Sauces", stock: 25, unit: "liter", reorderLevel: 8 },
    { name: "Vinegar", category: "Sauces", stock: 25, unit: "liter", reorderLevel: 8 },
    { name: "Seasoning", category: "Seasonings", stock: 15, unit: "kg", reorderLevel: 5 },
    { name: "Chili", category: "Seasonings", stock: 10, unit: "kg", reorderLevel: 3 },
    { name: "Coke Mismo", category: "Drinks", stock: 900, unit: "bottles", reorderLevel: 300 },
    { name: "Sprite", category: "Drinks", stock: 600, unit: "bottles", reorderLevel: 200 },
    { name: "Mountain Dew", category: "Drinks", stock: 600, unit: "bottles", reorderLevel: 200 },
    { name: "Royal", category: "Drinks", stock: 600, unit: "bottles", reorderLevel: 200 },
    { name: "Bottled Water", category: "Drinks", stock: 900, unit: "bottles", reorderLevel: 300 },
    { name: "Coke Kasalo", category: "Drinks", stock: 300, unit: "bottles", reorderLevel: 100 }
];
let editingProductCard = null;
let editingProductImage = "";
let editingProductImagePromise = Promise.resolve("");
let editingInventoryRow = null;

function getDefaultProductImage(category) {
    return defaultProductImages[category] || defaultProductImages[category.replace(/\b\w/g, character => character.toUpperCase())] || "";
}

function attachProductImageFallback(card, category) {
    const image = card.querySelector(".food-picture img");

    if (!image) {
        return;
    }

    image.addEventListener("error", () => {
        const fallback = getDefaultProductImage(category);

        if (fallback && image.src !== fallback) {
            image.src = fallback;
        }
    });
}

function saveNextOrderNumber() {
    writeStoredData("foodHubNextOrderNumber", nextOrderNumber);
}

function readStoredData(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        return null;
    }
}

function writeStoredData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        console.error(`Unable to cache ${key} in this browser.`);
    }
}

function updateRestaurantLogo(imageData) {
    document.querySelectorAll(".logo-image").forEach(image => {
        image.src = imageData;
        image.closest(".logo-icon, .logo-upload-preview, .auth-logo").classList.add("has-image");
    });
}

function restoreRestaurantLogo() {
    const status = document.getElementById("logoUploadStatus");

    try {
        const savedLogo = readStoredData("foodHubRestaurantLogo");

        if (savedLogo) {
            updateRestaurantLogo(savedLogo);
        } else {
            document.querySelectorAll(".logo-image").forEach(image => {
                image.removeAttribute("src");
                image.closest(".logo-icon, .logo-upload-preview, .auth-logo")?.classList.remove("has-image");
            });
        }
        status.textContent = "";
    } catch {
        status.textContent = "Unable to load the saved logo from this browser.";
    }
}

const restaurantLogoInput = document.getElementById("restaurantLogoInput");
restaurantLogoInput.addEventListener("change", function () {
    const file = this.files[0];
    const status = document.getElementById("logoUploadStatus");

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        status.textContent = "Choose an image file to use as the logo.";
        this.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = event => {
        if (typeof event.target.result !== "string") {
            status.textContent = "The selected logo could not be read.";
            return;
        }

        writeStoredData("foodHubRestaurantLogo", event.target.result);

        updateRestaurantLogo(event.target.result);
        status.textContent = "Logo saved.";
    };
    reader.onerror = () => {
        status.textContent = "The selected logo could not be read.";
    };
    reader.readAsDataURL(file);
});

restoreRestaurantLogo();

function getStaffData() {
    return readStoredData("foodHubStaff") || [];
}

function getActiveAccount() {
    return readStoredData("foodHubActiveAccount") || { name: "Jane Doe", role: "Administrator", initials: "JD" };
}

function updateVisibleAccount() {
    const account = getActiveAccount();
    const profiles = document.querySelectorAll(".profile-button, .user-mini");

    profiles.forEach(profile => {
        const name = profile.querySelector("strong");
        const role = profile.querySelector("small");
        const avatar = profile.querySelector(".avatar");

        if (name) name.textContent = account.name;
        if (role) role.textContent = account.role;
        if (avatar) avatar.textContent = account.initials || account.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
    });
}

function openAccountSwitcher() {
    const accountOptions = document.getElementById("accountOptions");
    const activeAccount = getActiveAccount();
    const accounts = [
        { name: "Jane Doe", role: "Administrator", initials: "JD", active: true },
        ...getStaffData().filter(member => member.active)
    ];

    accountOptions.innerHTML = accounts.map(account => {
        const initials = account.initials || account.name.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
        const selected = account.name === activeAccount.name && account.role === activeAccount.role;

        return `
            <button class="account-option${selected ? " active" : ""}" type="button" onclick='switchAccount(${JSON.stringify({ name: account.name, role: account.role, initials })})'>
                <span class="avatar">${initials}</span>
                <span><strong>${account.name}</strong><small>${account.role}</small></span>
                ${selected ? '<i class="fa-solid fa-check"></i>' : ''}
            </button>
        `;
    }).join("");

    const modal = document.getElementById("accountSwitcherModal");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function closeAccountSwitcher() {
    document.getElementById("accountSwitcherModal")?.classList.add("hidden");
}

function switchAccount(account) {
    writeStoredData("foodHubActiveAccount", account);
    updateVisibleAccount();
    closeAccountSwitcher();
}

function renderStaff() {
    const staffTableBody = document.getElementById("staffTableBody");

    if (!staffTableBody) {
        return;
    }

    const staff = getStaffData();
    staffTableBody.innerHTML = staff.length ? staff.map((member, index) => `
        <tr>
            <td><strong>${member.name}</strong></td>
            <td>${member.role}</td>
            <td>${member.contact || "—"}</td>
            <td><span class="status ${member.active ? "completed" : "cancelled"}">${member.active ? "Active" : "Inactive"}</span></td>
            <td><button class="small-btn" type="button" onclick="removeStaffMember(${index})">Remove</button></td>
        </tr>
    `).join("") : `<tr><td colspan="5">No staff added yet.</td></tr>`;
}

function openStaffEditor() {
    document.getElementById("staffNameInput").value = "";
    document.getElementById("staffRoleInput").value = "";
    document.getElementById("staffContactInput").value = "";
    document.getElementById("staffActiveInput").checked = true;
    document.getElementById("staffEditorModal").classList.remove("hidden");
}

function closeStaffEditor() {
    document.getElementById("staffEditorModal")?.classList.add("hidden");
}

function saveStaffMember() {
    const name = document.getElementById("staffNameInput").value.trim();
    const role = document.getElementById("staffRoleInput").value.trim();
    const contact = document.getElementById("staffContactInput").value.trim();
    const active = document.getElementById("staffActiveInput").checked;

    if (!name || !role) {
        alert("Enter the staff member's name and role.");
        return;
    }

    const staff = getStaffData();
    const member = { name, role, contact, email: contact, active };
    staff.push(member);
    writeStoredData("foodHubStaff", staff);
    void syncStaffMemberToBackend(member);
    renderStaff();
    closeStaffEditor();
}

async function removeStaffMember(index) {
    const staff = getStaffData();

    if (confirm("Remove this staff member?")) {
        const member = staff[index];

        try {
            if (member?.databaseId != null) {
                await window.posBackend.deleteStaff(member.databaseId);
            }
        } catch (error) {
            showPOSSyncMessage(`Could not remove staff member: ${error.message}`, "error");
            return;
        }

        staff.splice(index, 1);
        writeStoredData("foodHubStaff", staff);
        renderStaff();
    }
}

/* ================= RELATIONAL BACKEND SYNC ================= */

let backendProducts = [];
let backendInventory = [];
let backendOrders = [];
let backendKitchenOrders = [];
const orderSyncTasks = new Map();

function backendReady() {
    return Boolean(window.posBackend?.getProducts && window.posBackend?.getOrders);
}

async function syncStaffMemberToBackend(member) {
    if (!window.posBackend?.createStaff) return;

    try {
        const payload = {
            name: member.name,
            role: member.role,
            email: member.email || member.contact || null
        };

        const result = member.databaseId != null
            ? await window.posBackend.updateStaff(member.databaseId, payload)
            : await window.posBackend.createStaff(payload);
        const saved = Array.isArray(result) ? result[0] : result;

        if (saved?.id != null) {
            member.databaseId = saved.id;
            writeStoredData("foodHubStaff", getStaffData());
        }
    } catch (error) {
        console.error("Staff backend sync failed:", error);
        showPOSSyncMessage(`Could not sync staff: ${error.message}`, "error");
    }
}

async function syncStaffToBackend(staff = getStaffData()) {
    if (!Array.isArray(staff)) {
        throw new Error("Saved staff data must be a list.");
    }

    const remoteStaff = await window.posBackend.getStaff();

    for (const remoteMember of Array.isArray(remoteStaff) ? remoteStaff : []) {
        const existing = staff.find(member =>
            String(member.databaseId || "") === String(remoteMember.id) ||
            (
                String(member.name || "").trim().toLowerCase() ===
                    String(remoteMember.name || "").trim().toLowerCase() &&
                String(member.email || member.contact || "").trim().toLowerCase() ===
                    String(remoteMember.email || "").trim().toLowerCase()
            )
        );

        if (existing) {
            existing.databaseId = remoteMember.id;
        } else {
            staff.push({
                databaseId: remoteMember.id,
                name: remoteMember.name,
                role: remoteMember.role,
                email: remoteMember.email || "",
                contact: remoteMember.email || "",
                active: true
            });
        }
    }

    for (const member of staff) {
        await syncStaffMemberToBackend(member);
    }

    writeStoredData("foodHubStaff", staff);
    renderStaff();
}

function normalizeProductForBackend(product) {
    return {
        name: String(product.name || "").trim(),
        category: String(product.category || "").trim(),
        price: Number(product.price || 0),
        recipe: product.recipe || {}
    };
}

function normalizeInventoryItemKey(name) {
    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
}

function normalizeInventoryForBackend(item) {
    const name = String(item.name || "").trim();
    return {
        item_name: name,
        stock: Number(item.stock || 0)
    };
}

function toLocalOrder(remoteOrder, items = [], payment = null) {
    const orderNumber = remoteOrder.order_number ?? remoteOrder.external_id ?? remoteOrder.id;
    return {
        databaseId: remoteOrder.id,
        id: String(orderNumber).startsWith("#") ? String(orderNumber) : `#${orderNumber}`,
        createdAt: new Date().toISOString(),
        type: remoteOrder.order_type || "Dine-in",
        table: remoteOrder.table_number || "—",
        items: Array.isArray(items) ? items.map(item => ({
            name: item.product_name || item.name || "Unknown Product",
            category: item.category || "Other",
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 0)
        })) : [],
        total: Number(remoteOrder.total || 0),
        status: remoteOrder.status || "New",
        paymentMethod: payment?.payment_method || remoteOrder.payment_method || null,
        deliveryChannel: remoteOrder.delivery_channel || null,
        deliveryOrderNumber: remoteOrder.delivery_order_number || null
    };
}

async function syncAllLocalDataToBackend() {
    if (!window.posBackend?.getProducts || !window.posBackend?.getOrders) {
        console.warn("Relational backend is not ready yet.");
        return false;
    }

    try {
        // Push the current browser data to the relational tables.
        // This keeps the existing UI/local cache while making Supabase the
        // relational source of truth for products, inventory, and orders.
        await syncProductsToBackend(getProductData());
        await syncInventoryToBackend(getInventoryData());
        await syncStaffToBackend(getStaffData());

        const storedOrders = readStoredData("foodHubOrders");
        const localOrders = Array.isArray(storedOrders) ? storedOrders : [];
        const orderIds = new Set(localOrders.map(order => String(order.id)));
        const storedKitchenOrders = readStoredData("foodHubKitchenOrders");

        if (Array.isArray(storedKitchenOrders)) {
            for (const order of storedKitchenOrders) {
                if (!orderIds.has(String(order.id))) {
                    localOrders.push(order);
                    orderIds.add(String(order.id));
                }
            }
        }

        if (localOrders.length) {
            localStorage.setItem("foodHubOrders", JSON.stringify(localOrders));

            for (const order of localOrders) {
                await syncOrderToBackend(order);
            }
        }

        return true;
    } catch (error) {
        console.error("Relational data sync failed:", error);
        showPOSSyncMessage(`Could not sync restaurant data: ${error.message}`, "error");
        return false;
    }
}

async function syncProductsToBackend(products = getProductData()) {
    if (!window.posBackend?.getProducts) return;

    try {
        const remote = await window.posBackend.getProducts();
        backendProducts = Array.isArray(remote) ? remote : [];

        for (const product of products) {
            const payload = normalizeProductForBackend(product);
            const existing = backendProducts.find(item =>
                String(item.name || "").trim().toLowerCase() === payload.name.toLowerCase()
            );

            if (existing?.id != null) {
                await window.posBackend.updateProduct(existing.id, payload);
            } else {
                const created = await window.posBackend.createProduct(payload);
                if (created) backendProducts.push(created);
            }
        }
    } catch (error) {
        console.error("Product backend sync failed:", error);
        showPOSSyncMessage(`Could not sync products: ${error.message}`, "error");
    }
}

async function syncInventoryToBackend(items = getInventoryData()) {
    if (!window.posBackend?.getInventory) return;

    try {
        const remote = await window.posBackend.getInventory();
        backendInventory = Array.isArray(remote) ? remote : [];

        for (const item of items) {
            const payload = normalizeInventoryForBackend(item);
            const existing = backendInventory.find(remoteItem =>
                String(remoteItem.item_name || "").trim().toLowerCase() === payload.item_name.toLowerCase()
            );

            if (existing?.id != null) {
                await window.posBackend.updateInventory(existing.id, payload);
            } else {
                const created = await window.posBackend.createInventory(payload);
                if (created) backendInventory.push(created);
            }
        }
    } catch (error) {
        console.error("Inventory backend sync failed:", error);
        showPOSSyncMessage(`Could not sync inventory: ${error.message}`, "error");
    }
}

function syncOrderToBackend(order) {
    const orderKey = String(order.id || "");
    const pendingSync = orderSyncTasks.get(orderKey);

    if (pendingSync) {
        return pendingSync;
    }

    const syncTask = syncOrderToBackendOnce(order).finally(() => {
        if (orderSyncTasks.get(orderKey) === syncTask) {
            orderSyncTasks.delete(orderKey);
        }
    });

    orderSyncTasks.set(orderKey, syncTask);
    return syncTask;
}

async function syncOrderToBackendOnce(order) {
    if (!window.posBackend?.createOrder) return null;

    try {
        let remote = null;
        const remoteOrders = await window.posBackend.getOrders();
        const orderNumber = String(order.id).replace(/^#/, "");

        remote = (Array.isArray(remoteOrders) ? remoteOrders : []).find(item =>
            String(item.order_number ?? "") === orderNumber ||
            String(item.order_number ?? "") === String(order.id)
        );

        const orderPayload = {
            order_number: orderNumber,
            order_type: order.type,
            table_number: order.table || "—",
            delivery_fee: order.deliveryFee,
            total: Number(order.total || 0),
            status: order.status || "New",
            payment_method: order.paymentMethod || null,
            delivery_channel: order.deliveryChannel || null,
            delivery_order_number: order.deliveryOrderNumber || null
        };

        if (remote?.id != null) {
            order.databaseId = remote.id;
            await window.posBackend.updateOrder(remote.id, orderPayload);
        } else {
            remote = await window.posBackend.createOrder(orderPayload);
            if (remote?.id != null) order.databaseId = remote.id;
        }

        if (order.databaseId == null) return remote;

        const remoteItems = await window.posBackend.getOrderItems(order.databaseId);
        const productCategories = new Map(
            getProductData().map(product => [
                String(product.name).trim().toLowerCase(),
                product.category
            ])
        );
        const orderItems = (order.items || []).map(item => ({
            product_name: item.name,
            category: productCategories.get(String(item.name || "").trim().toLowerCase()) || "Other",
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            total: Number(item.price || 0) * Number(item.quantity || 0)
        }));
        const itemSignature = item => [
            String(item.product_name || item.name || "").trim().toLowerCase(),
            String(item.category || "Other").trim().toLowerCase(),
            Number(item.quantity || 0),
            Number(item.price || 0)
        ].join("|");
        const existingItems = Array.isArray(remoteItems) ? remoteItems : [];
        const desiredSignatures = orderItems.map(itemSignature).sort();
        const existingSignatures = existingItems.map(itemSignature).sort();
        const itemsChanged =
            desiredSignatures.length !== existingSignatures.length ||
            desiredSignatures.some((signature, index) => signature !== existingSignatures[index]);

        if (itemsChanged) {
            if (existingItems.length && window.posBackend.deleteOrderItems) {
                await window.posBackend.deleteOrderItems(order.databaseId);
            }

            for (const item of orderItems) {
                await window.posBackend.addOrderItem(order.databaseId, {
                    product_name: item.product_name,
                    category: item.category,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                });
            }
        }

        const payments = await window.posBackend.getPayments(order.databaseId);
        if (
            order.paymentMethod &&
            (!Array.isArray(payments) || !payments.length)
        ) {
            await window.posBackend.createPayment(order.databaseId, {
                payment_method: order.paymentMethod,
                amount: Number(order.total || 0),
                status: "Paid",
                paid_at: order.createdAt || new Date().toISOString()
            });
        }

        await syncKitchenOrderToBackend(order);
        return remote;
    } catch (error) {
        console.error("Order backend sync failed:", error);
        showPOSSyncMessage(`Could not sync order: ${error.message}`, "error");
        return null;
    }
}

async function syncKitchenOrderToBackend(order) {
    if (!window.posBackend?.getKitchenOrders || order.databaseId == null) return;

    try {
        const remoteKitchen = await window.posBackend.getKitchenOrders();
        backendKitchenOrders = Array.isArray(remoteKitchen) ? remoteKitchen : [];
        const existing = backendKitchenOrders.find(item => String(item.order_id) === String(order.databaseId));
        const payload = {
            order_id: order.databaseId,
            status: order.status || "New"
        };

        if (existing?.id != null) {
            await window.posBackend.updateKitchenOrder(existing.id, payload);
        } else {
            await window.posBackend.createKitchenOrder(payload);
        }
    } catch (error) {
        console.error("Kitchen backend sync failed:", error);
        showPOSSyncMessage(`Could not sync kitchen order: ${error.message}`, "error");
    }
}

async function syncOrderStatusToBackend(order, status) {
    if (!order) return;

    try {
        if (order.databaseId == null) {
            await syncOrderToBackend(order);
        }

        if (order.databaseId == null) {
            throw new Error("The order was not saved to the database.");
        }

        await window.posBackend.updateOrder(order.databaseId, { status });

        const kitchenOrders = await window.posBackend.getKitchenOrders();
        const kitchenOrder = (Array.isArray(kitchenOrders) ? kitchenOrders : []).find(item =>
            String(item.order_id) === String(order.databaseId)
        );

        if (kitchenOrder?.id != null) {
            await window.posBackend.updateKitchenOrder(kitchenOrder.id, { status });
        }

        if (["Preparing", "Completed", "Delivered"].includes(status)) {
            const result = await window.posBackend.deductOrderInventory(order.databaseId);

            if (!result.already_deducted) {
                await restoreInventory();
                showPOSSyncMessage("Ingredient inventory was reduced for this accepted order.");
            }
        }
    } catch (error) {
        console.error("Order status backend sync failed:", error);
        showPOSSyncMessage(`Could not sync order status or deduct inventory: ${error.message}`, "error");
    }
}

async function loadRelationalProducts() {
    if (!window.posBackend?.getProducts) return false;

    try {
        const remote = await window.posBackend.getProducts();
        if (!Array.isArray(remote) || remote.length === 0) return false;

        backendProducts = remote;
        const products = remote.map(product => ({
            databaseId: product.id,
            name: product.name,
            price: Number(product.price || 0),
            category: product.category || "Lomi",
            description: product.description || "",
            available: product.active !== false,
            image: product.image || "",
            recipe: product.recipe || {}
        }));

        localStorage.setItem("foodHubProducts", JSON.stringify(products));
        return true;
    } catch (error) {
        console.error("Could not load relational products:", error);
        return false;
    }
}

async function loadRelationalInventory() {
    if (!window.posBackend?.getInventory) return false;

    try {
        const remote = await window.posBackend.getInventory();
        if (!Array.isArray(remote) || remote.length === 0) return false;

        backendInventory = remote;
        const categoryMap = new Map(defaultInventoryIngredients.map(item => [
            String(item.name).trim().toLowerCase(),
            item.category
        ]));
        const cachedInventory = readStoredData("foodHubInventory");
        if (Array.isArray(cachedInventory)) {
            cachedInventory.forEach(item => {
                categoryMap.set(String(item.name || "").trim().toLowerCase(), item.category || "Other");
            });
        }

        const inventory = remote.map(item => ({
            databaseId: item.id,
            name: item.item_name,
            category: categoryMap.get(String(item.item_name || "").trim().toLowerCase()) || "Other",
            stock: Number(item.stock || 0),
            unit: item.unit || "",
            reorderLevel: Number(item.minimum_stock || 0),
            costPerUnit: Number(item.cost_per_unit || 0)
        }));

        localStorage.setItem("foodHubInventory", JSON.stringify(inventory));
        return true;
    } catch (error) {
        console.error("Could not load relational inventory:", error);
        return false;
    }
}

async function loadRelationalOrders() {
    if (!window.posBackend?.getOrders) return false;

    try {
        const remoteOrders = await window.posBackend.getOrders();
        if (!Array.isArray(remoteOrders)) return false;

        backendOrders = remoteOrders;

        if (remoteOrders.length === 0) {
            const cachedOrders = readStoredData("foodHubOrders");
            if (Array.isArray(cachedOrders) && cachedOrders.length) {
                for (const cachedOrder of cachedOrders) {
                    await syncOrderToBackend(cachedOrder);
                }
            }
            return false;
        }

        const localOrders = [];

        for (const remoteOrder of remoteOrders) {
            const items = remoteOrder.id != null && window.posBackend.getOrderItems
                ? await window.posBackend.getOrderItems(remoteOrder.id)
                : [];
            const payments = remoteOrder.id != null && window.posBackend.getPayments
                ? await window.posBackend.getPayments(remoteOrder.id)
                : [];
            const order = toLocalOrder(remoteOrder, items, payments?.[0]);
            localOrders.push(order);
        }

        localStorage.setItem("foodHubOrders", JSON.stringify(localOrders));

        const kitchen = window.posBackend.getKitchenOrders
            ? await window.posBackend.getKitchenOrders()
            : [];
        backendKitchenOrders = Array.isArray(kitchen) ? kitchen : [];

        const kitchenOrders = [];
        for (const remoteKitchen of backendKitchenOrders) {
            const order = localOrders.find(item => String(item.databaseId) === String(remoteKitchen.order_id));
            if (order && ["New", "Preparing", "Ready", "Ready for Pickup", "Ready for Dispatch", "Out for Delivery"].includes(order.status)) {
                order.status = remoteKitchen.status || order.status;
                kitchenOrders.push(order);
            }
        }

        localStorage.setItem("foodHubKitchenOrders", JSON.stringify(kitchenOrders));
        return true;
    } catch (error) {
        console.error("Could not load relational orders:", error);
        return false;
    }
}

function persistOrder(order) {
    const storedOrders = readStoredData("foodHubOrders");
    const orders = Array.isArray(storedOrders) ? storedOrders : [];
    const existingIndex = orders.findIndex(storedOrder => storedOrder.id === order.id);

    if (existingIndex >= 0) {
        orders[existingIndex] = order;
    } else {
        orders.push(order);
    }

    try {
        localStorage.setItem("foodHubOrders", JSON.stringify(orders));
    } catch {
        console.error("Unable to cache foodHubOrders in this browser.");
    }

    void syncOrderToBackend(order);
}

function persistKitchenOrder(order) {
    const storedOrders = readStoredData("foodHubKitchenOrders");
    const orders = Array.isArray(storedOrders) ? storedOrders : [];
    const existingIndex = orders.findIndex(storedOrder => storedOrder.id === order.id);

    if (existingIndex >= 0) {
        orders[existingIndex] = order;
    } else {
        orders.push(order);
    }

    try {
        localStorage.setItem("foodHubKitchenOrders", JSON.stringify(orders));
    } catch {
        console.error("Unable to cache foodHubKitchenOrders in this browser.");
    }

    void syncKitchenOrderToBackend(order);
}

async function restoreKitchenOrders() {
    const storedOrders = readStoredData("foodHubKitchenOrders");

    if (Array.isArray(storedOrders)) {
        storedOrders.forEach(order => addKitchenOrder(order, false));
    }
}

function getKitchenContainer(status) {
    if (["Ready", "Ready for Pickup", "Ready for Dispatch", "Out for Delivery"].includes(status)) {
        return document.getElementById("readyKitchenOrders");
    }

    if (["Completed", "Delivered", "Cancelled", "Refunded"].includes(status)) {
        return null;
    }

    return status === "New"
        ? document.getElementById("newKitchenOrders")
        : document.getElementById("preparingKitchenOrders");
}

function moveKitchenCard(orderId, status) {
    const card = document.querySelector(`#kitchen .kitchen-card[data-order-id="${orderId}"]`);
    const container = getKitchenContainer(status);

    if (!card) {
        return;
    }

    if (!container) {
        card.remove();
        updateKitchenCounts();
        return;
    }

    const button = card.querySelector("button");
    const isDelivery = Boolean(card.orderData?.deliveryChannel);
    card.classList.remove("kitchen-new", "kitchen-preparing", "kitchen-ready");
    card.classList.add(`kitchen-${status.toLowerCase().replaceAll(" ", "-")}`);
    container.appendChild(card);

    if (button) {
        if (status === "New") {
            button.className = "accept-btn";
            button.textContent = "Accept Order";
        } else if (status === "Preparing") {
            button.className = "ready-btn";
            button.textContent = "Mark as Ready";
        } else if (isDelivery && status === "Ready for Dispatch") {
            button.className = "served-btn";
            button.textContent = "Dispatch Order";
        } else if (isDelivery && status === "Out for Delivery") {
            button.className = "served-btn";
            button.textContent = "Mark as Delivered";
        } else {
            button.className = "served-btn";
            button.textContent = "Mark as Served";
        }
        button.style.background = "";
    }

    updateKitchenCounts();
}

function updateOrderStatus(orderId, status) {
    const ordersTableBody = document.getElementById("ordersTableBody");
    const row = ordersTableBody?.querySelector(`[data-order-id="${orderId}"]`) ||
        Array.from(ordersTableBody?.querySelectorAll("tr") || []).find(item => item.cells[0]?.textContent.trim() === orderId);
    const statusClass = status.toLowerCase().replaceAll(" ", "-");

    if (row) {
        const statusElement = row.querySelector(".status");

        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `status ${statusClass}`;
        }

        if (row.orderData) {
            row.orderData.status = status;
        }
    }

    const kitchenCard = document.querySelector(`#kitchen .kitchen-card[data-order-id="${orderId}"]`);
    if (kitchenCard?.orderData) {
        kitchenCard.orderData.status = status;
    }

    moveKitchenCard(orderId, status);

    const storedOrders = readStoredData("foodHubOrders");
    const storedStatuses = readStoredData("foodHubOrderStatuses") || {};
    storedStatuses[orderId] = status;
    writeStoredData("foodHubOrderStatuses", storedStatuses);

    const kitchenOrders = readStoredData("foodHubKitchenOrders");
    if (Array.isArray(kitchenOrders)) {
        const kitchenOrder = kitchenOrders.find(order => order.id === orderId);
        if (kitchenOrder) {
            kitchenOrder.status = status;
            writeStoredData("foodHubKitchenOrders", kitchenOrders);
        }
    }

    let targetOrder = null;
    if (Array.isArray(storedOrders)) {
        targetOrder = storedOrders.find(order => order.id === orderId) || null;
        if (targetOrder) {
            targetOrder.status = status;
            writeStoredData("foodHubOrders", storedOrders);
        }
    }

    if (!targetOrder) {
        targetOrder = pendingKitchenOrders[orderId] || kitchenCard?.orderData || null;
    }

    if (targetOrder) {
        targetOrder.status = status;
        void syncOrderStatusToBackend(targetOrder, status);
    }

    filterOrders();
    updateSalesReports();
    updateDashboard();
}

function restoreOrderStatuses() {
    const storedStatuses = readStoredData("foodHubOrderStatuses");

    if (!storedStatuses || typeof storedStatuses !== "object") {
        return;
    }

    Object.entries(storedStatuses).forEach(([orderId, status]) => {
        const row = Array.from(document.querySelectorAll("#ordersTableBody tr")).find(item => item.cells[0]?.textContent.trim() === orderId);

        if (row) {
            const statusElement = row.querySelector(".status");

            if (statusElement) {
                statusElement.textContent = status;
                statusElement.className = `status ${status.toLowerCase().replaceAll(" ", "-")}`;
            }
        }
    });
}

function restoreOrders() {
    const storedOrders = readStoredData("foodHubOrders");

    if (Array.isArray(storedOrders)) {
        storedOrders.forEach(order => addOrderToOrders(order, false));
    }
}

function getProductData() {
    return Array.from(document.querySelectorAll(".product-management .product-card")).map(card => ({
        name: card.dataset.productName,
        price: Number(card.querySelector(".food-bottom strong")?.textContent.replace("₱", "")) || 0,
        category: card.querySelector(".product-category")?.textContent || "LOMI",
        description: card.querySelector(".food-info p")?.textContent || "",
        available: card.dataset.productAvailable !== "false",
        image: card.querySelector(".food-picture img")?.src || "",
        recipe: card.recipe || {}
    }));
}

function persistProducts() {
    const products = getProductData();
    writeStoredData("foodHubProducts", products);
    void syncProductsToBackend(products);
}

async function restoreProducts() {
    await loadRelationalProducts();

    const storedProducts = readStoredData("foodHubProducts");
    const products = Array.isArray(storedProducts) && storedProducts.length
        ? storedProducts.filter(product => {
            const name = String(product.name).trim().toLowerCase();
            const category = String(product.category).trim().toLowerCase();
            return !removedProductNames.has(name) && category !== "meals";
        })
        : [];
    const productNames = new Set(products.map(product => product.name));

    defaultProducts.forEach(product => {
        if (!productNames.has(product.name)) {
            products.push({ ...product, available: true, image: "" });
        }
    });

    const defaultProductCategories = new Map(defaultProducts.map(product => [product.name.toLowerCase(), product.category]));
    products.forEach(product => {
        const defaultCategory = defaultProductCategories.get(String(product.name).toLowerCase());

        if (defaultCategory) {
            product.category = defaultCategory;
        }
    });

    document.querySelector(".product-management").innerHTML = "";
    document.querySelector("#pos .food-grid").innerHTML = "";

    Object.keys(productAvailability).forEach(name => delete productAvailability[name]);

    const productGroups = new Map();

    products.forEach(product => {
        const category = product.category.toLowerCase().replace(/\b\w/g, character => character.toUpperCase());
        const configuredImage = productImages[product.name];
        const image = configuredImage && configuredImage !== "PASTE_IMAGE_URL_HERE"
            ? configuredImage
            : product.image || getDefaultProductImage(category);

        if (!productGroups.has(category)) {
            const group = document.createElement("section");
            group.className = "product-category-group";
            group.innerHTML = `<h2>${category}</h2><div class="product-category-grid"></div>`;
            document.querySelector(".product-management").appendChild(group);
            productGroups.set(category, group.querySelector(".product-category-grid"));
        }

        const productCard = createProductCard(
            product.name,
            product.price,
            category,
            product.description,
            product.available,
            image,
            product.recipe || {}
        );
        if (product.databaseId != null) productCard.dataset.databaseId = product.databaseId;
        productGroups.get(category).appendChild(productCard);

        const posCard = createPosProductCard(product.name, product.price, category, product.description, product.available, image);
        if (product.databaseId != null) posCard.dataset.databaseId = product.databaseId;
        document.querySelector("#pos .food-grid").appendChild(posCard);
        productAvailability[product.name] = product.available;
    });

    writeStoredData("foodHubProducts", products);
}

window.addEventListener("beforeunload", persistProducts);

function updateTotalOrders() {
    const ordersTableBody = document.getElementById("ordersTableBody");
    const totalOrdersCount = document.getElementById("totalOrdersCount");

    if (ordersTableBody && totalOrdersCount) {
        totalOrdersCount.textContent = ordersTableBody.querySelectorAll("tr").length;
    }

    updateDashboard();
}

function updateKitchenCounts() {
    const newCount = document.querySelectorAll("#newKitchenOrders .kitchen-card").length;
    const preparingCount = document.querySelectorAll("#preparingKitchenOrders .kitchen-card").length;
    const readyCount = document.querySelectorAll("#readyKitchenOrders .kitchen-card").length;
    const totalCount = newCount + preparingCount + readyCount;

    const newKitchenCount = document.getElementById("newKitchenCount");
    const preparingKitchenCount = document.getElementById("preparingKitchenCount");
    const readyKitchenCount = document.getElementById("readyKitchenCount");
    const kitchenNotification = document.getElementById("kitchenNotification");

    if (newKitchenCount) newKitchenCount.textContent = newCount;
    if (preparingKitchenCount) preparingKitchenCount.textContent = preparingCount;
    if (readyKitchenCount) readyKitchenCount.textContent = readyCount;
    if (kitchenNotification) kitchenNotification.textContent = totalCount;
}

function getNotificationStorageKey(type) {
    const userId = localStorage.getItem("foodHubBackendUserId") || "local";
    return `foodHub${type}:${userId}`;
}

function getAppNotifications() {
    const notifications = readStoredData(getNotificationStorageKey("Notifications"));
    return Array.isArray(notifications) ? notifications : [];
}

function renderNotifications() {
    const list = document.getElementById("notificationList");
    const badge = document.getElementById("notificationCount");
    const notifications = getAppNotifications();
    const unreadCount = notifications.filter(item => !item.read).length;

    if (badge) {
        badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
        badge.classList.toggle("hidden", unreadCount === 0);
    }

    if (!list) {
        return;
    }

    list.replaceChildren();
    if (!notifications.length) {
        const empty = document.createElement("p");
        empty.className = "notification-empty";
        empty.textContent = "You're all caught up.";
        list.appendChild(empty);
        return;
    }

    notifications.slice(0, 30).forEach(item => {
        const button = document.createElement("button");
        const content = document.createElement("span");
        const title = document.createElement("strong");
        const message = document.createElement("span");
        const time = document.createElement("time");
        const marker = document.createElement("span");

        button.type = "button";
        button.className = `notification-item ${item.read ? "" : "unread"} ${item.type || ""}`;
        button.dataset.notificationId = item.id;
        marker.className = "notification-item-mark";
        content.className = "notification-item-content";
        title.textContent = item.title;
        message.textContent = item.message;
        time.dateTime = item.createdAt;
        time.textContent = new Date(item.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
        content.append(title, message, time);
        button.append(marker, content);
        list.appendChild(button);
    });
}

function addAppNotification({ title, message, target, type = "order-alert", key = "" }) {
    const notifications = getAppNotifications();
    const now = Date.now();
    const duplicate = key && notifications.some(item =>
        item.key === key && now - new Date(item.createdAt).getTime() < 60_000
    );

    if (duplicate) {
        return;
    }

    notifications.unshift({
        id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        message,
        target,
        type,
        key,
        createdAt: new Date(now).toISOString(),
        read: false
    });

    writeStoredData(getNotificationStorageKey("Notifications"), notifications.slice(0, 30));
    renderNotifications();
}

function updateInventoryNotifications(rows) {
    const userId = localStorage.getItem("foodHubBackendUserId");
    if (!userId) {
        return;
    }

    const stateKey = getNotificationStorageKey("InventoryAlertStates");
    const previousStates = readStoredData(stateKey) || {};
    const currentStates = {};

    rows.forEach(item => {
        const name = String(item.name || "").trim();
        const normalizedName = name.toLowerCase();
        const stock = Number(item.stock) || 0;
        const reorderLevel = Number(item.reorderLevel) || 0;
        const status = stock <= 0 ? "out" : stock <= reorderLevel ? "low" : "good";

        if (!name || status === "good") {
            return;
        }

        currentStates[normalizedName] = status;
        if (previousStates[normalizedName] === status) {
            return;
        }

        const isOut = status === "out";
        addAppNotification({
            title: isOut ? "Ingredient out of stock" : "Ingredient running low",
            message: `${name} has ${stock} remaining${item.unit ? ` ${item.unit}` : ""}.`,
            target: "inventory",
            type: "stock-alert",
            key: `stock:${normalizedName}:${status}`
        });
    });

    writeStoredData(stateKey, currentStates);
}

function handleNotificationClick(notificationId) {
    const notifications = getAppNotifications();
    const notification = notifications.find(item => item.id === notificationId);
    if (!notification) {
        return;
    }

    notification.read = true;
    writeStoredData(getNotificationStorageKey("Notifications"), notifications);
    renderNotifications();
    document.getElementById("notificationPanel")?.classList.add("hidden");
    document.getElementById("notificationButton")?.setAttribute("aria-expanded", "false");

    const target = ["orders", "kitchen", "inventory", "settings"].includes(notification.target)
        ? notification.target
        : "dashboard";
    const navButton = Array.from(document.querySelectorAll(".nav-item")).find(button =>
        button.getAttribute("onclick")?.includes(`'${target}'`)
    );
    showPage(target, navButton || null);
}

document.getElementById("notificationButton")?.addEventListener("click", event => {
    event.stopPropagation();
    const button = event.currentTarget;
    const panel = document.getElementById("notificationPanel");
    const willOpen = panel?.classList.contains("hidden");
    panel?.classList.toggle("hidden", !willOpen);
    button.setAttribute("aria-expanded", String(Boolean(willOpen)));
});

document.getElementById("markNotificationsRead")?.addEventListener("click", () => {
    const notifications = getAppNotifications().map(item => ({ ...item, read: true }));
    writeStoredData(getNotificationStorageKey("Notifications"), notifications);
    renderNotifications();
});

document.getElementById("notificationList")?.addEventListener("click", event => {
    const notification = event.target.closest("[data-notification-id]");
    if (notification) {
        handleNotificationClick(notification.dataset.notificationId);
    }
});

document.addEventListener("click", event => {
    const center = document.querySelector(".notification-center");
    if (center && !center.contains(event.target)) {
        document.getElementById("notificationPanel")?.classList.add("hidden");
        document.getElementById("notificationButton")?.setAttribute("aria-expanded", "false");
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        document.getElementById("notificationPanel")?.classList.add("hidden");
        document.getElementById("notificationButton")?.setAttribute("aria-expanded", "false");
    }
});

function getChangeLabel(current, previous) {
    if (current === 0 && previous === 0) {
        return "No data yet";
    }

    if (previous === 0) {
        return "New data";
    }

    return `${(((current - previous) / previous) * 100).toFixed(1)}% from yesterday`;
}

function updateSalesReports() {
    const orders = readStoredData("foodHubOrders");
    const savedOrders = Array.isArray(orders) ? orders : [];
    const completedOrders = savedOrders.filter(order => order.status === "Completed");
    const cancelledOrders = savedOrders.filter(order => order.status === "Cancelled");
    const totalSales = savedOrders
        .filter(order => order.status !== "Cancelled")
        .reduce((sum, order) => sum + Number(order.total || 0), 0);
    const averageOrder = savedOrders.length ? totalSales / savedOrders.length : 0;

    const reportTotalSales = document.getElementById("reportTotalSales");
    const reportTotalOrders = document.getElementById("reportTotalOrders");
    const reportAverageOrder = document.getElementById("reportAverageOrder");
    const reportCancelledOrders = document.getElementById("reportCancelledOrders");
    const reportSalesNote = document.getElementById("reportSalesNote");
    const reportOrdersNote = document.getElementById("reportOrdersNote");
    const reportAverageOrderNote = document.getElementById("reportAverageOrderNote");
    const reportCancelledNote = document.getElementById("reportCancelledNote");
    const salesReportBody = document.getElementById("salesReportBody");
    const salesTransactionsBody = document.getElementById("salesTransactionsBody");

    if (reportTotalSales) reportTotalSales.textContent = `₱${totalSales.toFixed(2)}`;
    if (reportTotalOrders) reportTotalOrders.textContent = savedOrders.length;
    if (reportAverageOrder) reportAverageOrder.textContent = `₱${averageOrder.toFixed(2)}`;
    if (reportCancelledOrders) reportCancelledOrders.textContent = cancelledOrders.length;
    if (reportSalesNote) reportSalesNote.textContent = savedOrders.length ? "All recorded transactions" : "No data yet";
    if (reportOrdersNote) reportOrdersNote.textContent = savedOrders.length ? "All recorded transactions" : "No data yet";
    if (reportAverageOrderNote) reportAverageOrderNote.textContent = savedOrders.length ? "Per transaction" : "No data yet";
    if (reportCancelledNote) reportCancelledNote.textContent = savedOrders.length
        ? `${((cancelledOrders.length / savedOrders.length) * 100).toFixed(1)}% of orders`
        : "No data yet";

    if (salesReportBody) {
        salesReportBody.innerHTML = "";

        if (savedOrders.length === 0) {
            salesReportBody.innerHTML = `<tr><td colspan="5">No orders recorded yet.</td></tr>`;
            if (salesTransactionsBody) {
                salesTransactionsBody.innerHTML = `<tr><td colspan="6">No transactions recorded yet.</td></tr>`;
            }
            return;
        }

        const ordersByDate = {};
        savedOrders.forEach(order => {
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Current session";
            ordersByDate[date] ||= { total: 0, completed: 0, cancelled: 0, sales: 0 };
            ordersByDate[date].total += 1;
            ordersByDate[date].completed += order.status === "Completed" ? 1 : 0;
            ordersByDate[date].cancelled += order.status === "Cancelled" ? 1 : 0;
            ordersByDate[date].sales += order.status === "Cancelled" ? 0 : Number(order.total || 0);
        });

        Object.entries(ordersByDate).forEach(([date, summary]) => {
            salesReportBody.insertAdjacentHTML("beforeend", `
                <tr>
                    <td>${date}</td>
                    <td>${summary.total}</td>
                    <td>${summary.completed}</td>
                    <td>${summary.cancelled}</td>
                    <td><strong>₱${summary.sales.toFixed(2)}</strong></td>
                </tr>
            `);
        });
    }

    if (salesTransactionsBody) {
        salesTransactionsBody.innerHTML = savedOrders.length
            ? savedOrders.slice().reverse().map(order => {
                const date = order.createdAt
                    ? new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
                    : "Current session";
                const products = order.items.map(item => `${item.quantity}x ${item.name}`).join(", ");
                const status = order.status || "Preparing";

                return `
                    <tr>
                        <td><strong>${order.id}</strong></td>
                        <td>${date}</td>
                        <td>${products}</td>
                        <td>${order.paymentMethod || "—"}</td>
                        <td><span class="status ${status.toLowerCase().replaceAll(" ", "-")}">${status}</span></td>
                        <td><strong>₱${Number(order.total || 0).toFixed(2)}</strong></td>
                    </tr>
                `;
            }).join("")
            : `<tr><td colspan="6">No transactions recorded yet.</td></tr>`;
    }
}

function exportSalesReport() {
    const storedOrders = readStoredData("foodHubOrders");
    const orders = Array.isArray(storedOrders) ? storedOrders : [];
    const activeOrders = orders.filter(order => order.status !== "Cancelled");
    const totalSales = activeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const cancelledOrders = orders.filter(order => order.status === "Cancelled").length;
    const averageOrder = orders.length ? totalSales / orders.length : 0;
    const escapeCsv = value => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const formatDate = order => order.createdAt
        ? new Date(order.createdAt).toLocaleString("en-US")
        : "Current session";
    const rows = [
        ["Sales Report"],
        ["Generated", new Date().toLocaleString("en-US")],
        [],
        ["Summary"],
        ["Total Sales", totalSales.toFixed(2)],
        ["Total Orders", orders.length],
        ["Average Order", averageOrder.toFixed(2)],
        ["Cancelled Orders", cancelledOrders],
        [],
        ["Order ID", "Date", "Products", "Payment", "Status", "Total"]
    ];

    orders.slice().reverse().forEach(order => {
        rows.push([
            order.id,
            formatDate(order),
            order.items.map(item => `${item.quantity}x ${item.name}`).join(", "),
            order.paymentMethod || "",
            order.status || "Preparing",
            Number(order.total || 0).toFixed(2)
        ]);
    });

    const csv = rows.map(row => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

document.getElementById("exportSalesReport")?.addEventListener("click", exportSalesReport);

function updateDashboard() {
    const savedOrders = readStoredData("foodHubOrders");
    const orders = Array.isArray(savedOrders) ? savedOrders : [];
    const todayKey = new Date().toDateString();
    const todayOrders = orders.filter(order => order.createdAt && new Date(order.createdAt).toDateString() === todayKey);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayOrders = orders.filter(order => order.createdAt && new Date(order.createdAt).toDateString() === yesterday.toDateString());
    const todaySales = todayOrders.filter(order => order.status !== "Cancelled").reduce((sum, order) => sum + Number(order.total || 0), 0);
    const yesterdaySales = yesterdayOrders.filter(order => order.status !== "Cancelled").reduce((sum, order) => sum + Number(order.total || 0), 0);
    const completedOrders = orders.filter(order => order.status === "Completed").length;
    const lowStock = document.querySelectorAll("#inventoryTableBody .stock.low").length;

    const todaySalesElement = document.getElementById("dashboardTodaySales");
    const completedElement = document.getElementById("dashboardCompletedOrders");
    const completionRateElement = document.getElementById("dashboardCompletionRate");
    const lowStockElement = document.getElementById("dashboardLowStock");
    const salesChangeElement = document.getElementById("dashboardSalesChange");
    const ordersChangeElement = document.getElementById("dashboardOrdersChange");
    const recentOrdersElement = document.getElementById("dashboardRecentOrders");
    const topProductsElement = document.getElementById("dashboardTopProducts");

    if (todaySalesElement) todaySalesElement.textContent = `₱${todaySales.toFixed(2)}`;
    if (salesChangeElement) salesChangeElement.textContent = getChangeLabel(todaySales, yesterdaySales);
    if (ordersChangeElement) ordersChangeElement.textContent = getChangeLabel(todayOrders.length, yesterdayOrders.length);
    if (completedElement) completedElement.textContent = completedOrders;
    if (completionRateElement) completionRateElement.textContent = orders.length
        ? `${((completedOrders / orders.length) * 100).toFixed(1)}% completion rate`
        : "No data yet";
    if (lowStockElement) lowStockElement.textContent = lowStock;

    if (recentOrdersElement) {
        recentOrdersElement.innerHTML = orders.slice(-5).reverse().map(order => `
            <tr>
                <td><strong>${order.id}</strong></td>
                <td>${order.deliveryChannel ? `${order.deliveryChannel} #${order.deliveryOrderNumber}` : order.table}</td>
                <td>${order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}</td>
                <td>₱${Number(order.total || 0).toFixed(2)}</td>
                <td>${order.paymentMethod || "—"}</td>
                <td><span class="status ${(order.status || "Preparing").toLowerCase().replaceAll(" ", "-")}">${order.status || "Preparing"}</span></td>
            </tr>
        `).join("");
    }

    if (topProductsElement) {
        const productTotals = {};
        orders.forEach(order => order.items.forEach(item => {
            productTotals[item.name] ||= { quantity: 0, sales: 0 };
            productTotals[item.name].quantity += item.quantity;
            productTotals[item.name].sales += item.price * item.quantity;
        }));

        const topProducts = Object.entries(productTotals).sort((a, b) => b[1].quantity - a[1].quantity).slice(0, 4);
        topProductsElement.innerHTML = topProducts.length ? topProducts.map(([name, data], index) => `
            <div class="rank-item">
                <div class="rank">${String(index + 1).padStart(2, "0")}</div>
                <div class="rank-image"><i class="fa-solid fa-bowl-food"></i></div>
                <div class="rank-info"><strong>${name}</strong><span>${data.quantity} sold</span></div>
                <strong>₱${data.sales.toFixed(2)}</strong>
            </div>
        `).join("") : `<p class="empty-order">No product sales yet.</p>`;
    }

    const salesBars = document.getElementById("dashboardSalesBars");

    if (salesBars) {
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            return date;
        });
        const dailySales = days.map(date => orders
            .filter(order => order.createdAt && new Date(order.createdAt).toDateString() === date.toDateString() && order.status !== "Cancelled")
            .reduce((sum, order) => sum + Number(order.total || 0), 0));
        const maxSales = Math.max(...dailySales, 1);

        salesBars.innerHTML = days.map((date, index) => `
            <div class="bar-container">
                <div class="bar${index === 6 ? " today" : ""}" style="height:${(dailySales[index] / maxSales) * 90}%"></div>
                <span>${date.toLocaleDateString("en-US", { weekday: "short" })}</span>
            </div>
        `).join("");
    }
}

function clearPastOrders() {
    const confirmed = confirm("Remove all past orders and saved Kitchen order history? Products and Inventory will not be affected.");

    if (!confirmed) {
        return;
    }

    removeOrderHistoryFromView();

    writeStoredData("foodHubOrders", []);
    writeStoredData("foodHubOrderStatuses", {});
    writeStoredData("foodHubKitchenOrders", []);
    writeStoredData("foodHubOrderHistoryCleared", true);
    updateTotalOrders();
    updateSalesReports();
}

function refreshAllOrders() {
    removeOrderHistoryFromView();
    restoreOrders();
    restoreKitchenOrders();
    restoreOrderStatuses();
    updateTotalOrders();
    updateSalesReports();
    updateDashboard();
    updateKitchenCounts();
}

function removeOrderHistoryFromView() {
    document.getElementById("ordersTableBody")?.replaceChildren();
    document.getElementById("newKitchenOrders")?.replaceChildren();
    document.querySelectorAll("#dashboard table tbody tr").forEach(row => row.remove());
    document.querySelectorAll("#kitchen .kitchen-card").forEach(card => card.remove());
    Object.keys(pendingKitchenOrders).forEach(orderId => delete pendingKitchenOrders[orderId]);
    updateKitchenCounts();
}

function updateInventoryStats() {
    const inventoryTableBody = document.getElementById("inventoryTableBody");

    if (!inventoryTableBody) {
        return;
    }

    const rows = inventoryTableBody.querySelectorAll("tr.inventory-item-row");
    const totalItems = document.getElementById("inventoryTotalItems");
    const lowStock = document.querySelector(".inventory-stat.warning strong");
    const outOfStock = document.querySelector(".inventory-stat.danger strong");

    if (totalItems) {
        totalItems.textContent = rows.length;
    }

    if (lowStock) {
        lowStock.textContent = inventoryTableBody.querySelectorAll(".stock.low").length;
    }

    if (outOfStock) {
        outOfStock.textContent = inventoryTableBody.querySelectorAll(".stock.out").length;
    }

    updateInventoryNotifications(getInventoryData());
    updateDashboard();
}

function showPOSSyncMessage(message, type = "") {
    if (type === "error") {
        addAppNotification({
            title: "POS sync problem",
            message,
            target: "settings",
            type: "sync-error",
            key: `sync:${message}`
        });
    }

    const toast = document.getElementById("settingsSavedToast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.toggle("backend-error", type === "error");
    toast.classList.remove("hidden");

    window.clearTimeout(showPOSSyncMessage.timeout);
    showPOSSyncMessage.timeout = window.setTimeout(() => {
        toast.classList.add("hidden");
        toast.classList.remove("backend-error");
        toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> Settings saved successfully';
    }, 7000);
}

function getInventoryData() {
    return Array.from(document.querySelectorAll("#inventoryTableBody tr.inventory-item-row")).map(row => ({
        name: row.cells[0]?.textContent.trim() || "",
        category: row.cells[1]?.textContent.trim() || "",
        stock: Number(row.cells[2]?.textContent) || 0,
        unit: row.cells[3]?.textContent.trim() || "",
        reorderLevel: Number.parseFloat(row.cells[4]?.textContent) || 0
    }));
}

function persistInventory() {
    const inventory = getInventoryData();
    writeStoredData("foodHubInventory", inventory);
    void syncInventoryToBackend(inventory);
}

function createInventoryRow(item) {
    const statusClass = item.stock === 0 ? "out" : item.stock <= item.reorderLevel ? "low" : "good";
    const statusLabel = item.stock === 0 ? "Out of Stock" : item.stock <= item.reorderLevel ? "Low Stock" : "In Stock";
    const row = document.createElement("tr");
    row.className = "inventory-item-row";

    row.innerHTML = `
        <td><strong>${item.name}</strong></td>
        <td>${item.category}</td>
        <td>${item.stock}</td>
        <td>${item.unit}</td>
        <td>${item.reorderLevel} ${item.unit}</td>
        <td><span class="stock ${statusClass}">${statusLabel}</span></td>
        <td>
            <button class="small-btn" type="button" onclick="editInventoryRow(this)">Edit</button>
            <button class="small-btn" type="button" onclick="removeInventoryRow(this)">Remove</button>
        </td>
    `;

    return row;
}

async function restoreInventory() {
    await loadRelationalInventory();

    const storedInventory = readStoredData("foodHubInventory");
    const inventoryTableBody = document.getElementById("inventoryTableBody");

    if (!inventoryTableBody) {
        return;
    }

    inventoryTableBody.innerHTML = "";
    const savedItems = Array.isArray(storedInventory) && storedInventory.length ? storedInventory : defaultInventoryIngredients;
    const groupedIngredients = new Map();

    savedItems.forEach(item => {
        if (!groupedIngredients.has(item.category)) {
            groupedIngredients.set(item.category, []);
        }

        groupedIngredients.get(item.category).push(item);
    });

    groupedIngredients.forEach((items, category) => {
        const categoryRow = document.createElement("tr");
        categoryRow.className = "inventory-category-row";
        categoryRow.innerHTML = `<td colspan="7">${category}</td>`;
        inventoryTableBody.appendChild(categoryRow);
        items.forEach(item => inventoryTableBody.appendChild(createInventoryRow(item)));
    });

    writeStoredData("foodHubInventory", savedItems);
    updateInventoryStats();
}

function openInventoryEditor() {
    editingInventoryRow = null;
    document.getElementById("inventoryEditorTitle").textContent = "Add Inventory Item";
    document.getElementById("inventoryNameInput").value = "";
    document.getElementById("inventoryCategoryInput").value = "";
    document.getElementById("inventoryStockInput").value = "";
    document.getElementById("inventoryUnitInput").value = "";
    document.getElementById("inventoryReorderInput").value = "";
    document.querySelector('#inventoryEditorModal .primary-btn').textContent = "Add Item";

    const modal = document.getElementById("inventoryEditorModal");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function editInventoryRow(button) {
    const row = button.closest("tr");

    if (!row) {
        return;
    }

    editingInventoryRow = row;
    document.getElementById("inventoryEditorTitle").textContent = "Edit Inventory Item";
    document.getElementById("inventoryNameInput").value = row.cells[0].textContent.trim();
    document.getElementById("inventoryCategoryInput").value = row.cells[1].textContent.trim();
    document.getElementById("inventoryStockInput").value = row.cells[2].textContent.trim();
    document.getElementById("inventoryUnitInput").value = row.cells[3].textContent.trim();
    document.getElementById("inventoryReorderInput").value = Number.parseFloat(row.cells[4].textContent) || 0;
    document.querySelector('#inventoryEditorModal .primary-btn').textContent = "Save Changes";

    const modal = document.getElementById("inventoryEditorModal");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function closeInventoryEditor() {
    const modal = document.getElementById("inventoryEditorModal");

    if (modal) {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
    }

    editingInventoryRow = null;
}

function saveInventoryItem() {
    const name = document.getElementById("inventoryNameInput").value.trim();
    const category = document.getElementById("inventoryCategoryInput").value.trim();
    const stock = Number(document.getElementById("inventoryStockInput").value);
    const unit = document.getElementById("inventoryUnitInput").value.trim();
    const reorderLevel = Number(document.getElementById("inventoryReorderInput").value);

    if (!name || !category || !unit || !Number.isFinite(stock) || stock < 0 || !Number.isFinite(reorderLevel) || reorderLevel < 0) {
        alert("Enter the ingredient, category, stock, unit, and reorder level.");
        return;
    }

    const inventoryItem = {
        name,
        category,
        stock,
        unit,
        reorderLevel
    };

    if (editingInventoryRow) {
        const replacementRow = createInventoryRow(inventoryItem);
        editingInventoryRow.replaceWith(replacementRow);
    } else {
        document.getElementById("inventoryTableBody")?.appendChild(createInventoryRow(inventoryItem));
    }

    persistInventory();
    updateInventoryStats();
    closeInventoryEditor();
}

function removeInventoryRow(button) {
    const row = button.closest("tr");

    if (row && confirm(`Remove ${row.cells[0].textContent.trim()} from inventory?`)) {
        row.remove();
        persistInventory();
        updateInventoryStats();
    }
}

function removeAllInventoryItems() {
    if (!confirm("Remove all inventory items? Products and Orders will not be affected.")) {
        return;
    }

    document.getElementById("inventoryTableBody")?.replaceChildren();
    persistInventory();
    updateInventoryStats();
}

function openProductEditor(button) {
    const card = button.closest(".product-card");

    if (!card) {
        return;
    }

    editingProductCard = card;
    editingProductImage = card.querySelector(".food-picture img")?.src || "";
    editingProductImagePromise = Promise.resolve(editingProductImage);
    document.getElementById("productNameInput").value = card.dataset.productName || "";
    document.getElementById("productPriceInput").value = card.querySelector(".food-bottom strong")?.textContent.replace("₱", "") || "";
    const currentCategory = card.querySelector(".product-category")?.textContent.trim() || "Lomi";
    const categoryOption = Array.from(document.getElementById("productCategoryInput").options)
        .find(option => option.value.toLowerCase() === currentCategory.toLowerCase());
    document.getElementById("productCategoryInput").value = categoryOption?.value || "Lomi";
    document.getElementById("productDescriptionInput").value = card.querySelector(".food-info p")?.textContent || "";
    document.getElementById("productRecipeInput").value = formatProductRecipe(card.recipe || {});
    document.getElementById("productAvailableInput").checked = card.dataset.productAvailable !== "false";
    document.getElementById("productImageInput").value = "";
    document.getElementById("productEditorTitle").textContent = "Edit Product";

    const modal = document.getElementById("productEditorModal");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function openNewProductEditor() {
    editingProductCard = null;
    editingProductImage = "";
    editingProductImagePromise = Promise.resolve("");
    document.getElementById("productNameInput").value = "";
    document.getElementById("productPriceInput").value = "";
    document.getElementById("productCategoryInput").value = "Lomi";
    document.getElementById("productDescriptionInput").value = "";
    document.getElementById("productRecipeInput").value = "";
    document.getElementById("productAvailableInput").checked = true;
    document.getElementById("productImageInput").value = "";
    document.getElementById("productEditorTitle").textContent = "Add Product";

    const modal = document.getElementById("productEditorModal");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function formatProductRecipe(recipe) {
    const inventoryByKey = new Map(
        getInventoryData().map(item => [
            normalizeInventoryItemKey(item.name),
            item.name
        ])
    );

    return Object.entries(recipe)
        .map(([itemKey, amount]) => {
            const itemName = inventoryByKey.get(itemKey) ||
                itemKey.replaceAll("_", " ");

            return `${itemName}: ${amount}`;
        })
        .join("\n");
}

function parseProductRecipe(value) {
    const recipe = {};
    const inventoryByKey = new Map(
        getInventoryData().map(item => [
            normalizeInventoryItemKey(item.name),
            item.name
        ])
    );

    for (const [index, rawLine] of value.split(/\r?\n/).entries()) {
        const line = rawLine.trim();

        if (!line) {
            continue;
        }

        const separatorIndex = line.lastIndexOf(":");

        if (separatorIndex < 1) {
            throw new Error(`Line ${index + 1} must use the format ingredient name: amount.`);
        }

        const itemName = line.slice(0, separatorIndex).trim();
        const itemKey = normalizeInventoryItemKey(itemName);
        const amount = Number(line.slice(separatorIndex + 1).trim());

        if (!itemKey || !Number.isFinite(amount) || amount <= 0) {
            throw new Error(`Line ${index + 1} needs an ingredient name and an amount greater than zero.`);
        }

        if (!inventoryByKey.has(itemKey)) {
            throw new Error(`"${itemName}" is not in Inventory. Add the ingredient there first.`);
        }

        recipe[itemKey] = (recipe[itemKey] || 0) + amount;
    }

    return recipe;
}

function closeProductEditor() {
    const modal = document.getElementById("productEditorModal");

    if (modal) {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
    }

    editingProductCard = null;
    editingProductImage = "";
    editingProductImagePromise = Promise.resolve("");
}

const productImageInput = document.getElementById("productImageInput");
if (productImageInput) {
    productImageInput.addEventListener("change", function () {
        const file = this.files[0];

        if (!file) {
            return;
        }

        editingProductImagePromise = new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = event => {
                editingProductImage = event.target.result;
                resolve(editingProductImage);
            };
            reader.onerror = () => resolve(editingProductImage);
            reader.readAsDataURL(file);
        });
    });
}

function updatePosProductCard(oldName, newName, price, available, image) {
    document.querySelectorAll("#pos .food-card").forEach(card => {
        const productName = card.querySelector("h3")?.textContent.trim();

        if (productName === oldName) {
            card.querySelector("h3").textContent = newName;
            card.querySelector(".food-bottom strong").textContent = `₱${price.toFixed(2)}`;
            if (image) {
                card.querySelector(".food-picture").innerHTML = `<img src="${image}" alt="${newName}">`;
            }
            attachProductImageFallback(card, card.dataset.productCategory || "Lomi");
            card.setAttribute("onclick", `addItem(${JSON.stringify(newName)}, ${price})`);
            card.classList.toggle("product-unavailable", !available);
            card.setAttribute("aria-disabled", String(!available));
        }
    });
}

async function saveProductChanges() {
    const oldName = editingProductCard?.dataset.productName || "";
    const name = document.getElementById("productNameInput").value.trim();
    const price = Number(document.getElementById("productPriceInput").value);
    const selectedCategory = document.getElementById("productCategoryInput").value;
    const originalCategory = editingProductCard?.querySelector(".product-category")?.textContent.trim() || "";
    const category = selectedCategory || originalCategory || "Lomi";
    const image = await editingProductImagePromise;
    const description = document.getElementById("productDescriptionInput").value.trim();
    const available = document.getElementById("productAvailableInput").checked;
    let recipe;

    if (!name || !Number.isFinite(price) || price < 0) {
        alert("Enter a product name and a valid price.");
        return;
    }

    try {
        recipe = parseProductRecipe(document.getElementById("productRecipeInput").value);
    } catch (error) {
        alert(error.message);
        return;
    }

    if (!editingProductCard) {
        const productCard = createProductCard(
            name,
            price,
            category,
            description,
            available,
            image,
            recipe
        );
        let categoryGrid = Array.from(document.querySelectorAll(".product-category-group")).find(group =>
            group.querySelector("h2")?.textContent.toLowerCase() === category.toLowerCase()
        )?.querySelector(".product-category-grid");

        if (!categoryGrid) {
            const categoryGroup = document.createElement("section");
            categoryGroup.className = "product-category-group";
            categoryGroup.innerHTML = `<h2>${category}</h2><div class="product-category-grid"></div>`;
            document.querySelector(".product-management")?.appendChild(categoryGroup);
            categoryGrid = categoryGroup.querySelector(".product-category-grid");
        }

        categoryGrid?.appendChild(productCard);
        const posCard = createPosProductCard(name, price, category, description, available, image);
        document.querySelector("#pos .food-grid")?.appendChild(posCard);
        productAvailability[name] = available;
        persistProducts();
        closeProductEditor();
        return;
    }

    editingProductCard.dataset.productName = name;
    editingProductCard.dataset.productAvailable = String(available);
    editingProductCard.recipe = recipe;
    editingProductCard.querySelector(".product-category").textContent = category.toUpperCase();
    editingProductCard.querySelector(".food-info h3").textContent = name;
    editingProductCard.querySelector(".food-info p").textContent = description;
    editingProductCard.querySelector(".food-bottom strong").textContent = `₱${price.toFixed(2)}`;
    if (image) {
        editingProductCard.querySelector(".food-picture").innerHTML = `<img src="${image}" alt="${name}">`;
    }
    attachProductImageFallback(editingProductCard, category);

    const availabilityLabel = editingProductCard.querySelector(".product-availability");
    availabilityLabel.textContent = available ? "Available" : "Not available";
    availabilityLabel.classList.toggle("available", available);
    availabilityLabel.classList.toggle("unavailable", !available);

    delete productAvailability[oldName];
    productAvailability[name] = available;

    const currentCategoryGroup = editingProductCard.closest(".product-category-group");
    const targetCategoryGroup = Array.from(document.querySelectorAll(".product-category-group")).find(group =>
        group.querySelector("h2")?.textContent.toLowerCase() === category.toLowerCase()
    );

    if (currentCategoryGroup && targetCategoryGroup && currentCategoryGroup !== targetCategoryGroup) {
        targetCategoryGroup.querySelector(".product-category-grid")?.appendChild(editingProductCard);

        if (!currentCategoryGroup.querySelector(".product-card")) {
            currentCategoryGroup.remove();
        }
    }

    updatePosProductCard(oldName, name, price, available, image);
    persistProducts();
    closeProductEditor();
}

function createProductCard(name, price, category, description, available, image, recipe = {}) {
    const card = document.createElement("div");
    card.className = "food-card product-card";
    card.dataset.productName = name;
    card.dataset.productAvailable = String(available);
    card.recipe = recipe;
    card.innerHTML = `
        <div class="food-picture">${image ? `<img src="${image}" alt="${name}">` : "<i class=\"fa-solid fa-bowl-food\"></i>"}</div>
        <div class="food-info">
            <span class="product-category">${category.toUpperCase()}</span>
            <span class="product-availability ${available ? "available" : "unavailable"}">${available ? "Available" : "Not available"}</span>
            <h3>${name}</h3>
            <p>${description}</p>
            <div class="food-bottom">
                <strong>₱${price.toFixed(2)}</strong>
                <button class="edit-product" type="button" aria-label="Edit ${name}"><i class="fa-solid fa-pen"></i></button>
            </div>
        </div>
    `;
    attachProductImageFallback(card, category);
    card.querySelector(".edit-product").addEventListener("click", () => openProductEditor(card.querySelector(".edit-product")));
    return card;
}

function createPosProductCard(name, price, category, description, available, image) {
    const card = document.createElement("div");
    card.className = `food-card${available ? "" : " product-unavailable"}`;
    card.dataset.productCategory = category;
    card.setAttribute("aria-disabled", String(!available));
    card.innerHTML = `
        <div class="food-picture">${image ? `<img src="${image}" alt="${name}">` : "<i class=\"fa-solid fa-bowl-food\"></i>"}</div>
        <div class="food-info">
            <h3>${name}</h3>
            <p>${description}</p>
            <div class="food-bottom"><strong>₱${price.toFixed(2)}</strong><button type="button">+</button></div>
        </div>
    `;
    attachProductImageFallback(card, category);
    card.addEventListener("click", () => addItem(name, price));
    return card;
}

function getCurrentOrderTypeLabel() {
    const activeButton = document.querySelector(".type-btn.active");
    const activeType = activeButton?.dataset.orderType || "dinein";

    if (activeType === "delivery") {
        return `Delivery (${selectedDeliveryChannel})`;
    }

    return activeButton?.textContent.trim() || "Dine-in";
}

function updateDeliveryChannelVisibility() {
    const deliveryWrap = document.getElementById("deliveryChannelWrap");
    const deliveryChannelSelect = document.getElementById("deliveryChannelSelect");
    const tableSelect = document.querySelector(".table-select");
    const activeType = document.querySelector(".type-btn.active")?.dataset.orderType;

    const foodpandaEnabled = document.querySelector('input[data-setting="foodpanda"]')?.checked !== false;
    const grabEnabled = document.querySelector('input[data-setting="grabfood"]')?.checked !== false;

    const isDelivery = activeType === "delivery";

    if (deliveryWrap) {
        deliveryWrap.classList.toggle("hidden", !isDelivery);
    }
    if (tableSelect) {
        tableSelect.classList.toggle("hidden", isDelivery);
    }

    if (deliveryChannelSelect && isDelivery) {
        const grabOption = deliveryChannelSelect.querySelector('option[value="Grab"]');
        const foodpandaOption = deliveryChannelSelect.querySelector('option[value="Foodpanda"]');

        if (grabOption) grabOption.disabled = !grabEnabled;
        if (foodpandaOption) foodpandaOption.disabled = !foodpandaEnabled;

        if (deliveryChannelSelect.selectedOptions[0]?.disabled) {
            const firstEnabledOption = Array.from(deliveryChannelSelect.options).find(option => !option.disabled);

            if (firstEnabledOption) {
                deliveryChannelSelect.value = firstEnabledOption.value;
            }
        }

        selectedDeliveryChannel = deliveryChannelSelect.value || "Grab";
    }

    const deliveryOrderNumber = document.getElementById("deliveryOrderNumber");
    if (deliveryOrderNumber) {
        deliveryOrderNumber.required = isDelivery;
    }

    const deliveryFeeInput = document.getElementById("deliveryFeeInput");
    if (deliveryFeeInput) {
        deliveryFeeInput.disabled = !isDelivery;
    }

    updateTotal();
}

function getDeliveryFee() {
    const isDelivery = document.querySelector(".type-btn.active")?.dataset.orderType === "delivery";

    if (!isDelivery) {
        return null;
    }

    const value = Number(document.getElementById("deliveryFeeInput")?.value || 0);
    return Number.isFinite(value) && value >= 0 ? value : 0;
}

function updateCurrentOrderNumber() {
    const currentOrderNumber = document.getElementById("currentOrderNumber");

    if (currentOrderNumber) {
        currentOrderNumber.textContent = `#${nextOrderNumber}`;
    }
}

updateCurrentOrderNumber();


function addItem(name, price) {

    if (productAvailability[name] === false) {
        alert(`${name} is currently not available.`);
        return;
    }

    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({
            name: name,
            price: price,
            quantity: 1
        });

    }

    renderCart();
}


function removeItem(index) {

    cart.splice(index, 1);

    renderCart();
}


function increaseQuantity(index) {

    cart[index].quantity++;

    renderCart();
}


function decreaseQuantity(index) {

    if (cart[index].quantity > 1) {

        cart[index].quantity--;

    } else {

        cart.splice(index, 1);

    }

    renderCart();
}


function renderCart() {

    const orderItems = document.getElementById("orderItems");

    if (cart.length === 0) {

        orderItems.innerHTML = `
            <div class="empty-order">
                <i class="fa-solid fa-cart-shopping"></i>
                <h3>No items yet</h3>
                <p>Select products to add them to the order.</p>
            </div>
        `;

        updateTotal();

        return;
    }


    orderItems.innerHTML = "";

    cart.forEach((item, index) => {

        const itemTotal = item.price * item.quantity;

        const div = document.createElement("div");

        div.className = "order-item";

        div.innerHTML = `

            <div class="order-item-info">

                <strong>${item.name}</strong>

                <span>₱${item.price.toFixed(2)} each</span>

            </div>


            <div class="quantity">

                <button onclick="decreaseQuantity(${index})">
                    -
                </button>

                <span>${item.quantity}</span>

                <button onclick="increaseQuantity(${index})">
                    +
                </button>

            </div>


            <div class="item-price">
                ₱${itemTotal.toFixed(2)}
            </div>


            <button
                onclick="removeItem(${index})"
                style="
                    border:none;
                    background:none;
                    color:#df5b5b;
                    cursor:pointer;
                "
            >
                <i class="fa-solid fa-trash"></i>
            </button>

        `;

        orderItems.appendChild(div);

    });

    updateTotal();
}


function updateTotal() {

    let subtotal = 0;

    cart.forEach(item => {

        subtotal += item.price * item.quantity;

    });

    const deliveryFee = getDeliveryFee() || 0;

    document.getElementById("subtotal").textContent =
        `₱${subtotal.toFixed(2)}`;

    document.getElementById("total").textContent =
        `₱${(subtotal + deliveryFee).toFixed(2)}`;
}


function clearOrder() {

    if (cart.length === 0) {
        return;
    }

    const confirmClear = confirm(
        "Are you sure you want to clear this order?"
    );

    if (confirmClear) {

        cart = [];

        renderCart();

    }
}


function openPaymentModal() {
    if (cart.length === 0) {
        alert("Please add items to the order first.");
        return;
    }

    const activeType = document.querySelector(".type-btn.active")?.dataset.orderType;
    const deliveryOrderNumber = document.getElementById("deliveryOrderNumber");

    if (activeType === "delivery" && !deliveryOrderNumber?.value.trim()) {
        alert(`Enter the ${selectedDeliveryChannel} order number first.`);
        deliveryOrderNumber?.focus();
        return;
    }

    const modal = document.getElementById("paymentModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}


function closePaymentModal() {
    const modal = document.getElementById("paymentModal");

    if (!modal) {
        return;
    }

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
}


function generateReceiptHtml(order) {
    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemRows = order.items.map(item => `
        <div class="receipt-row">
            <span>${item.quantity}x ${item.name}</span>
            <strong>₱${(item.price * item.quantity).toFixed(2)}</strong>
        </div>
    `).join("");

    return `
        <div class="receipt-header">
            <h4>Edwin's Lomi House</h4>
            <small>Restaurant POS</small>
        </div>

        <div class="receipt-meta">
            <span>Order: ${order.id}</span>
            <span>${order.type}</span>
            ${order.deliveryChannel ? `<span>${order.deliveryChannel}</span>` : ""}
            ${order.deliveryOrderNumber ? `<span>App Order #: ${order.deliveryOrderNumber}</span>` : ""}
            <span>${order.table}</span>
            <span>${new Date().toLocaleString()}</span>
        </div>

        <div class="receipt-items">
            ${itemRows}
        </div>

        <div class="receipt-total">
            <span>Payment</span>
            <strong>${order.paymentMethod}</strong>
        </div>

        ${order.deliveryFee != null ? `
            <div class="receipt-total">
                <span>Delivery Fee</span>
                <strong>₱${Number(order.deliveryFee).toFixed(2)}</strong>
            </div>
        ` : ""}

        <div class="receipt-total grand-total">
            <span>Total</span>
            <strong>₱${Number(order.total || subtotal).toFixed(2)}</strong>
        </div>
    `;
}

function openReceiptModal(order) {
    const receiptContent = document.getElementById("receiptContent");

    if (!receiptContent) {
        return;
    }

    receiptContent.innerHTML = generateReceiptHtml(order);

    const receiptModal = document.getElementById("receiptModal");
    if (receiptModal) {
        receiptModal.classList.remove("hidden");
        receiptModal.setAttribute("aria-hidden", "false");
    }
}

function closeReceiptModal() {
    const receiptModal = document.getElementById("receiptModal");

    if (receiptModal) {
        receiptModal.classList.add("hidden");
        receiptModal.setAttribute("aria-hidden", "true");
    }
}

function printReceipt() {
    const receiptContent = document.getElementById("receiptContent");

    if (!receiptContent) {
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 320px; margin: 20px auto; color: #222; }
                    .receipt-header { text-align: center; margin-bottom: 10px; }
                    .receipt-header h4 { margin: 0; font-size: 22px; }
                    .receipt-meta { font-size: 11px; line-height: 1.6; border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 8px 0; margin: 12px 0; }
                    .receipt-row { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; margin: 6px 0; }
                    .receipt-total { display: flex; justify-content: space-between; font-size: 12px; padding-top: 8px; }
                    .grand-total { font-size: 14px; font-weight: 700; border-top: 1px solid #444; margin-top: 8px; padding-top: 12px; }
                </style>
            </head>
            <body>${receiptContent.innerHTML}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

function confirmPayment() {
    if (cart.length === 0) {
        alert("Please add items to the order first.");
        return;
    }

    const order = {
        id: `#${nextOrderNumber}`,
        createdAt: new Date().toISOString(),
        type: getCurrentOrderTypeLabel(),
        table: document.querySelector(".table-select select")?.value || "—",
        items: cart.map(item => ({ ...item })),
        deliveryFee: getDeliveryFee(),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + (getDeliveryFee() || 0),
        status: "New",
        paymentMethod: selectedPaymentMethod,
        deliveryChannel: document.querySelector(".type-btn.active")?.dataset.orderType === "delivery" ? selectedDeliveryChannel : null,
        deliveryOrderNumber: document.querySelector(".type-btn.active")?.dataset.orderType === "delivery" ? document.getElementById("deliveryOrderNumber")?.value.trim() : null
    };

    addKitchenOrder(order);
    addOrderToOrders(order);

    nextOrderNumber += 1;
    saveNextOrderNumber();
    resetCurrentOrder();

    closePaymentModal();
    openReceiptModal(order);
}


function resetCurrentOrder() {
    cart = [];
    renderCart();
    updateCurrentOrderNumber();

    const deliveryOrderNumber = document.getElementById("deliveryOrderNumber");
    if (deliveryOrderNumber) {
        deliveryOrderNumber.value = "";
    }

    const deliveryFeeInput = document.getElementById("deliveryFeeInput");
    if (deliveryFeeInput) {
        deliveryFeeInput.value = "0";
    }
    updateTotal();
}


/* ================= SEND TO KITCHEN ================= */

function sendKitchen() {

    if (cart.length === 0) {

        alert("Please add items to the order first.");

        return;
    }

    const order = {
        id: `#${nextOrderNumber}`,
        createdAt: new Date().toISOString(),
        type: getCurrentOrderTypeLabel(),
        table: document.querySelector(".table-select select")?.value || "—",
        items: cart.map(item => ({ ...item })),
        deliveryFee: getDeliveryFee(),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0) + (getDeliveryFee() || 0),
        status: "New",
        deliveryChannel: document.querySelector(".type-btn.active")?.dataset.orderType === "delivery" ? selectedDeliveryChannel : null,
        deliveryOrderNumber: document.querySelector(".type-btn.active")?.dataset.orderType === "delivery" ? document.getElementById("deliveryOrderNumber")?.value.trim() : null
    };

    addKitchenOrder(order);
    addOrderToOrders(order);

    nextOrderNumber += 1;
    saveNextOrderNumber();
    resetCurrentOrder();

    alert(`Order ${order.id} has been sent to the kitchen!`);

}


function addKitchenOrder(order, persist = true) {

    const kitchenOrders = getKitchenContainer(order.status || "Preparing");

    if (!kitchenOrders) {
        return;
    }

    pendingKitchenOrders[order.id] = order;

    if (persist) {
        persistKitchenOrder(order);
    }

    const card = document.createElement("div");

    card.className = "kitchen-card";
    card.dataset.orderId = order.id;
    card.orderData = order;

    card.innerHTML = `
        <div class="kitchen-card-header">
            <div>
                <strong>${order.id}</strong>
                <span>${order.table}</span>
                ${order.deliveryChannel ? `<span>${order.deliveryChannel} #${order.deliveryOrderNumber}</span>` : ""}
            </div>
            <small>Just now</small>
        </div>

        <div class="kitchen-items">
            ${order.items.map(item => `<p><b>${item.quantity}×</b> ${item.name}</p>`).join("")}
        </div>

        <button class="${order.status === "New" ? "accept-btn" : order.status === "Preparing" ? "ready-btn" : "served-btn"}">${order.status === "New" ? "Accept Order" : order.status === "Preparing" ? "Mark as Ready" : order.deliveryChannel ? (order.status === "Out for Delivery" ? "Mark as Delivered" : "Dispatch Order") : "Mark as Served"}</button>
    `;

    kitchenOrders.prepend(card);
    updateKitchenCounts();
}


function addOrderToOrders(order, persist = true) {

    const ordersTableBody = document.getElementById("ordersTableBody");

    if (!ordersTableBody || ordersTableBody.querySelector(`[data-order-id="${order.id}"]`)) {
        return;
    }

    const row = document.createElement("tr");
    const productSummary = order.items.map(item => `${item.quantity}x ${item.name}`).join(", ");

    row.dataset.orderId = order.id;
    row.orderData = order;
    row.innerHTML = `
        <td><strong>${order.id}</strong></td>
        <td>${order.type}</td>
        <td>${order.deliveryChannel ? `${order.deliveryChannel} #${order.deliveryOrderNumber}` : order.table}</td>
        <td>${productSummary}</td>
        <td>₱${order.total.toFixed(2)}</td>
        <td><span class="status ${(order.status || "Preparing").toLowerCase().replaceAll(" ", "-")}">${order.status || "Preparing"}</span></td>
        <td><button class="small-btn orders-view-btn" type="button">View</button></td>
    `;

    ordersTableBody.prepend(row);
    if (persist) {
        writeStoredData("foodHubOrderHistoryCleared", false);
        persistOrder(order);
        addAppNotification({
            title: "New order received",
            message: `${order.id} is ready for the kitchen.`,
            target: "kitchen",
            type: "order-alert",
            key: `order:${order.id}`
        });
    }
    updateTotalOrders();
    updateSalesReports();
    updateDashboard();
    filterOrders();
}

function openOrderView(row) {
    const cells = row.cells;
    const order = row.orderData;
    const productSummary = order
        ? order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")
        : cells[3]?.textContent.trim() || "—";
    const details = {
        number: order?.id || cells[0]?.textContent.trim() || "—",
        type: order?.type || cells[1]?.textContent.trim() || "—",
        table: order?.table || cells[2]?.textContent.trim() || "—",
        products: productSummary,
        total: order ? `₱${order.total.toFixed(2)}` : cells[4]?.textContent.trim() || "—",
        payment: order?.paymentMethod || "—",
        status: cells[5]?.textContent.trim() || "—"
    };

    document.getElementById("orderViewContent").innerHTML = `
        <div class="order-view-row"><span>Order</span><strong>${details.number}</strong></div>
        <div class="order-view-row"><span>Type</span><strong>${details.type}</strong></div>
        <div class="order-view-row"><span>Table / Delivery</span><strong>${details.table}</strong></div>
        <div class="order-view-row"><span>Products</span><strong>${details.products}</strong></div>
        <div class="order-view-row"><span>Total</span><strong>${details.total}</strong></div>
        <div class="order-view-row"><span>Payment</span><strong>${details.payment}</strong></div>
        <div class="order-view-row"><span>Status</span><strong>${details.status}</strong></div>
    `;

    const modal = document.getElementById("orderViewModal");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
}

function closeOrderView() {
    const modal = document.getElementById("orderViewModal");

    if (modal) {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
    }
}


/* ================= ORDER TYPE BUTTONS ================= */

const typeButtons =
    document.querySelectorAll(".type-btn");

function syncOrderSettingStates() {
    const settingMap = {
        dinein: document.querySelector('input[data-setting="dinein"]'),
        takeout: document.querySelector('input[data-setting="takeout"]'),
        delivery: document.querySelector('input[data-setting="delivery"]'),
        foodpanda: document.querySelector('input[data-setting="foodpanda"]'),
        grabfood: document.querySelector('input[data-setting="grabfood"]')
    };

    const deliveryPlatformAvailable = settingMap.foodpanda?.checked || settingMap.grabfood?.checked;

    typeButtons.forEach(button => {
        const type = button.dataset.orderType;
        const isEnabled = !settingMap[type] || (type === "delivery"
            ? settingMap[type].checked && (deliveryPlatformAvailable || (!settingMap.foodpanda && !settingMap.grabfood))
            : settingMap[type].checked);

        button.disabled = !isEnabled;
        button.classList.toggle("disabled-order-type", !isEnabled);
        button.setAttribute("aria-disabled", String(!isEnabled));
    });

    const activeButton = document.querySelector(".type-btn.active");

    if (activeButton && activeButton.disabled) {
        const firstEnabledButton = Array.from(typeButtons).find(button => !button.disabled);

        if (firstEnabledButton) {
            typeButtons.forEach(btn => btn.classList.remove("active"));
            firstEnabledButton.classList.add("active");
        }
    }

    updateDeliveryChannelVisibility();
}

function syncCheckboxVisualState(checkbox) {
    const row = checkbox.closest(".toggle-row");

    if (!row) {
        return;
    }

    row.classList.toggle("disabled", !checkbox.checked);
}

function getSettingKey(checkbox) {
    return checkbox.dataset.setting || checkbox.closest(".toggle-row")?.querySelector("span")?.textContent.trim();
}

function restoreSettings() {
    const savedSettings = readStoredData("foodHubSettings");
    const checkboxes = document.querySelectorAll('#settings .toggle-row input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        checkbox.checked = checkbox.defaultChecked;
    });

    if (savedSettings && typeof savedSettings === "object") {
        checkboxes.forEach(checkbox => {
            const key = getSettingKey(checkbox);

            if (key in savedSettings) {
                checkbox.checked = savedSettings[key];
            }
        });
    }
}

function saveSettings() {
    const settings = {};

    document.querySelectorAll('#settings .toggle-row input[type="checkbox"]').forEach(checkbox => {
        const key = getSettingKey(checkbox);

        if (key) {
            settings[key] = checkbox.checked;
        }
    });

    writeStoredData("foodHubSettings", settings);
    settingsCheckboxes.forEach(syncCheckboxVisualState);
    syncOrderSettingStates();

    const saveButton = document.querySelector("#settings .settings-header .primary-btn");
    if (saveButton) {
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fa-solid fa-check"></i> Saved';
        setTimeout(() => {
            saveButton.innerHTML = originalText;
        }, 1400);
    }

    const toast = document.getElementById("settingsSavedToast");
    if (toast) {
        toast.classList.remove("hidden");
        setTimeout(() => toast.classList.add("hidden"), 2400);
    }
}

restoreSettings();
const settingsCheckboxes = document.querySelectorAll('.toggle-row input[type="checkbox"]');
settingsCheckboxes.forEach(checkbox => {
    syncCheckboxVisualState(checkbox);
    checkbox.addEventListener("change", () => {
        syncCheckboxVisualState(checkbox);
        syncOrderSettingStates();
    });
});

typeButtons.forEach(button => {

    button.addEventListener("click", function () {

        if (this.disabled) {
            return;
        }

        typeButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");
        updateDeliveryChannelVisibility();

    });

});

const deliveryChannelSelect = document.getElementById("deliveryChannelSelect");
if (deliveryChannelSelect) {
    deliveryChannelSelect.addEventListener("change", function () {
        selectedDeliveryChannel = this.value || "Grab";
    });
}

document.getElementById("deliveryFeeInput")?.addEventListener("input", updateTotal);

updateDeliveryChannelVisibility();

syncOrderSettingStates();


/* ================= CATEGORY BUTTONS ================= */

function filterProductCards(container, query) {
    if (!container) {
        return;
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cards = Array.from(container.querySelectorAll(".food-card"));
    let visibleCards = 0;

    cards.forEach(card => {
        const searchableText = card.textContent.toLowerCase();
        const matches = !normalizedQuery || searchableText.includes(normalizedQuery);

        card.style.display = matches ? "" : "none";
        if (matches) {
            visibleCards++;
        }
    });

    let emptyState = container.querySelector(".product-search-empty");

    if (!visibleCards && normalizedQuery) {
        if (!emptyState) {
            emptyState = document.createElement("div");
            emptyState.className = "product-search-empty";
            container.appendChild(emptyState);
        }

        emptyState.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i><strong>No products found</strong><span>Try a different name or description.</span>`;
    } else if (emptyState) {
        emptyState.remove();
    }
}

const posProductSearch = document.getElementById("posProductSearch");
const productManagementSearch = document.getElementById("productManagementSearch");
const inventorySearch = document.getElementById("inventorySearch");
let activeProductCategory = "All";

function filterInventoryRows(query = "") {
    const normalizedQuery = query.trim().toLowerCase();
    const tableBody = document.getElementById("inventoryTableBody");

    if (!tableBody) {
        return;
    }

    let categoryHasMatch = false;
    let categoryRow = null;

    Array.from(tableBody.children).forEach(row => {
        if (row.classList.contains("inventory-category-row")) {
            if (categoryRow) {
                categoryRow.style.display = categoryHasMatch ? "" : "none";
            }

            categoryRow = row;
            categoryHasMatch = false;
            return;
        }

        const matches = !normalizedQuery || row.textContent.toLowerCase().includes(normalizedQuery);
        row.style.display = matches ? "" : "none";
        categoryHasMatch ||= matches;
    });

    if (categoryRow) {
        categoryRow.style.display = categoryHasMatch ? "" : "none";
    }
}

function filterPosProducts() {
    const container = document.querySelector("#pos .food-grid");
    const query = posProductSearch?.value.trim().toLowerCase() || "";

    if (!container) {
        return;
    }

    container.querySelectorAll(".food-card").forEach(card => {
        const categoryMatches = activeProductCategory === "All" || card.dataset.productCategory === activeProductCategory;
        const queryMatches = !query || card.textContent.toLowerCase().includes(query);
        card.style.display = categoryMatches && queryMatches ? "" : "none";
    });
}

if (posProductSearch) {
    posProductSearch.addEventListener("input", event => {
        filterPosProducts();
    });
}

if (productManagementSearch) {
    productManagementSearch.addEventListener("input", event => {
        filterProductCards(document.querySelector(".product-management"), event.target.value);
    });
}

if (inventorySearch) {
    inventorySearch.addEventListener("input", event => {
        filterInventoryRows(event.target.value);
    });
}

const categories =
    document.querySelectorAll(".category");

categories.forEach(category => {

    category.addEventListener("click", function () {

        categories.forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");
        activeProductCategory = this.textContent.trim();
        filterPosProducts();

    });

});

/* ================= ORDER FILTER ================= */

const orderFilter = document.querySelector(".filter");

function filterOrders() {
    const ordersTableBody = document.getElementById("ordersTableBody");

    if (!orderFilter || !ordersTableBody) {
        return;
    }

    const selectedStatus = orderFilter.value.toLowerCase();

    ordersTableBody.querySelectorAll("tr").forEach(row => {
        const rowStatus = row.querySelector(".status")?.textContent.trim().toLowerCase() || "";
        const showRow = selectedStatus === "all orders" || rowStatus === selectedStatus;

        row.style.display = showRow ? "" : "none";
    });
}

if (orderFilter) {
    orderFilter.addEventListener("change", filterOrders);
}


/* ================= PAYMENT MODAL ================= */

document.addEventListener("click", function(event) {
    const viewButton = event.target.closest(".orders-view-btn");

    if (viewButton) {
        const row = viewButton.closest("tr");

        if (row) {
            openOrderView(row);
        }
    }

    if (event.target.id === "orderViewModal") {
        closeOrderView();
    }

    const paymentOption = event.target.closest(".payment-option");

    if (paymentOption) {
        document.querySelectorAll(".payment-option").forEach(option => {
            option.classList.remove("active");
        });

        paymentOption.classList.add("active");
        selectedPaymentMethod = paymentOption.dataset.payment || "Cash";
    }

    if (event.target.id === "paymentModal") {
        closePaymentModal();
    }

    if (event.target.id === "confirmPaymentBtn") {
        confirmPayment();
    }
});

/* ================= KITCHEN BUTTONS ================= */

document.addEventListener("click", function(event) {

    if (event.target.classList.contains("accept-btn")) {

        const kitchenCard = event.target.closest(".kitchen-card");
        const orderId = kitchenCard?.dataset.orderId;
        const pendingOrder = kitchenCard?.orderData || (orderId && pendingKitchenOrders[orderId]);

        if (pendingOrder) {
            pendingOrder.status = "Preparing";
            addOrderToOrders(pendingOrder);
        }

        if (orderId) {
            updateOrderStatus(orderId, "Preparing");
        }

        event.target.textContent = "Order Accepted";
        event.target.style.background = "#3ca56c";

        setTimeout(() => {
            event.target.textContent = "Preparing";
            event.target.style.background = "";
        }, 1000);

    } else if (event.target.classList.contains("ready-btn")) {

        const kitchenCard = event.target.closest(".kitchen-card");
        const orderId = kitchenCard?.dataset.orderId;
        const order = kitchenCard?.orderData;
        const nextStatus = order?.deliveryChannel ? "Ready for Dispatch" : "Ready for Pickup";

        if (orderId) {
            updateOrderStatus(orderId, nextStatus);
        }

        event.target.textContent = order?.deliveryChannel ? "Ready for Dispatch" : "Order Ready";
        event.target.style.background = "#3ca56c";

    } else if (event.target.classList.contains("served-btn")) {

        const kitchenCard = event.target.closest(".kitchen-card");
        const orderId = kitchenCard?.dataset.orderId;
        const order = kitchenCard?.orderData;

        if (orderId) {
            if (order?.deliveryChannel && order.status === "Ready for Dispatch") {
                updateOrderStatus(orderId, "Out for Delivery");
                event.target.textContent = "Out for Delivery";
                event.target.style.background = "#3ca56c";
            } else if (order?.deliveryChannel && order.status === "Out for Delivery") {
                updateOrderStatus(orderId, "Delivered");
                event.target.textContent = "Delivered";
                event.target.style.background = "#777";
            } else {
                updateOrderStatus(orderId, "Completed");
                event.target.textContent = "Served";
                event.target.style.background = "#777";
            }
        }
    }
});

window.refreshPOSFromBackend = async function () {
    const remoteOrderNumber = Number.parseInt(readStoredData("foodHubNextOrderNumber"), 10);
    nextOrderNumber = Number.isInteger(remoteOrderNumber) && remoteOrderNumber >= 1029
        ? remoteOrderNumber
        : 1029;

    restoreRestaurantLogo();

    await restoreProducts();
    await restoreInventory();
    restoreSettings();
    settingsCheckboxes.forEach(syncCheckboxVisualState);
    syncOrderSettingStates();
    renderStaff();
    updateVisibleAccount();

    const loadedRemoteOrders = await loadRelationalOrders();

    // The authentication session is already active at this point.
    // Push the existing browser data into the relational tables so that
    // previously working POS data is not left only in localStorage.
    await syncAllLocalDataToBackend();

    removeOrderHistoryFromView();
    if (loadedRemoteOrders) {
        restoreOrders();
        restoreKitchenOrders();
    } else {
        restoreOrders();
        restoreKitchenOrders();
    }
    restoreOrderStatuses();
    updateInventoryStats();
    updateTotalOrders();
    updateSalesReports();
    updateKitchenCounts();
    updateDashboard();
    updateCurrentOrderNumber();
};

renderNotifications();
void restoreProducts();
void restoreInventory();
renderStaff();
updateVisibleAccount();
removeOrderHistoryFromView();
restoreOrders();
restoreKitchenOrders();
restoreOrderStatuses();
updateInventoryStats();
updateTotalOrders();
updateSalesReports();
updateKitchenCounts();
updateDashboard();