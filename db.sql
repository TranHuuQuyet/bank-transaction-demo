CREATE DATABASE bank_demo;
USE bank_demo;

CREATE TABLE accounts (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(50),
 balance INT
);

INSERT INTO accounts(name,balance) VALUES
('Alice',1000),
('Bob',500);