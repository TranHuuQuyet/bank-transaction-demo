async function loadAccounts() {
  const res = await fetch("/accounts");
  const data = await res.json();

  const accountsDiv = document.getElementById("accounts");
  const from = document.getElementById("from");
  const to = document.getElementById("to");

  accountsDiv.innerHTML = "";
  from.innerHTML = "";
  to.innerHTML = "";

  data.forEach((acc) => {
    accountsDiv.innerHTML += `<p>${acc.name} : $${acc.balance}</p>`;
    from.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
    to.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
  });
}

function showTimeline(steps) {
  const message = document.getElementById("message");

  message.className = "";
  message.innerHTML = "";

  steps.forEach((step) => {
    const line = document.createElement("div");
    line.innerText = step;
    message.appendChild(line);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

document
  .getElementById("transferForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const amount = document.getElementById("amount").value;

    const message = document.getElementById("message");
    message.innerHTML = "";

    // Transaction flow demo
    showTimeline(["BEGIN TRANSACTION"]);
    await delay(700);

    showTimeline(["BEGIN TRANSACTION", "CHECK BALANCE"]);
    await delay(700);

    showTimeline([
      "BEGIN TRANSACTION",
      "CHECK BALANCE",
      "UPDATE SENDER BALANCE",
    ]);
    await delay(700);

    showTimeline([
      "BEGIN TRANSACTION",
      "CHECK BALANCE",
      "UPDATE SENDER BALANCE",
      "UPDATE RECEIVER BALANCE",
    ]);
    await delay(700);

    const res = await fetch("/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Number(from),
        to: Number(to),
        amount: Number(amount),
      }),
    });

    const result = await res.json();

    if (res.ok) {
      showTimeline([
        "BEGIN TRANSACTION",
        "CHECK BALANCE",
        "UPDATE SENDER BALANCE",
        "UPDATE RECEIVER BALANCE",
        "INSERT TRANSACTION LOG",
        "COMMIT",
      ]);
    } else {
      message.className = "rollback";

      showTimeline([
        "BEGIN TRANSACTION",
        "CHECK BALANCE",
        "ERROR DETECTED",
        "ROLLBACK",
      ]);
    }

    message.innerHTML += `<p>${result.message || result.error}</p>`;

    loadAccounts();
    loadTransactions();
  });

async function loadTransactions() {
  const res = await fetch("/transactions");
  const data = await res.json();

  const table = document.querySelector("#historyTable tbody");

  table.innerHTML = "";

  data.forEach((t) => {
    const row = `
      <tr>
        <td>${t.id}</td>
        <td>${t.sender}</td>
        <td>${t.receiver}</td>
        <td>$${t.amount}</td>
        <td>${t.created_at}</td>
      </tr>
    `;

    table.innerHTML += row;
  });
}

async function simulateError() {
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const message = document.getElementById("message");

  message.className = "rollback";
  message.innerHTML = "";

  // simulate transaction failure
  showTimeline(["BEGIN TRANSACTION"]);
  await delay(700);

  showTimeline(["BEGIN TRANSACTION", "UPDATE SENDER BALANCE"]);
  await delay(700);

  showTimeline([
    "BEGIN TRANSACTION",
    "UPDATE SENDER BALANCE",
    "SYSTEM CRASH DETECTED",
  ]);
  await delay(700);

  showTimeline([
    "BEGIN TRANSACTION",
    "UPDATE SENDER BALANCE",
    "SYSTEM CRASH DETECTED",
    "ROLLBACK EXECUTED",
  ]);

  const res = await fetch("/transfer-error", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Number(from),
      to: Number(to),
      amount: Number(amount),
    }),
  });

  const data = await res.json();

  message.innerHTML += `<p>${data.message}</p>`;

  loadAccounts();
}
/////////////////////////////////////////////thêm UI cho no transaction
async function transferNoTx() {
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const message = document.getElementById("message");
  message.className = "";
  message.innerHTML = "";

  showTimeline(["NO TRANSACTION", "READ BALANCE"]);
  await delay(500);

  showTimeline(["NO TRANSACTION", "READ BALANCE", "WAIT (RACE)"]);
  await delay(500);

  const res = await fetch("/transfer-no-tx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Number(from),
      to: Number(to),
      amount: Number(amount),
    }),
  });

  const result = await res.json();

  showTimeline(["NO TRANSACTION", "READ BALANCE", "WAIT", "UPDATE (UNSAFE)"]);

  message.innerHTML += `<p>${result.message || result.error}</p>`;

  loadAccounts();
}

