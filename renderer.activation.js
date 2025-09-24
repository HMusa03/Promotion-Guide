const { ipcRenderer } = require("electron");

// ✅ Replace with your deployed Apps Script Web App URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyTozHASZG7JxLWBl3MDVxrN0xxbFf4jKqDD7IXxct3mHzYVwd3cLxJsF8zW9uSt28C/exec";

// Activate button
document.getElementById("activateBtn").addEventListener("click", async () => {
  const code = document.getElementById("codeInput").value.trim();
  const msg = document.getElementById("message");
  const btn = document.getElementById("activateBtn");
  const loader = document.getElementById("loader");

  if (!code) {
    msg.textContent = "⚠ Please enter a code.";
    msg.style.color = "red";
    return;
  }

  try {
    // ✅ Show loading state
    msg.textContent = "⏳ Activating, please wait...";
    msg.style.color = "blue";
    btn.disabled = true;
    btn.textContent = "Processing...";
    loader.style.display = "inline-block";

    // ✅ Call Apps Script endpoint (plain text)
    const res = await fetch(`${SCRIPT_URL}?code=${code}`);
    const status = (await res.text()).trim().toUpperCase();

    if (status === "VALID") {
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1);

      ipcRenderer.send("save-activation", {
        code,
        expiry,
        status: "Active"
      });

      msg.textContent = "✅ Activation successful!";
      msg.style.color = "green";

      setTimeout(() => {
        ipcRenderer.send("activation-success");
      }, 1500);

    } else if (status === "USED") {
      msg.textContent = "❌ This code has already been used.";
      msg.style.color = "red";

    } else if (status === "EXPIRED") {
      msg.textContent = "❌ This code has expired.";
      msg.style.color = "red";

    } else if (status === "INVALID") {
      msg.textContent = "❌ Invalid activation code.";
      msg.style.color = "red";

    } else {
      msg.textContent = `❌ Unknown server response: ${status}`;
      msg.style.color = "red";
    }

  } catch (err) {
    console.error("Activation error:", err);
    msg.textContent = "❌ Error connecting to server.";
    msg.style.color = "red";
  } finally {
    // ✅ Reset button + hide loader
    btn.disabled = false;
    btn.textContent = "Activate";
    loader.style.display = "none";
  }
});
