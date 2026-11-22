let cartItems = [];

async function cartRequest(method, path = "", body) {
    const response = await fetch("/api/cart" + path, {
        method,
        headers: {
            Authorization: "Bearer " + localStorage.getItem("userToken"),
            "Content-Type": "application/json"
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (response.status === 204) return;
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Could not load the cart.");
    return data;
}

async function refreshCart() {
    const data = await cartRequest("GET");
    cartItems = data.items;
    const badge = document.getElementById("cartCount");
    if (badge) badge.textContent = cartItems.reduce((sum, item) => sum + item.qty, 0);
    if (document.getElementById("cartItems")) showCart();
}

async function resolveCartProduct(item) {
    if (item.productId) return item.productId;
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Could not load products.");
    const { products } = await response.json();
    const product = products.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
    if (!product) throw new Error(item.name + " is no longer available.");
    return product._id;
}

async function initializeCart() {
    if (!getUser()) return;
    const legacy = JSON.parse(localStorage.getItem("cart") || "[]");
    // Only discard each old entry after MongoDB acknowledges the import.
    for (const item of [...legacy]) {
        try {
            const productId = await resolveCartProduct(item);
            await cartRequest("POST", "", { productId, weight: item.weight, qty: item.qty, importLegacy: true });
            legacy.splice(legacy.indexOf(item), 1);
            localStorage.setItem("cart", JSON.stringify(legacy));
        } catch (error) {
            console.warn("Previous cart entry retained:", error.message);
        }
    }
    if (!legacy.length) localStorage.removeItem("cart");
    await refreshCart();
}

async function addCartItem(item) {
    await cartReady;
    const productId = await resolveCartProduct(item);
    await cartRequest("POST", "", { productId, weight: item.weight });
    await refreshCart();
}

function showCart() {
    const box = document.getElementById("cartItems");
    const total = document.getElementById("cartTotal");
    const checkout = document.getElementById("checkoutBtn");
    box.replaceChildren();
    checkout.style.display = cartItems.length ? "inline-block" : "none";
    total.textContent = "";
    if (!cartItems.length) {
        box.textContent = "Your cart is empty 😢";
        return;
    }
    let amount = 0;
    for (const item of cartItems) {
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = '<img alt=""><div class="cart-info"><h4></h4><p></p><p></p></div>' +
            '<div class="qty-box"><button>-</button><span></span><button>+</button></div>' +
            '<strong></strong><button class="remove-btn">Remove</button>';
        const image = row.querySelector("img");
        image.src = item.image;
        image.alt = item.name;
        row.querySelector("h4").textContent = item.name;
        const [weight, price] = row.querySelectorAll("p");
        weight.textContent = "Weight: " + item.weight;
        price.textContent = "Price: ₹" + item.price;
        row.querySelector("span").textContent = item.qty;
        row.querySelector("strong").textContent = "₹" + item.price * item.qty;
        const [minus, plus, remove] = row.querySelectorAll("button");
        minus.disabled = item.qty === 1;
        async function change(method, qty) {
            for (const button of [minus, plus, remove]) button.disabled = true;
            try {
                await cartRequest(method, "/" + item._id,
                    method === "PATCH" ? { qty, previousQty: item.qty } : undefined);
            } catch (error) {
                alert(error.message);
            } finally {
                await refreshCart().catch(error => { box.textContent = error.message; });
            }
        }
        minus.onclick = () => change("PATCH", item.qty - 1);
        plus.onclick = () => change("PATCH", item.qty + 1);
        remove.onclick = () => change("DELETE");
        box.appendChild(row);
        amount += item.price * item.qty;
    }
    total.textContent = "Total: ₹" + amount;
}

document.addEventListener("click", async event => {
    const button = event.target.closest(".add-to-cart-btn");
    if (!button) return;
    const card = button.closest(".product-card");
    const name = card.querySelector(".product-title").textContent.trim();
    const weight = card.querySelector(".weight-btn.active")?.textContent.trim();
    button.disabled = true;
    try {
        await addCartItem({ name, weight, productId: card.dataset.id });
        showCartToast(name);
    } catch (error) {
        alert(error.message);
    } finally {
        button.disabled = false;
    }
});

// CONNECT HOMEPAGE PRODUCTS WITH MONGODB IDs

async function attachHomepageProductIds() {
    try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Products could not be loaded");
        }

        const products = data.products || [];

        document.querySelectorAll(".product-card").forEach(card => {
            const title = card.querySelector(".product-title");

            if (!title || card.dataset.id) return;

            const productName = title.textContent.trim().toLowerCase();

            const matchedProduct = products.find(
                product => product.name.trim().toLowerCase() === productName
            );

            if (matchedProduct) {
                card.dataset.id = matchedProduct._id;
            }
        });

        console.log("Homepage MongoDB Product IDs connected!");

    } catch (error) {
        console.error("Homepage Product ID Error:", error);
    }
}

// Run on page load
attachHomepageProductIds();


// page khulte hi count update karo
// ---- Weight ka multiplier (kis weight pe price kitna guna hoga) ----
const weightMultiplier = {
    "0.5 kg": 0.5,
    "500g": 0.5,
    "1 kg": 1,
    "1.5 kg": 1.5,
    "2 kg": 2,
    "6 Inch": 1,
    "8 Inch": 1.5,
    "1 Piece": 1,
    "1 Pc": 1,
    "Box of 2": 2,
    "Box of 3": 3,
    "Box of 4": 4,
    "Box of 6": 6
};

// ---- Number ko ₹1,099 jaisa format karna ----
function formatPrice(number) {
    return "₹" + Math.round(number).toLocaleString("en-IN");
}

// ---- Page khulte hi har card ka "1 unit ka price" nikalo ----
const allCards = document.querySelectorAll(".product-card");

allCards.forEach(function (card) {
    const activeBtn = card.querySelector(".weight-btn.active");
    const currentPriceBox = card.querySelector(".current-price");
    const oldPriceBox = card.querySelector(".old-price");

    // agar card me weight button nahi hai to skip
    if (!activeBtn || !currentPriceBox) {
        return;
    }

    const activeMultiplier = weightMultiplier[activeBtn.textContent.trim()] || 1;

    // abhi ka price active weight ka hai, usko multiplier se divide karke 1 unit ka price
    const currentPrice = Number(currentPriceBox.textContent.replace("₹", "").replace(/,/g, ""));
    card.dataset.unitPrice = currentPrice / activeMultiplier;

    if (oldPriceBox) {
        const oldPrice = Number(oldPriceBox.textContent.replace("₹", "").replace(/,/g, ""));
        card.dataset.unitOldPrice = oldPrice / activeMultiplier;
    }
});

// ---- Weight button click hone par ----
const weightButtons = document.querySelectorAll(".weight-btn");

weightButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        const card = btn.closest(".product-card");

        // 1. us card ke saare buttons se active hatao
        card.querySelectorAll(".weight-btn").forEach(function (b) {
            b.classList.remove("active");
        });

        // 2. jis button pe click hua usko active karo
        btn.classList.add("active");

        // 3. naya price calculate karke dikhao
        const multiplier = weightMultiplier[btn.textContent.trim()] || 1;

        const currentPriceBox = card.querySelector(".current-price");
        currentPriceBox.textContent = formatPrice(card.dataset.unitPrice * multiplier);

        const oldPriceBox = card.querySelector(".old-price");
        if (oldPriceBox) {
            oldPriceBox.textContent = formatPrice(card.dataset.unitOldPrice * multiplier);
        }
    });
});
// ---- Wishlist ka data localStorage se lena ----
function getWishlist() {
    return JSON.parse(localStorage.getItem("wishlist")) || [];
}

