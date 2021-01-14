--Domain for email check
CREATE DOMAIN email AS VARCHAR (254) CHECK (
  VALUE ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'
);
CREATE TABLE Categories (
  cat_id SMALLINT,
  cat_name VARCHAR(100),
  PRIMARY KEY (cat_id),
  UNIQUE (cat_name),
  CONSTRAINT id_check CHECK (cat_id > 0)
);
--Products
CREATE TABLE Products (
  product_id SMALLINT,
  product_name VARCHAR(50),
  product_description TEXT,
  product_img TEXT,
  cat_id SMALLINT,
  price NUMERIC(7, 2),
  PRIMARY KEY (product_id),
  CONSTRAINT price_check CHECK (price > 0)
);
--Customers
CREATE TABLE Customers (
  cust_id SERIAL,
  cust_f_name TEXT,
  cust_l_name TEXT,
  email email,
  cust_password TEXT,
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  credit NUMERIC(7, 2) DEFAULT 50.00,
  PRIMARY KEY (cust_id),
  UNIQUE(email)
);
CREATE INDEX email_index ON Customers USING HASH (email);
--Has_Category
CREATE TABLE Has_Category (
  cat_id SMALLINT,
  product_id SMALLINT,
  PRIMARY KEY (cat_id, product_id),
  FOREIGN KEY (cat_id) REFERENCES Categories (cat_id) ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES Products (product_id) ON UPDATE CASCADE
);
-- Orders
CREATE TABLE Orders(
  --TODO need serial?
  order_id SERIAL,
  cust_id INTEGER,
  --TODO need time?
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_cost NUMERIC(7, 2),
  PRIMARY KEY (order_id),
  FOREIGN KEY (cust_id) REFERENCES Customers (cust_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT cost_check CHECK (total_cost > 0),
  CONSTRAINT time_check CHECK (order_date >= CURRENT_TIMESTAMP)
);
-- Purchased_Products
CREATE TABLE Purchased_Products(
  order_id INTEGER,
  product_id SMALLINT,
  quantity SMALLINT,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES Orders (order_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES Products (product_id) ON UPDATE CASCADE,
  CONSTRAINT quantity_check CHECK (quantity > 0)
);
-- Orders
CREATE TABLE Arch_Orders(
  arch_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  order_id SERIAL,
  cust_id INTEGER,
  --TODO need time?
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_cost NUMERIC(7, 2),
  PRIMARY KEY (order_id),
  FOREIGN KEY (cust_id) REFERENCES Customers (cust_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT arch_cost_check CHECK (total_cost > 0),
);
CREATE TABLE Arch_Purchases(
  order_id INTEGER,
  product_id SMALLINT,
  quantity SMALLINT,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES Arch_Orders (order_id) ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES Products (product_id) ON UPDATE CASCADE,
  CONSTRAINT arch_quantity_check CHECK (quantity > 0)
);
-- Shopping Cart
CREATE TABLE Carts(
  cust_id INTEGER DEFAULT 0,
  product_id INTEGER DEFAULT 0,
  quantity INTEGER,
  PRIMARY KEY (cust_id, product_id),
  FOREIGN KEY(cust_id) REFERENCES Customers (cust_id) ON UPDATE CASCADE
  SET
    DEFAULT,
    FOREIGN KEY(product_id) REFERENCES Products (product_id) ON UPDATE CASCADE
  SET
    DEFAULT,
    CONSTRAINT quantity_check CHECK (quantity > 0)
) -- Credit topup
CREATE TABLE Topups(
  cust_id INTEGER,
  amount NUMERIC(7, 2),
  topup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cust_id, topup_date),
  FOREIGN KEY (cust_id) REFERENCES Customers (cust_id),
  CONSTRAINT topup_check CHECK (amount > 0)
) --
-- atuo id sequence for products
CREATE SEQUENCE product_seq START 11
ALTER TABLE products
ALTER COLUMN
  product_id
SET
  DEFAULT nextval('product_seq' :: regclass) -- auto id sequence for categories
  CREATE SEQUENCE category_seq START 7
ALTER TABLE categories
ALTER COLUMN
  cat_id
SET
  DEFAULT nextval('category_seq' :: regclass) table -- auto id sequence for orders
  CREATE SEQUENCE order_seq START 1
ALTER TABLE orders
ALTER COLUMN
  order_id
SET
  DEFAULT nextval('order_seq' :: regclass) -- create table for shopping cart
  -- add extra columns to customers table to indicate admin status, and cart update time
ALTER TABLE Customers
ADD
  COLUMN is_admin SMALLINT DEFAULT 0
ALTER TABLE Customers
ADD
  COLUMN cart_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP --set feault customer
insert into customers (
    cust_id,
    cust_f_name,
    cust_l_name,
    email,
    cust_password
  )
values
  (
    0,
    '(default fname)',
    '(default lname)',
    'default@default.com',
    '(default password)'
  ) --set default
alter table carts
alter column
set
  default 0
ALTER TABLE carts
ALTER COLUMN
  cust_id
SET
  DEFAULT 0