const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// JSON data padhne ke liye
app.use(express.json());

// HTML, CSS, JS files browser ko dene ke liye
app.use(express.static(__dirname));

// ---- Kisi bhi JSON file me naya data add karne wala function ----
function saveToFile(fileName, newData) {
    const filePath = path.join(__dirname, "data", fileName);

    let list = [];

    // purani file me jo data hai wo padho
    if (fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, "utf8");
        if (text.trim() !== "") {
            list = JSON.parse(text);
        }
    }

    // naya data add karo aur wapas file me likh do
    list.push(newData);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2));
}

// ---- Order save karne ka route ----
app.post("/api/orders", function (req, res) {
    const order = req.body;

    // server side basic check
    if (!order.name || !order.phone || !order.items || order.items.length === 0) {
        return res.json({ success: false, message: "Invalid order data" });
    }

    saveToFile("orders.json", order);
    res.json({ success: true, orderId: order.orderId });
});
// ---- Contact form save karne ka route ----
app.post("/api/contact", function (req, res) {
    const msg = req.body;

    // server side basic check
    if (!msg.name || !msg.email || !msg.message) {
        return res.json({ success: false, message: "Invalid contact data" });
    }

    saveToFile("contacts.json", msg);
    res.json({ success: true });
});

// ---- Server start ----
app.listen(PORT, function () {
    console.log("Server chal gaya: http://localhost:" + PORT);
});