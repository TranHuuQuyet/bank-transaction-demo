USE bank_demo;

CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50),
  balance DECIMAL(10,2) CHECK (balance >= 0)
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
  message VARCHAR(255),

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
DELIMITER $$
-- Create a stored procedure to add a new account
CREATE PROCEDURE add_account (
    IN P_ID INT,
    IN p_name VARCHAR(100),
    IN p_initial_balance DECIMAL(12,2)
)
BEGIN
    INSERT INTO accounts (id, name, balance)
    VALUES (P_ID, p_name, p_initial_balance);
END$$
DELIMITER ;

DELIMITER $$

-- Create a trigger to log account creation
DROP TRIGGER IF EXISTS trg_log_account_creation;
CREATE TRIGGER trg_log_account_creation
AFTER INSERT ON accounts
FOR EACH ROW
BEGIN
    INSERT INTO transactions (message)
    VALUES (CONCAT('Account created: ', NEW.name));
END$$

DELIMITER ;


