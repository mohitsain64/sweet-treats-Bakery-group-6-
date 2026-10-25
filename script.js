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
        const price = Number(priceText.replace("₹", "").replace(",", ""));
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
updateCartCount();