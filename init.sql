USE bank_demo;

CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  balance DECIMAL(10,2) check (balance >= 0)
);
CREATE TABLE accounts_no_tx (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  balance DECIMAL(10,2) 
);

-- Insert initial data into accounts table
INSERT INTO accounts(id,name,balance) VALUES
(1,'Alice',1000),
(2,'Bob',500),
(3,'Charlie',2000);

-- Create a table to log account creation
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_account INT,
  to_account INT,
  amount INT CHECK (amount > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- message VARCHAR(255),

  CONSTRAINT fk_from_account
    FOREIGN KEY (from_account)
    REFERENCES accounts(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_to_account
    FOREIGN KEY (to_account)
    REFERENCES accounts(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
-- Create a table to log account creation
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(20),
  table_name VARCHAR(50),
  record_id INT,
  old_data JSON,
  new_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$
-- Create a stored procedure to add a new account
CREATE PROCEDURE add_account (
    IN p_name VARCHAR(100),
    IN p_initial_balance DECIMAL(12,2)
)
BEGIN
    INSERT INTO accounts (name, balance)
    VALUES (p_name, p_initial_balance);
END$$
DELIMITER ;

DELIMITER $$
-- Create a trigger to log account creation
CREATE TRIGGER trg_account_insert
AFTER INSERT ON accounts
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (action, table_name, record_id, new_data)
  VALUES (
    'INSERT',
    'accounts',
    NEW.id,
    JSON_OBJECT(
      'name', NEW.name,
      'balance', NEW.balance
    )
  );
END$$

DELIMITER ;

DELIMITER $$
-- Create a trigger to log account updates
CREATE TRIGGER trg_account_update
AFTER UPDATE ON accounts
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  VALUES (
    'UPDATE',
    'accounts',
    NEW.id,
    JSON_OBJECT(
      'balance', OLD.balance
    ),
    JSON_OBJECT(
      'balance', NEW.balance
    )
  );
END$$

DELIMITER ;