// ---- Wishlist save karna ----
function saveWishlist(list) {
    localStorage.setItem("wishlist", JSON.stringify(list));
    updateWishCount();
}

// ---- Navbar me wishlist ki count dikhana ----
function updateWishCount() {
    const countBox = document.getElementById("wishCount");
    if (countBox) {
        countBox.textContent = getWishlist().length;
    }
}

// ---- Page khulte hi jo cakes wishlist me hain unka heart red karo ----
function markHearts() {
    const list = getWishlist();

    document.querySelectorAll(".product-card").forEach(function (card) {
        const heart = card.querySelector(".fav-btn");
        const name = card.querySelector(".product-title").textContent;

        let inWishlist = false;
        list.forEach(function (item) {
            if (item.name === name) {
                inWishlist = true;
            }
        });

        if (inWishlist) {
            heart.classList.add("active");
            heart.textContent = "♥";
        }
    });
}

// ---- Heart button click ----
document.querySelectorAll(".fav-btn").forEach(function (heart) {
    heart.addEventListener("click", function () {
        const card = heart.closest(".product-card");

        const name = card.querySelector(".product-title").textContent;
        const priceText = card.querySelector(".current-price").textContent;
        const price = Number(priceText.replace("₹", "").replace(/,/g, ""));
        const image = card.querySelector("img").src;
        const weight = card.querySelector(".weight-btn.active").textContent;

        let list = getWishlist();

        if (heart.classList.contains("active")) {
            // pehle se wishlist me hai to hata do
            list = list.filter(function (item) {
                return item.name !== name;
            });
            heart.classList.remove("active");
            heart.textContent = "♡";
        } else {
            // nahi hai to add karo
            list.push({ name: name, price: price, image: image, weight: weight });
            heart.classList.add("active");
            heart.textContent = "♥";
        }

        saveWishlist(list);
    });
});

