const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "bank_demo",
});

// lấy danh sách account
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

// transfer money với transaction
app.post("/transfer", async (req, res) => {
  const { from, to, amount } = req.body;

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [sender] = await connection.query(
      "SELECT balance FROM accounts WHERE id=?",
      [from],
    );

    if (sender[0].balance < amount) {
      throw new Error("Not enough money");
    }

    await connection.query(
      "UPDATE accounts SET balance = balance - ? WHERE id=?",
      [amount, from],
    );

    await connection.query(
      "UPDATE accounts SET balance = balance + ? WHERE id=?",
      [amount, to],
    );

    // lưu lịch sử giao dịch
    await connection.query(
      "INSERT INTO transactions (from_account,to_account,amount) VALUES (?,?,?)",
      [from, to, amount],
    );

    await connection.commit();

    res.json({ message: "Transfer success" });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  }

  connection.release();
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
