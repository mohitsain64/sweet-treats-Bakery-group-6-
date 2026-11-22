const API_URL = "/api";

// 1. Verify Admin Authentication
async function verifyAdmin() {
    const token = sessionStorage.getItem("adminToken");

    if (!token) {
        window.location.replace("/admin-login.html");
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();
        // Update Total Orders Counter
        const totalOrdersElement = document.getElementById("totalOrders");

        if (totalOrdersElement) {
            totalOrdersElement.textContent = data.totalOrders;
        }


        if (!response.ok || data.user?.role !== "admin") {
            sessionStorage.removeItem("adminToken");
            window.location.replace("/admin-login.html");
            return false;
        }

        return true;

    } catch (error) {
        console.error("Authentication error:", error);
        window.location.replace("/admin-login.html");
        return false;
    }
}

// 2. Load Products
async function loadAdminProducts() {
    const container = document.getElementById("productsContainer");

    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();




        if (!response.ok || !data.success) {
            throw new Error("Products could not be loaded");
        }

        const products = data.products || [];

        document.getElementById("totalProducts").textContent =
            data.count ?? products.length;

        if (!products.length) {
            container.innerHTML = "<p>No products found.</p>";
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => {
            const price = product.variants?.[0]?.price ?? 0;
            const category = Array.isArray(product.category)
                ? product.category.join(", ")
                : product.category || "-";

            return `
                            <tr>
                                <td>${escapeHTML(product.name)}</td>
                                <td>${escapeHTML(category)}</td>
                                <td>₹${Number(price).toLocaleString("en-IN")}</td>
                                <td>${product.isAvailable ? "Available" : "Unavailable"}</td>
                                <td>
                                    <button onclick="editProduct('${product._id}')">Edit</button>
                                    <button onclick="deleteProduct('${product._id}')">Delete</button>
                                </td>
                            </tr>
                        `;
        }).join("")}
                </tbody>
            </table>
        `;

    } catch (error) {
        container.textContent = error.message;
        console.error(error);
    }
}

// 3. Escape HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// 4. Edit Product (Coming next)
// EDIT EXISTING CAKE
async function editProduct(id) {

    const token = sessionStorage.getItem("adminToken");

    try {
        // Fetch existing product
        const response = await fetch(`/api/products/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Unable to load product details");
        }

        const product = data.product;

        const variant = product.variants?.[0] || {};

        const modal = document.createElement("div");
        modal.id = "productModal";

        modal.innerHTML = `
                    <div class="product-modal-card">

                        <div class="modal-heading">
                            <div>
                                <h2>Edit Your Creation ✨</h2>
                                <p>Refine your cake details and keep your menu delightful.</p>
                            </div>

                            <button type="button" id="closeModal">✕</button>
                        </div>

                        <form id="editProductForm">

                            <div class="edit-image-panel">
                                <img id="editImagePreview"
                                    src="${escapeHTML(product.image)}"
                                    alt="Cake preview">

                                <h3>${escapeHTML(product.name)}</h3>

                                <p>Product image preview. Update the image URL to change it.</p>
                            </div>

                            <div class="edit-fields">

                                <label>PRODUCT NAME</label>
                                <input id="editName"
                                    value="${escapeHTML(product.name)}" required>

                                <label>DESCRIPTION</label>
                                <textarea id="editDescription">${escapeHTML(product.description || "")}</textarea>

                                <label>CATEGORY</label>
                                <input id="editCategory"
                                    value="${escapeHTML(Array.isArray(product.category) ? product.category.join(", ") : product.category)}"
                                    required>

                                <label>IMAGE URL</label>
                                <input type="url" id="editImage"
                                    value="${escapeHTML(product.image)}" required>

                                <label>PRODUCT BADGE</label>
                                <input id="editBadge"
                                    value="${escapeHTML(product.badge || "")}">

                                <div class="modal-row">

                                    <div>
                                        <label>CAKE VARIANT</label>
                                        <input id="editVariant"
                                            value="${escapeHTML(variant.label || "")}" required>
                                    </div>

                                    <div>
                                        <label>SELLING PRICE (₹)</label>
                                        <input type="number" id="editPrice"
                                            value="${Number(variant.price || 0)}"
                                            min="1" required>
                                    </div>

                                </div>

                                <label>OLD PRICE (OPTIONAL)</label>
                                <input type="number" id="editOldPrice"
                                    value="${variant.oldPrice ?? ""}" min="1">

                                <button type="submit" id="updateCakeBtn">
                                    ✨ Save Changes
                                </button>

                            </div>

                        </form>
                    </div>
                `;

        document.body.appendChild(modal);

        document.getElementById("closeModal").onclick = () => {
            modal.remove();
        };
        document.getElementById("editImage").addEventListener("input", (e) => {
            document.getElementById("editImagePreview").src = e.target.value;
        });

        document.getElementById("editProductForm").onsubmit =
            async (event) => {

                event.preventDefault();

                const oldPrice = document.getElementById("editOldPrice").value;

                const updatedProduct = {
                    name: document.getElementById("editName").value.trim(),

                    description: document.getElementById("editDescription").value.trim(),

                    category: document.getElementById("editCategory").value
                        .split(",")
                        .map(item => item.trim().toLowerCase())
                        .filter(Boolean),

                    image: document.getElementById("editImage").value.trim(),

                    badge: document.getElementById("editBadge").value.trim(),

                    variants: [{
                        label: document.getElementById("editVariant").value.trim(),
                        price: Number(document.getElementById("editPrice").value),
                        oldPrice: oldPrice ? Number(oldPrice) : null
                    }]
                };

                const updateBtn = document.getElementById("updateCakeBtn");
                updateBtn.disabled = true;
                updateBtn.textContent = "Updating...";

                try {
                    const updateResponse = await fetch(`/api/products/${id}`, {
                        method: "PUT",

                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },

                        body: JSON.stringify(updatedProduct)
                    });

                    const result = await updateResponse.json();

                    if (!updateResponse.ok) {
                        throw new Error(result.message || "Update failed");
                    }

                    alert("Cake updated successfully! 🎂");

                    modal.remove();
                    loadAdminProducts();

                } catch (error) {
                    alert(error.message);
                    updateBtn.disabled = false;
                    updateBtn.textContent = "Update Cake";
                }
            };

    } catch (error) {
        alert(error.message);
    }
}

