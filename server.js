const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const db = mysql.createPool({
  ///sửa localhost thành mysql
  host: "mysql",
  user: "root",
  // sửa root thành password
  password: "root",
  database: "bank_demo",
});

// lấy danh sách tài khoản
app.get("/accounts", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM accounts");

  res.json(rows);
});

// lấy lịch sử giao dịch
app.get("/transactions", async (req, res) => {
  const [rows] = await db.query(`
    SELECT 
      t.id,
      a.name AS sender,
      b.name AS receiver,
      t.amount,
      t.created_at
    FROM transactions t
    JOIN accounts a ON t.from_account = a.id
    JOIN accounts b ON t.to_account = b.id
    ORDER BY t.created_at DESC
  `);

  res.json(rows);
});


// TRANSFER SLOW (DEMO CONCURRENCY)
app.post("/transfer", async (req, res) => {
  const { from, to, amount, simulateDelay } = req.body;
  const money = Number(amount);

  if (!Number.isFinite(money) || money <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  if (from === to) {
    return res.status(400).json({ error: "Same account" });
  }

  const connection = await db.getConnection();

  try {
    await connection.query(
      "SET TRANSACTION ISOLATION LEVEL READ COMMITTED"
    );
    await connection.beginTransaction();

    console.log(`🟡 BEGIN TX from ${from} → ${to}`);

    // 🔒 lock theo thứ tự để tránh deadlock
    const [first, second] = from < to ? [from, to] : [to, from];

    const [rows1] = await connection.query(
      "SELECT balance FROM accounts WHERE id=? FOR UPDATE",
      [first]
    );

    const [rows2] = await connection.query(
      "SELECT balance FROM accounts WHERE id=? FOR UPDATE",
      [second]
    );

    const sender = from === first ? rows1[0] : rows2[0];
    const receiver = to === second ? rows2[0] : rows1[0];

    if (!sender) throw new Error("Sender not found");
    if (!receiver) throw new Error("Receiver not found");

    console.log(`🔒 LOCK ACQUIRED for ${first}, ${second}`);

    //  DEMO MODE (giữ lock)
    if (simulateDelay) {
      console.log("⏳ Simulating delay...");
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }

    if (sender.balance < money) {
      throw new Error("Not enough money");
    }

    //  update
    const { simulateCrash } = req.body;
    await connection.query(
      "UPDATE accounts SET balance = balance - ? WHERE id=?",
      [money, from]
    );

    // thêm lỗi để demo rollback
    if (simulateCrash) {
      console.log("Simulating Crash...");
      throw new Error("Crash after debit");
    }
    await connection.query(
      "UPDATE accounts SET balance = balance + ? WHERE id=?",
      [money, to]
    );


    // 🧾 log transaction
    await connection.query(
      "INSERT INTO transactions (from_account,to_account,amount) VALUES (?,?,?)",
      [from, to, money]
    );

    await connection.commit();

    console.log(`✅ COMMIT ${from} → ${to}`);

    res.json({
      message: simulateDelay
        ? "Transfer success (with delay demo)"
        : "Transfer success",
    });
  } catch (err) {
    await connection.rollback();

    console.log("❌ ROLLBACK:", err.message);

    if (
      err.code === "ER_LOCK_DEADLOCK" ||
      err.code === "ER_LOCK_WAIT_TIMEOUT"
    ) {
      return res.status(409).json({
        error: "Transaction conflict, please retry",
      });
    }

    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});
////----no transaction
app.post("/transfer-no-tx", async (req, res) => {
  const { from, to, amount } = req.body;
  const money = Number(amount);

  try {
    console.log("🚫 NO TRANSACTION START");

    // 🧠 READ (no lock)
    const [sender] = await db.query(
      "SELECT balance FROM accounts_no_tx WHERE id=?",
      [from]
    );

    if (sender.length === 0) {
      throw new Error("Sender not found");
    }

    const [receiver] = await db.query(
      "SELECT balance FROM accounts_no_tx WHERE id=?",
      [to]
    );

    // if (receiver.length === 0) {
    //   throw new Error("Receiver not found");
    // }

    console.log("📖 READ BALANCE:", sender[0].balance);

    // ⏳ delay để tạo race condition
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // if (sender[0].balance < money) {
    //   throw new Error("Not enough money");
    // }

    // 💥 stale update
    const newSenderBalance = sender[0].balance - money;

    console.log("⚠️ BEFORE:", sender[0].balance);
    console.log("⚠️ AFTER:", newSenderBalance);

    await db.query(
      "UPDATE accounts_no_tx SET balance = ? WHERE id=?",
      [newSenderBalance, from]
    );
    // thêm lỗi để demo rollback
    throw new Error("Crash after debit");

    await db.query(
      "UPDATE accounts_no_tx SET balance = balance + ? WHERE id=?",
      [money, to]
    );

    console.log("⚠️ NO TX DONE");

    res.json({ message: "Transfer without transaction (bug demo)" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//add new account
app.post("/create-account", async (req, res) => {
  const { id, name, balance } = req.body;
  if (id !== undefined && id !== null && id !== "") {
    return res.status(400).json({ error: "ID is auto-generated and cannot be provided" });
  }

  if (!name || !name.trim()) return res.status(400).json({ error: "Account name required" });

  const initialBalance = Number(balance);
  if (!Number.isFinite(initialBalance) || initialBalance < 0) {
    return res.status(400).json({ error: "Balance must be non-negative number" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      "CALL add_account(?, ?)",
      [name.trim(), initialBalance],
    );

    await connection.commit();
    res.json({ message: `Account "${name.trim()}" created.` });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});