////////////////////////thêm ui cho transfer slow
async function transferSlow() {
  const from = document.getElementById("from").value;
  const to = document.getElementById("to").value;
  const amount = document.getElementById("amount").value;

  const message = document.getElementById("message");
  message.className = "";
  message.innerHTML = "";

  showTimeline(["BEGIN TRANSACTION", "LOCK (FOR UPDATE)", "WAITING..."]);

  const res = await fetch("/transfer-slow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: Number(from),
      to: Number(to),
      amount: Number(amount),
    }),
  });

  const result = await res.json();

  if (res.ok) {
    showTimeline(["BEGIN TRANSACTION", "LOCK", "WAIT", "UPDATE", "COMMIT"]);
  } else {
    message.className = "rollback";
    showTimeline(["BEGIN TRANSACTION", "LOCK", "ERROR", "ROLLBACK"]);
  }

  message.innerHTML += `<p>${result.message || result.error}</p>`;

  loadAccounts();
  loadTransactions();
}
////////////////////////////////// thêm reset data
async function resetData() {
  const message = document.getElementById("message");

  message.className = "";
  message.innerHTML = "Resetting data...";

  const res = await fetch("/reset", {
    method: "POST",
  });

  const result = await res.json();

  message.innerHTML = `<p>${result.message}</p>`;

  loadAccounts();
  loadTransactions();
}
// create new account UI
// ...existing code...

async function createNewAccountFromFields() {
  const name = document.getElementById("newAccountName").value.trim();
  const balance = parseFloat(document.getElementById("newAccountBalance").value);
  if (!name) {
    alert("Account name is required");
    return;
  }
  if (Number.isNaN(balance) || balance < 0) {
    alert("Initial balance must be 0 or greater");
    return;
  }

  await createNewAccount({ name, balance });
}

async function createNewAccount({ name, balance }) {
  const messageEl = document.getElementById("message");
  messageEl.className = "";
  messageEl.textContent = "Creating account…";

  const res = await fetch("/create-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, balance }),
  });
  const data = await res.json();

  if (res.ok) {
    messageEl.className = "success";
    messageEl.innerHTML = `<p>${data.message}</p>`;
    loadAccounts();
  } else {
    messageEl.className = "rollback";
    messageEl.innerHTML = `<p>${data.error || "Creation failed"}</p>`;
  }
}

async function createNewAccount() {
  const name = prompt("New account name:");
  const balance = Number(prompt("Initial balance:", "1000"));
  if (!name) return;
  await createNewAccount({ name: name.trim(), balance });
}
// ...existing code...

function openNewAccountBox() {
  document.getElementById("newAccountBox").classList.remove("hidden");
}

function closeNewAccountBox() {
  document.getElementById("newAccountBox").classList.add("hidden");
}

async function submitNewAccount() {
  const name = document.getElementById("newAccountName").value.trim();
  const balance = Number(document.getElementById("newAccountBalance").value);

  if (!name) {
    alert("Name is required");
    return;
  }
  if (!Number.isFinite(balance) || balance < 0) {
    alert("Balance must be 0 or greater");
    return;
  }

  const body = { name, balance };

  const res = await fetch("/create-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  const message = document.getElementById("message");
  if (res.ok) {
    message.className = "success";
    message.innerHTML = `<p>${data.message}</p>`;
    closeNewAccountBox();
    document.getElementById("newAccountName").value = "";
    document.getElementById("newAccountBalance").value = "0.00";
    await loadAccounts();
  } else {
    message.className = "rollback";
    message.innerHTML = `<p>${data.error || "Create failed"}</p>`;
  }
}
loadAccounts();
loadTransactions();
