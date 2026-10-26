// ================= MENU PAGE (menu.html) =================
// Ye file script.js ke BAAD load hoti hai, taaki cart / wishlist / weight / buy now
// ka code same cards pe automatic kaam kare.

const menuGrid = document.querySelector(".products-grid");
const menuSearch = document.getElementById("menuSearch");
const menuSort = document.getElementById("menuSort");
const menuPrice = document.getElementById("menuPrice");
const menuReset = document.getElementById("menuReset");
const menuCount = document.getElementById("menuCount");
const menuEmpty = document.getElementById("menuNoResults");
const menuEmptyReset = document.getElementById("menuEmptyReset");
const menuPills = document.querySelectorAll(".category-pill");

// Agar ye menu page nahi hai to kuch mat karo
if (menuGrid && menuSearch) {

    // Saare cards ki list (original order yaad rakhne ke liye)
    const menuCards = Array.from(document.querySelectorAll(".product-card"));
    let menuCategory = "all";

    // ---- Page khulte hi har card ka naam, price, rating yaad kar lo ----
    // (price "default weight" wala liya hai, taaki weight badalne par card gayab na ho)
    menuCards.forEach(function (card) {
        const name = card.querySelector(".product-title").textContent.toLowerCase();
        const priceText = card.querySelector(".current-price").textContent;
        const ratingBox = card.querySelector(".rating-row strong");

        card.dataset.name = name;
        card.dataset.basePrice = Number(priceText.replace("₹", "").replace(/,/g, ""));
        card.dataset.rating = ratingBox ? Number(ratingBox.textContent) : 0;
    });

    // ---- Filter: category + search + price, teeno ek saath ----
    function applyMenuFilters() {
        const text = menuSearch.value.toLowerCase().trim();
        const priceRange = menuPrice.value;
        let shown = 0;

        menuCards.forEach(function (card) {
            const cardCategories = card.getAttribute("data-category").split(" ");
            const price = Number(card.dataset.basePrice);
            let ok = true;

            // 1. category check
            if (menuCategory !== "all" && !cardCategories.includes(menuCategory)) {
                ok = false;
            }

            // 2. search check (naam me text hai ya nahi)
            if (text !== "" && !card.dataset.name.includes(text)) {
                ok = false;
            }

            // 3. price range check
            if (priceRange === "low" && price >= 500) {
                ok = false;
            }
            if (priceRange === "mid" && (price < 500 || price > 1000)) {
                ok = false;
            }
            if (priceRange === "high" && price <= 1000) {
                ok = false;
            }

            // Teeno shart pass hui to dikhao, warna chhupao
            if (ok) {
                card.style.display = "flex";
                shown = shown + 1;
            } else {
                card.style.display = "none";
            }
        });

        // "Showing 12 of 30 items" likhna
        menuCount.textContent = "Showing " + shown + " of " + menuCards.length + " items";

        // Kuch nahi mila to message dikhao
        if (shown === 0) {
            menuEmpty.style.display = "block";
        } else {
            menuEmpty.style.display = "none";
        }
    }

    // ---- Sort: cards ko naye order me grid me wapas lagana ----
    function sortMenuCards() {
        const how = menuSort.value;
        const sorted = menuCards.slice();   // list ki copy

        if (how === "low") {
            sorted.sort(function (a, b) { return Number(a.dataset.basePrice) - Number(b.dataset.basePrice); });
        } else if (how === "high") {
            sorted.sort(function (a, b) { return Number(b.dataset.basePrice) - Number(a.dataset.basePrice); });
        } else if (how === "rating") {
            sorted.sort(function (a, b) { return Number(b.dataset.rating) - Number(a.dataset.rating); });
        } else if (how === "name") {
            sorted.sort(function (a, b) { return a.dataset.name.localeCompare(b.dataset.name); });
        }
        // how === "default" ho to sorted list original order me hi rahegi

        // appendChild card ko naye jagah pe "move" kar deta hai (buttons kaam karte rahte hain)
        sorted.forEach(function (card) {
            menuGrid.appendChild(card);
        });
    }

    // ---- Category pill click ----
    menuPills.forEach(function (pill) {
        pill.addEventListener("click", function () {
            menuPills.forEach(function (p) { p.classList.remove("active"); });
            pill.classList.add("active");

            menuCategory = pill.getAttribute("data-category");
            applyMenuFilters();
        });
    });

    // ---- Search box: har key dabane par ----
    menuSearch.addEventListener("input", applyMenuFilters);

    // ---- Dropdowns ----
    menuPrice.addEventListener("change", applyMenuFilters);
    menuSort.addEventListener("change", sortMenuCards);

    // ---- Reset: sab kuch pehle jaisa ----
    function resetMenuFilters() {
        menuSearch.value = "";
        menuPrice.value = "all";
        menuSort.value = "default";
        menuCategory = "all";

        menuPills.forEach(function (p) { p.classList.remove("active"); });
        document.querySelector('.category-pill[data-category="all"]').classList.add("active");

        sortMenuCards();
        applyMenuFilters();
    }

    menuReset.addEventListener("click", resetMenuFilters);
    menuEmptyReset.addEventListener("click", resetMenuFilters);

    // ---- URL me ?category=pastries ho to wahi category kholo ----
    const menuParams = new URLSearchParams(window.location.search);
    const menuUrlCategory = menuParams.get("category");

    if (menuUrlCategory) {
        const urlPill = document.querySelector('.category-pill[data-category="' + menuUrlCategory + '"]');
        if (urlPill) {
            urlPill.click();
        }
    }

    // Pehli baar count dikhane ke liye
    applyMenuFilters();
}