// 5. Delete Product
async function deleteProduct(id) {
    const confirmed = confirm("Are you sure you want to delete this cake?");

    if (!confirmed) return;

    const token = sessionStorage.getItem("adminToken");

    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Delete failed");
        }

        alert("Product deleted successfully!");
        loadAdminProducts();

    } catch (error) {
        alert(error.message);
    }
}

// 6. Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    sessionStorage.removeItem("adminToken");
    window.location.replace("/admin-login.html");
});

// 7. Initialize Dashboard
document.addEventListener("DOMContentLoaded", async () => {
    const isAdmin = await verifyAdmin();

    if (isAdmin) {
        loadAdminProducts();
        await loadAdminOrders();
        await loadAdminCustomers();
    }
});
// ADD NEW CAKE MODAL

document.getElementById("addProductBtn")?.addEventListener("click", () => {

    const modal = document.createElement("div");

    modal.id = "productModal";

    modal.innerHTML = `
        <div class="product-modal-card">

            <div class="modal-heading">
                <div>
                    <h2>Add New Cake</h2>
                    <p>Add a delicious product to your bakery.</p>
                </div>

                <button type="button" id="closeModal">✕</button>
            </div>

            <form id="addProductForm">

                <label>Cake Name</label>
                <input type="text" id="cakeName" required
                    placeholder="Chocolate Truffle Cake">

                <label>Description</label>
                <textarea id="cakeDescription"
                    placeholder="Describe your delicious cake..."></textarea>

                <label>Category</label>
                <input type="text" id="cakeCategory" required
                    placeholder="chocolate, cakes">

                <label>Image URL</label>
                <input type="url" id="cakeImage" required
                    placeholder="https://example.com/cake.jpg">

                <label>Badge</label>
                <input type="text" id="cakeBadge"
                    placeholder="Bestseller / Seasonal">

                <div class="modal-row">
                    <div>
                        <label>Variant</label>
                        <input type="text" id="cakeVariant"
                            placeholder="1 kg" required>
                    </div>

                    <div>
                        <label>Price (₹)</label>
                        <input type="number" id="cakePrice"
                            min="1" required>
                    </div>
                </div>

                <label>Old Price (Optional)</label>
                <input type="number" id="cakeOldPrice"
                    min="1" placeholder="Optional">

                <button type="submit" id="saveCakeBtn">
                    Save Cake
                </button>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeModal").onclick = () => {
        modal.remove();
    };

    modal.addEventListener("click", (event) => {
        if (event.target === modal) modal.remove();
    });

    document.getElementById("addProductForm").onsubmit =
        saveNewCake;
});


// SAVE CAKE TO MONGODB

async function saveNewCake(event) {

    event.preventDefault();

    const token = sessionStorage.getItem("adminToken");
    const saveBtn = document.getElementById("saveCakeBtn");

    const oldPrice = document.getElementById("cakeOldPrice").value;

    const product = {
        name: document.getElementById("cakeName").value.trim(),

        description: document.getElementById("cakeDescription").value.trim(),

        category: document.getElementById("cakeCategory").value
            .split(",")
            .map(item => item.trim().toLowerCase())
            .filter(Boolean),

        image: document.getElementById("cakeImage").value.trim(),

        badge: document.getElementById("cakeBadge").value.trim(),

        variants: [{
            label: document.getElementById("cakeVariant").value.trim(),
            price: Number(document.getElementById("cakePrice").value),
            oldPrice: oldPrice ? Number(oldPrice) : null
        }],

        isAvailable: true
    };

    if (!product.category.length || !product.name ||
        !product.image || !product.variants[0].label ||
        !Number.isFinite(product.variants[0].price) ||
        product.variants[0].price <= 0) {
        alert("Please enter valid product details.");
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {

        const response = await fetch("/api/products", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify(product)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not add cake");
        }

        alert("Cake added successfully! 🎂");

        document.getElementById("productModal").remove();

        loadAdminProducts();

    } catch (error) {

        alert(error.message);

        saveBtn.disabled = false;
        saveBtn.textContent = "Save Cake";
    }
}
// LOAD ALL CUSTOMER ORDERS
async function loadAdminOrders() {
    const token = sessionStorage.getItem("adminToken");
    const container = document.getElementById("ordersContainer");

    try {
        const response = await fetch("/api/orders", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();
        // Update Total Orders Counter
        const totalOrdersElement = document.getElementById("totalOrders");

        if (totalOrdersElement) {
            totalOrdersElement.textContent = data.totalOrders;
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to load orders");
        }

        if (data.orders.length === 0) {
            container.innerHTML = "<p>No orders found.</p>";
            return;
        }

        container.innerHTML = `
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Items</th>
                        <th>Total Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.orders.map(order => `
                        <tr>
                            <td>${escapeHTML(order._id.slice(-6))}</td>
                            <td>${escapeHTML(order.customer.name)}</td>
                            <td>${escapeHTML(order.customer.phone)}</td>
                            <td>${order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                            <td>₹${order.totalAmount}</td>
                            <td>${escapeHTML(order.paymentStatus)}</td>
                            <td>
                                    <select class="order-status-select"
                                            data-order-id="${escapeHTML(order._id)}">
                                                                ${[
                "Pending",
                "Confirmed",
                "Preparing",
                "Out for Delivery",
                "Delivered",
                "Cancelled"
            ].map(status => `
                                                            <option value="${status}"
                                                                ${order.orderStatus === status ? "selected" : ""}>
                                                                ${status}
                                                            </option>
                                                        `).join("")}
                                                    </select>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
        container.querySelectorAll(".order-status-select").forEach(select => {
            select.addEventListener("change", () => {
                updateOrderStatus(select.dataset.orderId, select.value);
            });
        });

    } catch (error) {
        console.error("Orders Error:", error);
        container.innerHTML = "<p>Unable to load orders.</p>";

    }
}
// UPDATE ORDER STATUS
async function updateOrderStatus(orderId, status) {
    const token = sessionStorage.getItem("adminToken");

    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Status update failed");
        }

        alert("Order status updated successfully!");

    } catch (error) {
        alert(error.message);
        loadAdminOrders();
    }
}
// LOAD ALL CUSTOMERS
async function loadAdminCustomers() {
    const token = sessionStorage.getItem("adminToken");
    const container = document.getElementById("customersContainer");

    try {
        const response = await fetch("/api/auth/customers", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load customers");
        }

        // Update Total Customers Counter
        const totalCustomersElement =
            document.getElementById("totalCustomers");

        if (totalCustomersElement) {
            totalCustomersElement.textContent = data.totalCustomers;
        }

        if (data.customers.length === 0) {
            container.innerHTML = "<p>No customers registered yet.</p>";
            return;
        }

        container.innerHTML = `
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile Number</th>
                        <th>Role</th>
                        <th>Registered On</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.customers.map(customer => `
                        <tr>
                            <td>${escapeHTML(customer.name)}</td>
                            <td>${escapeHTML(customer.email)}</td>
                            <td>${escapeHTML(customer.phone || "Not provided")}</td>
                            <td>${escapeHTML(customer.role)}</td>
                            <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error("Customers Error:", error);
        container.innerHTML = "<p>Unable to load customers.</p>";
    }
}