markHearts();
updateWishCount();
// ---- Search box ----
const searchInput = document.getElementById("searchInput");
const noResults = document.getElementById("noResults");

if (searchInput) {

    // Jaise hi user type kare
    searchInput.addEventListener("input", function () {
        const text = searchInput.value.toLowerCase().trim();

        // Agar search box khali hai to active category wapas dikhao
        if (text === "") {
            const activePill = document.querySelector(".category-pill.active");
            filterCards(activePill.getAttribute("data-category"));
            noResults.style.display = "none";
            return;
        }

        // Warna saare cards me naam dhoondo
        let matchCount = 0;

        document.querySelectorAll(".product-card").forEach(function (card) {
            const name = card.querySelector(".product-title").textContent.toLowerCase();

            if (name.includes(text)) {
                card.style.display = "flex";
                matchCount = matchCount + 1;
            } else {
                card.style.display = "none";
            }
        });

        // Koi card nahi mila to message dikhao
        if (matchCount === 0) {
            noResults.style.display = "block";
        } else {
            noResults.style.display = "none";
        }
    });

    // Category pill dabane par search box saaf kar do
    document.querySelectorAll(".category-pill").forEach(function (pill) {
        pill.addEventListener("click", function () {
            searchInput.value = "";
            noResults.style.display = "none";
        });
    });
}
// ---- Har card me "Buy Now" button lagana ----
document.querySelectorAll(".product-card").forEach(function (card) {
    const addBtn = card.querySelector(".add-to-cart-btn");
    if (!addBtn) {
        return;
    }

    // naya button banao
    const buyBtn = document.createElement("button");
    buyBtn.className = "buy-now-btn";
    buyBtn.textContent = "Buy Now";

    // Add to Cart ke just baad lagao
    addBtn.after(buyBtn);

    // Buy Now click hone par
    buyBtn.addEventListener("click", function () {
        const name = card.querySelector(".product-title").textContent;
        const priceText = card.querySelector(".current-price").textContent;
        const price = Number(priceText.replace("₹", "").replace(/,/g, ""));
        const image = card.querySelector("img").src;
        const weight = card.querySelector(".weight-btn.active").textContent;
        const productId = card.dataset.id || null;


        const item = { productId: productId, name: name, price: price, image: image, weight: weight, qty: 1 };

        // sirf ye ek item "buyNow" me save karo
        localStorage.setItem("buyNow", JSON.stringify(item));

        // checkout page pe bhejo
        window.location.href = "checkout.html";
    });
});
// ================= LOGIN SYSTEM =================

// ---- Logged in user ko localStorage se lena (login nahi hai to null) ----
function getUser() {
    return JSON.parse(localStorage.getItem("user"));
}

// ---- Logout ----
function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("userToken");
    window.location.href = "index.html";
}

// ---- Popup band karna ----
function closePopup() {
    const popup = document.getElementById("loginPopup");
    if (popup) {
        popup.remove();
    }
}

// ---- "Login Required" popup dikhana ----
function showLoginPopup() {
    if (document.getElementById("loginPopup")) {
        return;
    }

    const popup = document.createElement("div");
    popup.id = "loginPopup";
    popup.className = "popup-bg";
    popup.innerHTML = `
        <div class="popup-box">
            <h3>Login Required 🔒</h3>
            <p>Please log in to add items to your cart, save favourites to your wishlist, or place an order. Guests can browse the menu freely.</p>
            <div class="popup-btns">
              <a href="login.html?next=${window.location.pathname.split('/').pop()}" class="checkout-btn">Login</a>
                <a href="signup.html" class="popup-secondary">Sign Up</a>
            </div>
            <button class="popup-close" onclick="closePopup()">Continue Browsing</button>
        </div>
    `;
    document.body.appendChild(popup);
}

