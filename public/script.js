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
    accountsDiv.innerHTML += `
<p>${acc.name} : $${acc.balance}</p>
`;

    from.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
    to.innerHTML += `<option value="${acc.id}">${acc.name}</option>`;
  });
}

document
  .getElementById("transferForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
    const amount = document.getElementById("amount").value;

    const res = await fetch("/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, amount }),
    });

    const result = await res.json();

    document.getElementById("message").innerText =
      result.message || result.error;

    loadAccounts();
  });

loadAccounts();
