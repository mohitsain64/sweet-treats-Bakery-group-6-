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
// ---- Kisi JSON file ka poora data padhne ka function ----
function readFromFile(fileName) {
    const filePath = path.join(__dirname, "data", fileName);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const text = fs.readFileSync(filePath, "utf8");
    if (text.trim() === "") {
        return [];
    }
    return JSON.parse(text);
}

// ---- Signup route ----
app.post("/api/signup", function (req, res) {
    const data = req.body;

    // server side basic check
    if (!data.name || !data.email || !data.phone || !data.password) {
        return res.json({ success: false, message: "All fields are required" });
    }

    const users = readFromFile("users.json");

    // same email se dobara signup nahi hona chahiye
    const alreadyExists = users.find(function (u) {
        return u.email === data.email;
    });

    if (alreadyExists) {
        return res.json({ success: false, message: "This email is already registered" });
    }

    const newUser = {
        id: "USR" + Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        createdAt: new Date().toLocaleString()
    };

    saveToFile("users.json", newUser);

    // password wapas browser ko nahi bhejte
    res.json({
        success: true,
        user: { name: newUser.name, email: newUser.email, phone: newUser.phone }
    });
});

// ---- Login route ----
app.post("/api/login", function (req, res) {
    const data = req.body;
    const users = readFromFile("users.json");

    const foundUser = users.find(function (u) {
        return u.email === data.email && u.password === data.password;
    });

    if (!foundUser) {
        return res.json({ success: false, message: "Wrong email or password" });
    }

    res.json({
        success: true,
        user: { name: foundUser.name, email: foundUser.email, phone: foundUser.phone }
    });
});

// ---- Ek user ke orders (My Orders page ke liye) ----
app.get("/api/my-orders", function (req, res) {
    const email = req.query.email;
    const orders = readFromFile("orders.json");

    const myOrders = orders.filter(function (o) {
        return o.userEmail === email;
    });

    res.json({ success: true, orders: myOrders });
});

// ---- Server start ----
app.listen(PORT, function () {
    console.log("Server is live: http://localhost:" + PORT);
});