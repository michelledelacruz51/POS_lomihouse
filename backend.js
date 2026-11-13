(() => {
    // =========================================================
    // EXISTING DATA KEYS
    // =========================================================

    // =========================================================
    // INTERNAL STATE
    // =========================================================

    const ownerKey = "foodHubBackendUserId";

    let accessToken = "";


    // =========================================================
    // FLASK REQUEST HELPER
    // =========================================================

    async function request(path, token, options = {}) {
        const response = await fetch(`/api${path}`, {
            ...options,

            headers: {
                Authorization: `Bearer ${token}`,

                ...(options.body
                    ? {
                        "Content-Type":
                            "application/json"
                    }
                    : {}),

                ...options.headers
            }
        });


        if (!response.ok) {
            let detail =
                response.statusText ||
                "Request failed";


            try {
                const body =
                    await response.json();

                const errorDetail = body.detail;
                const message = typeof errorDetail === "string"
                    ? errorDetail
                    : errorDetail?.message ||
                        errorDetail?.detail ||
                        JSON.stringify(errorDetail);
                const context = [
                    body.details,
                    body.hint,
                    body.code
                ].filter(Boolean);

                detail = [
                    message || detail,
                    ...context
                ].join(" — ");

            } catch {
                detail = response.statusText ||
                    "The server returned an unreadable error response.";
            }


            throw new Error(detail);
        }


        if (response.status === 204) {
            return null;
        }


        return response.json();
    }


    // =========================================================
    // CLEAR SESSION
    // =========================================================

    function clear() {
        accessToken = "";
    }


    // =========================================================
    // SET ACCESS TOKEN
    // =========================================================

    function setAccessToken(token) {
        accessToken = token || "";
    }


    // =========================================================
    // LOAD DATA
    // =========================================================
    async function load(
        userId,
        token,
        isCurrent = () => true
    ) {

        if (!isCurrent()) {
            return false;
        }

        const previousOwner =
            localStorage.getItem(
                ownerKey
            );

        if (
            previousOwner &&
            previousOwner !== userId
        ) {
            [
                "foodHubOrders",
                "foodHubOrderStatuses",
                "foodHubKitchenOrders",
                "foodHubProducts",
                "foodHubInventory",
                "foodHubSettings",
                "foodHubStaff",
                "foodHubRestaurantLogo",
                "foodHubNextOrderNumber",
                "foodHubOrderHistoryCleared"
            ].forEach(key => {
                localStorage.removeItem(key);
            });
        }


        localStorage.setItem(
            ownerKey,
            userId
        );


        return isCurrent();
    }


    // =========================================================
    // RELATIONAL API HELPERS
    // =========================================================


    async function getProducts() {
        if (!accessToken) {
            return [];
        }

        return request(
            "/products",
            accessToken
        );
    }


    async function createProduct(product) {
        if (!accessToken) {
            return null;
        }

        return request(
            "/products",
            accessToken,
            {
                method: "POST",
                body: JSON.stringify(product)
            }
        );
    }


    async function updateProduct(
        productId,
        product
    ) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/products/${productId}`,
            accessToken,
            {
                method: "PUT",
                body: JSON.stringify(product)
            }
        );
    }


    async function deleteProduct(productId) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/products/${productId}`,
            accessToken,
            {
                method: "DELETE"
            }
        );
    }


    // =========================================================
    // INVENTORY
    // =========================================================

    async function getInventory() {
        if (!accessToken) {
            return [];
        }

        return request(
            "/inventory",
            accessToken
        );
    }


    async function createInventory(
        inventory
    ) {
        if (!accessToken) {
            return null;
        }

        return request(
            "/inventory",
            accessToken,
            {
                method: "POST",
                body: JSON.stringify(
                    inventory
                )
            }
        );
    }

    async function deductOrderInventory(orderId) {
        if (!accessToken) {
            throw new Error("You are not authenticated.");
        }

        return request(
            `/orders/${orderId}/deduct-inventory`,
            accessToken,
            {
                method: "POST"
            }
        );
    }

    async function updateInventory(
        inventoryId,
        inventory
    ) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/inventory/${inventoryId}`,
            accessToken,
            {
                method: "PUT",
                body: JSON.stringify(
                    inventory
                )
            }
        );
    }

    // =========================================================
    // ORDERS
    // =========================================================

    async function getOrders() {
        if (!accessToken) {
            return [];
        }

        return request(
            "/orders",
            accessToken
        );
    }


    async function createOrder(order) {
        if (!accessToken) {
            return null;
        }

        return request(
            "/orders",
            accessToken,
            {
                method: "POST",
                body: JSON.stringify(order)
            }
        );
    }


    async function updateOrder(
        orderId,
        order
    ) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/orders/${orderId}`,
            accessToken,
            {
                method: "PUT",
                body: JSON.stringify(order)
            }
        );
    }


    // =========================================================
    // ORDER ITEMS
    // =========================================================

    async function getOrderItems(
        orderId
    ) {
        if (!accessToken) {
            return [];
        }

        return request(
            `/orders/${orderId}/items`,
            accessToken
        );
    }


    async function addOrderItem(
        orderId,
        item
    ) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/orders/${orderId}/items`,
            accessToken,
            {
                method: "POST",
                body: JSON.stringify(item)
            }
        );
    }

    async function deleteOrderItems(orderId) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/orders/${orderId}/items`,
            accessToken,
            {
                method: "DELETE"
            }
        );
    }


    // =========================================================
    // PAYMENTS
    // =========================================================

    async function getPayments(
        orderId
    ) {
        if (!accessToken) {
            return [];
        }

        return request(
            `/orders/${orderId}/payments`,
            accessToken
        );
    }


    async function createPayment(
        orderId,
        payment
    ) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/orders/${orderId}/payments`,
            accessToken,
            {
                method: "POST",
                body: JSON.stringify(
                    payment
                )
            }
        );
    }


    // =========================================================
    // KITCHEN
    // =========================================================

    async function getKitchenOrders() {
        if (!accessToken) {
            return [];
        }

        return request(
            "/kitchen",
            accessToken
        );
    }


    async function createKitchenOrder(
        kitchenOrder
    ) {
        if (!accessToken) {
            return null;
        }

        return request(
            "/kitchen",
            accessToken,
            {
                method: "POST",
                body: JSON.stringify(
                    kitchenOrder
                )
            }
        );
    }


    async function updateKitchenOrder(
        kitchenId,
        kitchenOrder
    ) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/kitchen/${kitchenId}`,
            accessToken,
            {
                method: "PUT",
                body: JSON.stringify(
                    kitchenOrder
                )
            }
        );
    }


    // =========================================================
    // STAFF
    // =========================================================

    async function getStaff() {
        if (!accessToken) {
            return [];
        }

        return request(
            "/staff",
            accessToken
        );
    }


    async function createStaff(
        staff
    ) {
        if (!accessToken) {
            return null;
        }

        return request(
            "/staff",
            accessToken,
            {
                method: "POST",
                body: JSON.stringify(staff)
            }
        );
    }

    async function updateStaff(staffId, staff) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/staff/${staffId}`,
            accessToken,
            {
                method: "PUT",
                body: JSON.stringify(staff)
            }
        );
    }

    async function deleteStaff(staffId) {
        if (!accessToken) {
            return null;
        }

        return request(
            `/staff/${staffId}`,
            accessToken,
            {
                method: "DELETE"
            }
        );
    }


    // =========================================================
    // PUBLIC API
    // =========================================================

    window.posBackend = {

        // Existing functions
        clear,
        load,
        setAccessToken,

        // Products
        getProducts,
        createProduct,
        updateProduct,
        deleteProduct,

        // Inventory
        getInventory,
        createInventory,
        updateInventory,

        // Orders
        getOrders,
        createOrder,
        updateOrder,

        // Order items
        getOrderItems,
        addOrderItem,
        deleteOrderItems,

        // Payments
        getPayments,
        createPayment,

        // Kitchen
        getKitchenOrders,
        createKitchenOrder,
        updateKitchenOrder,

        // Staff
        getStaff,
        createStaff,
        updateStaff,
        deleteStaff,

        // Inventory deduction
        deductOrderInventory
    };
})();