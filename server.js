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
///-----

// ===================== TRANSFER SLOW (DEMO CONCURRENCY) =====================
app.post("/transfer-slow", async (req, res) => {
  const { from, to, amount } = req.body;
  const money = Number(amount);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    console.log(`🟡 BEGIN TX - from ${from}`);

    const [sender] = await connection.query(
      "SELECT balance FROM accounts WHERE id=? FOR UPDATE",
      [from],
    );

    console.log(`🔒 LOCK ACQUIRED - account ${from}`);

    // ⏳ tăng delay để dễ thấy block
    await new Promise((resolve) => setTimeout(resolve, 8000));

    if (sender.length === 0) {
      throw new Error("Sender not found");
    }

    if (sender[0].balance < money) {
      throw new Error("Not enough money");
    }

    const [receiver] = await connection.query(
      "SELECT balance FROM accounts WHERE id=? FOR UPDATE",
      [to],
    );

    if (receiver.length === 0) {
      throw new Error("Receiver not found");
    }

    await connection.query(
      "UPDATE accounts SET balance = balance - ? WHERE id=?",
      [money, from],
    );

    await connection.query(
      "UPDATE accounts SET balance = balance + ? WHERE id=?",
      [money, to],
    );

    await connection.commit();

    console.log(`✅ COMMIT - from ${from}`);

    res.json({ message: "Slow transfer success" });
  } catch (err) {
    await connection.rollback();

    console.log(`❌ ROLLBACK - ${err.message}`);

    res.status(400).json({ error: err.message });
  }

  connection.release();
});
////----no transaction
app.post("/transfer-no-tx", async (req, res) => {
  const { from, to, amount } = req.body;
  const money = Number(amount);

  try {
    console.log("🚫 NO TRANSACTION START");

    // 🧠 1. READ balance (không lock)
    const [sender] = await db.query("SELECT balance FROM accounts WHERE id=?", [
      from,
    ]);

    if (sender.length === 0) {
      throw new Error("Sender not found");
    }

    console.log("📖 READ BALANCE:", sender[0].balance);

    // ⏳ 2. DELAY ở đây (cực kỳ quan trọng)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // ❗ 2 request sẽ đọc cùng 1 balance

    if (sender[0].balance < money) {
      throw new Error("Not enough money");
    }

    // 💥 3. UPDATE
    await db.query("UPDATE accounts SET balance = balance - ? WHERE id=?", [
      money,
      from,
    ]);

    await db.query("UPDATE accounts SET balance = balance + ? WHERE id=?", [
      money,
      to,
    ]);

    console.log("⚠️ NO TX DONE");

    res.json({ message: "Transfer without transaction" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// transfer tiền
app.post("/transfer", async (req, res) => {
  ///333

  ///333
  const { from, to, amount } = req.body;

  const money = Number(amount);

  // kiểm tra dữ liệu
  if (!Number.isFinite(money) || money <= 0) {
    return res.status(400).json({
      error: "Amount must be a positive number",
    });
  }

  if (from === to) {
    return res.status(400).json({
      error: "Cannot transfer to the same account",
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // const [sender] = await connection.query(
    //   "SELECT balance FROM accounts WHERE id=?",
    //   [from],
    // );
    const [sender] = await connection.query(
      "SELECT balance FROM accounts WHERE id=? FOR UPDATE",
      [from],
    );

    const [receiver] = await connection.query(
      "SELECT balance FROM accounts WHERE id=? FOR UPDATE",
      [to],
    );

    if (sender.length === 0) {
      throw new Error("Sender account not found");
    }

    if (sender[0].balance < money) {
      throw new Error("Not enough money");
    }

    await connection.query(
      "UPDATE accounts SET balance = balance - ? WHERE id=?",
      [money, from],
    );

    await connection.query(
      "UPDATE accounts SET balance = balance + ? WHERE id=?",
      [money, to],
    );

    await connection.query(
      "INSERT INTO transactions (from_account,to_account,amount) VALUES (?,?,?)",
      [from, to, money],
    );

    await connection.commit();

    res.json({ message: "Transfer success" });
    // } catch (err) {
    //   await connection.rollback();

    //   res.status(400).json({
    //     error: err.message,
    //   });
    // }
  } catch (err) {
    await connection.rollback();

    const status =
      err.message === "Not enough money" ||
      err.message === "Sender account not found"
        ? 400
        : 500;

    res.status(status).json({
      error: err.message,
    });
  }

  connection.release();
});

// simulate error để demo rollback
app.post("/transfer-error", async (req, res) => {
  const { from, to, amount } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      "UPDATE accounts SET balance = balance - ? WHERE id=?",
      [amount, from],
    );

    // giả lập lỗi hệ thống
    throw new Error("System crash");

    await connection.query(
      "UPDATE accounts SET balance = balance + ? WHERE id=?",
      [amount, to],
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();

    res.json({
      message: "Transaction failed → rollback executed",
    });
  }

  connection.release();
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
