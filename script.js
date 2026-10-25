// ---- Cart ka data localStorage se lena ----
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// ---- Cart ka data localStorage me save karna ----
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

// ---- Navbar me cart ki total quantity dikhana ----
function updateCartCount() {
    const cart = getCart();
    let total = 0;
    cart.forEach(function (item) {
        total = total + item.qty;
    });
    const countBox = document.getElementById("cartCount");
    if (countBox) {
        countBox.textContent = total;
    }
}

// ---- Add to Cart button ----
const addButtons = document.querySelectorAll(".add-to-cart-btn");

addButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
        // jis card ka button dabaya, uska data nikalo
        const card = btn.closest(".product-card");

        const name = card.querySelector(".product-title").textContent;
        const priceText = card.querySelector(".current-price").textContent;
        const price = Number(priceText.replace("₹", "").replace(/,/g, ""));
        const image = card.querySelector("img").src;
        const weight = card.querySelector(".weight-btn.active").textContent;

        const cart = getCart();

        // check karo ye product (same weight) pehle se cart me hai ya nahi
        let found = false;
        cart.forEach(function (item) {
            if (item.name === name && item.weight === weight) {
                item.qty = item.qty + 1;
                found = true;
            }
        });

        // agar nahi hai to naya add karo
        if (found === false) {
            cart.push({ name: name, price: price, image: image, weight: weight, qty: 1 });
        }

        saveCart(cart);
        alert(name + " added in cart");
    });
});


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

        const item = { name: name, price: price, image: image, weight: weight, qty: 1 };

        // sirf ye ek item "buyNow" me save karo
        localStorage.setItem("buyNow", JSON.stringify(item));

        // checkout page pe bhejo
        window.location.href = "checkout.html";
    });
});
updateCartCount();