const menuGrid = document.querySelector(".products-grid");

const menuSearch = document.getElementById("menuSearch");
const menuSort = document.getElementById("menuSort");
const menuPrice = document.getElementById("menuPrice");
const menuReset = document.getElementById("menuReset");
const menuCount = document.getElementById("menuCount");
const menuEmpty = document.getElementById("menuNoResults");
const menuEmptyReset = document.getElementById("menuEmptyReset");

const menuPills = document.querySelectorAll(".category-pill");

let menuCards = [];
let menuCategory = "all";

// Prevent HTML injection from database values
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Fetch products from MongoDB API
async function loadProducts() {
    try {
        menuGrid.innerHTML = "<p>Loading products...</p>";

        const response = await fetch("/api/products");
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Unable to load products");
        }

        // Create cards from database products
        menuGrid.innerHTML = data.products.map(product => {

            const categories = Array.isArray(product.category)
                ? product.category
                : [product.category];

            const variants = product.variants || [];
            const firstVariant = variants[0] || {};

            const price = firstVariant.price || 0;
            const oldPrice = firstVariant.oldPrice;

            const discount = oldPrice && oldPrice > price
                ? Math.round((oldPrice - price) / oldPrice * 100)
                : 0;

            const badge = product.badge
                ? `<span class="card-tag">${escapeHTML(product.badge)}</span>`
                : "";

            return `
                <div class="product-card"
                    data-category="${escapeHTML(categories.join(" ").toLowerCase())}"
                    data-id="${escapeHTML(product._id)}">

                    <div class="product-img-wrapper">

                        ${badge}

                        <button class="fav-btn" aria-label="Add to Wishlist">
                            ♡
                        </button>

                        <img src="${escapeHTML(product.image)}"
                            alt="${escapeHTML(product.name)}">

                    </div>

                    <div class="product-details">

                        <div class="weight-selector">

                            ${variants.map((variant, index) => `
                                <button class="weight-btn ${index === 0 ? "active" : ""}"
                                    data-price="${variant.price}"
                                    data-old-price="${variant.oldPrice || ""}">
                                    ${escapeHTML(variant.label)}
                                </button>
                            `).join("")}

                        </div>

                        <div class="product-title">
                            ${escapeHTML(product.name)}
                        </div>

                        <div class="rating-row">
                            <span class="stars">★★★★★</span>
                            <strong>${product.rating || 0}</strong>
                            (${product.reviewCount || 0})
                        </div>

                        <div class="price-row">

                            <span class="current-price">
                                ₹${price.toLocaleString("en-IN")}
                            </span>

                            <span class="old-price">
                                ${oldPrice ? "₹" + oldPrice.toLocaleString("en-IN") : ""}
                            </span>

                            <span class="discount">
                                ${discount ? discount + "% off" : ""}
                            </span>

                        </div>

                        <button class="add-to-cart-btn">
                            Add to Cart
                        </button>

                    </div>
                </div>
            `;
        }).join("");

        // Get newly created cards
        menuCards = Array.from(
            menuGrid.querySelectorAll(".product-card")
        );

        // Enable weight selection
        menuCards.forEach(card => {

            const weightButtons = card.querySelectorAll(".weight-btn");

            weightButtons.forEach(button => {

                button.addEventListener("click", function () {

                    weightButtons.forEach(btn =>
                        btn.classList.remove("active")
                    );

                    this.classList.add("active");

                    const price = Number(this.dataset.price);
                    const oldPrice = Number(this.dataset.oldPrice);

                    card.querySelector(".current-price").textContent =
                        "₹" + price.toLocaleString("en-IN");

                    card.querySelector(".old-price").textContent =
                        oldPrice ? "₹" + oldPrice.toLocaleString("en-IN") : "";

                    const discount = oldPrice > price
                        ? Math.round((oldPrice - price) / oldPrice * 100)
                        : 0;

                    card.querySelector(".discount").textContent =
                        discount ? discount + "% off" : "";

                    // Update price used by filters
                    card.dataset.basePrice = price;
                });

            });

        });

        // Set initial price and rating
        menuCards.forEach(card => {

            const activeButton = card.querySelector(".weight-btn.active");

            card.dataset.basePrice = activeButton
                ? activeButton.dataset.price
                : 0;

            const rating = card.querySelector(".rating-row strong");

            card.dataset.rating = rating
                ? Number(rating.textContent)
                : 0;

            card.dataset.name = card.querySelector(".product-title")
                .textContent.toLowerCase();

        });

        applyMenuFilters();

    } catch (error) {

        console.error("Product loading error:", error);

        menuGrid.innerHTML =
            "<p>Products could not be loaded. Please try again.</p>";
    }
}