// ---- Guest ko Add to Cart / Buy Now / Wishlist se rokna ----
// "true" (capture) ka matlab: ye listener baaki saare click code se PEHLE chalega
document.addEventListener("click", function (event) {
    const clicked = event.target.closest(".add-to-cart-btn, .buy-now-btn, .fav-btn");

    if (clicked && getUser() === null) {
        event.stopPropagation();   // asli button ka code chalne se rok do
        event.preventDefault();
        showLoginPopup();
    }
}, true);

// ---- Protected pages: login ke bina khulne par login page pe bhejo ----
const protectedPages = ["cart.html", "wishlist.html", "checkout.html", "account.html"];
const currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage) && getUser() === null) {
    window.location.href = "login.html?next=" + currentPage;
}

// ---- Navbar me "👤 Login" ya "👤 Naam" dikhana (saare pages me automatic) ----
const navActions = document.querySelector(".nav-actions");

if (navActions) {
    const userLink = document.createElement("a");
    userLink.className = "user-link";

    const user = getUser();
    if (user) {
        userLink.href = "account.html";
        userLink.textContent = "👤 " + user.name.split(" ")[0];
    } else {
        userLink.href = "login.html";
        userLink.textContent = "👤 Login";
    }

    navActions.prepend(userLink);
}
// ---- Mobile menu (☰ button) ----
const menuToggle = document.getElementById("menuToggle");
const navLinksBox = document.getElementById("navLinks");

if (menuToggle && navLinksBox) {
    menuToggle.addEventListener("click", function () {
        navLinksBox.classList.toggle("open");
    });
}
// ================= HERO SLIDESHOW =================
const slides = document.querySelectorAll(".hero-image-container .slide");
const dotsBox = document.getElementById("slideDots");
const slideName = document.getElementById("slideName");

if (slides.length > 0 && dotsBox) {
    let currentSlide = 0;
    let slideTimer;

    // Har slide ke liye ek dot banao
    slides.forEach(function (slide, index) {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.addEventListener("click", function () {
            showSlide(index);
            restartTimer();      // click ke baad timer dobara 4 sec se shuru
        });
        dotsBox.appendChild(dot);
    });

    const dots = dotsBox.querySelectorAll(".dot");

    // Ek slide dikhane wala function
    function showSlide(index) {
        slides.forEach(function (s) { s.classList.remove("active"); });
        dots.forEach(function (d) { d.classList.remove("active"); });

        slides[index].classList.add("active");
        dots[index].classList.add("active");
        slideName.textContent = slides[index].dataset.name;

        currentSlide = index;
    }

    // Agli slide pe jaana (last ke baad wapas pehli)
    function nextSlide() {
        showSlide((currentSlide + 1) % slides.length);
    }

    // Har 4 second (4000 ms) me nextSlide chalao
    function restartTimer() {
        clearInterval(slideTimer);
        slideTimer = setInterval(nextSlide, 4000);
    }

    showSlide(0);
    restartTimer();
}
const cartReady = initializeCart();
cartReady.catch(error => {
    const box = document.getElementById("cartItems");
    if (box) box.textContent = error.message;
    const checkout = document.getElementById("checkoutBtn");
    if (checkout) checkout.style.display = "none";
    console.warn("Cart unavailable:", error.message);
});

function showCartToast(productName) {
    // Remove previous notification
    const oldToast = document.getElementById("cartToast");

    if (oldToast) {
        oldToast.remove();
    }

    // Create notification
    const toast = document.createElement("div");
    toast.id = "cartToast";
    toast.className = "cart-toast";
    toast.setAttribute("role", "status");

    const message = document.createElement("span");
    message.textContent = "✓ " + productName + " added to cart!";

    const viewCart = document.createElement("a");
    viewCart.href = "cart.html";
    viewCart.textContent = "View Cart";

    toast.append(message, viewCart);
    document.body.appendChild(toast);

    // Automatically hide after 3 seconds
    setTimeout(function () {
        toast.remove();
    }, 3000);
}