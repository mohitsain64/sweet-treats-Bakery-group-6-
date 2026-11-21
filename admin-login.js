const loginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");
const loginBtn = document.getElementById("loginBtn");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing In...";
    loginMessage.textContent = "";

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        }

        // Only allow admin access
        if (data.user.role !== "admin") {
            throw new Error("Access denied. Admin account required.");
        }

        // Store token for this browser session
        sessionStorage.setItem("adminToken", data.token);

        loginMessage.style.color = "green";
        loginMessage.textContent = "Login successful! Redirecting...";

        setTimeout(() => {
            window.location.href = "/admin.html";
        }, 700);

    } catch (error) {
        loginMessage.style.color = "red";
        loginMessage.textContent = error.message;

    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Sign In to Dashboard";
    }
});