// Apply category, search and price filters
function applyMenuFilters() {

    const text = menuSearch.value.toLowerCase().trim();
    const priceRange = menuPrice.value;

    let shown = 0;

    menuCards.forEach(card => {

        const categories = card.dataset.category.split(" ");
        const price = Number(card.dataset.basePrice);

        let visible = true;

        if (
            menuCategory !== "all" &&
            !categories.includes(menuCategory)
        ) {
            visible = false;
        }

        if (
            text &&
            !card.dataset.name.includes(text)
        ) {
            visible = false;
        }

        if (priceRange === "low" && price >= 500) {
            visible = false;
        }

        if (
            priceRange === "mid" &&
            (price < 500 || price > 1000)
        ) {
            visible = false;
        }

        if (priceRange === "high" && price <= 1000) {
            visible = false;
        }

        card.style.display = visible ? "flex" : "none";

        if (visible) shown++;
    });

    if (menuCount) {
        menuCount.textContent =
            `Showing ${shown} of ${menuCards.length} items`;
    }

    if (menuEmpty) {
        menuEmpty.style.display = shown === 0 ? "block" : "none";
    }
}


// Sort products
function sortMenuCards() {

    const how = menuSort.value;
    const sorted = [...menuCards];

    if (how === "low") {
        sorted.sort((a, b) =>
            Number(a.dataset.basePrice) - Number(b.dataset.basePrice)
        );
    }

    else if (how === "high") {
        sorted.sort((a, b) =>
            Number(b.dataset.basePrice) - Number(a.dataset.basePrice)
        );
    }

    else if (how === "rating") {
        sorted.sort((a, b) =>
            Number(b.dataset.rating) - Number(a.dataset.rating)
        );
    }

    else if (how === "name") {
        sorted.sort((a, b) =>
            a.dataset.name.localeCompare(b.dataset.name)
        );
    }

    sorted.forEach(card => menuGrid.appendChild(card));
}


// Category buttons
menuPills.forEach(pill => {

    pill.addEventListener("click", function () {

        menuPills.forEach(p =>
            p.classList.remove("active")
        );

        this.classList.add("active");

        menuCategory = this.dataset.category;

        applyMenuFilters();
    });

});


// Search
menuSearch.addEventListener("input", applyMenuFilters);


// Price filter
menuPrice.addEventListener("change", applyMenuFilters);


// Sorting
menuSort.addEventListener("change", sortMenuCards);


// Reset filters
function resetMenuFilters() {

    menuSearch.value = "";
    menuPrice.value = "all";
    menuSort.value = "default";

    menuCategory = "all";

    menuPills.forEach(p =>
        p.classList.remove("active")
    );

    const allPill = document.querySelector(
        '.category-pill[data-category="all"]'
    );

    if (allPill) allPill.classList.add("active");

    sortMenuCards();
    applyMenuFilters();
}

menuReset?.addEventListener("click", resetMenuFilters);
menuEmptyReset?.addEventListener("click", resetMenuFilters);


// Load category from URL
const params = new URLSearchParams(window.location.search);
const urlCategory = params.get("category");

if (urlCategory) {

    const pill = document.querySelector(
        `.category-pill[data-category="${urlCategory}"]`
    );

    if (pill) {
        menuCategory = urlCategory;
        pill.classList.add("active");
    }
}


// Load products when page opens
if (menuGrid) {
    loadProducts();
}