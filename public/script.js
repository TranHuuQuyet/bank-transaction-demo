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
loadAccounts();
loadTransactions();
