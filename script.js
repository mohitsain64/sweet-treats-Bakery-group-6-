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
updateCartCount();