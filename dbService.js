const { Pool } = require("pg");

//Connection String for Heroku Database
const connectionString =
  "postgres://kpypptpqhdguyz:a6bf2e9b2f04a5ac9d26ee7cc7d1d3b4a5ae1de8bab2e3c77a22e2cb34778a07@ec2-107-21-102-221.compute-1.amazonaws.com:5432/daneo8u8t4jd20";

//Connection Pooling
const pool = new Pool({
  connectionString: connectionString,
  ssl: true
});

/**
 * Add new User to database.
 * @param {string} cust_f_name
 * @param {string} cust_l_name
 * @param {string} email
 * @param {string} cust_password
 * @returns {Promise} Promise of query.
 */
module.exports.addNewUser = async function(
  cust_f_name,
  cust_l_name,
  email,
  cust_password
) {
  const client = await pool.connect();
  console.log("email", email);
  return (
    client
      .query({
        text: `INSERT INTO
  Customers (cust_f_name, cust_l_name, email, cust_password) VALUES ($1, $2, $3, $4) RETURNING *`,
        values: [cust_f_name, cust_l_name, email, cust_password]
      })
      .then(res => res)
      //.catch(err => err)
      .finally(client.release())
  );
};

/**
 * Delete user and all related entries to user on database.
 */
module.exports.deleteUser = async function(id) {
  const client = await pool.connect();
  return (
    client
      .query({
        text: `DELETE FROM customers WHERE cust_id = $1 RETURNING *`,
        values: [id]
      })
      .then(res => res)
      //.catch(err => err)
      .finally(client.release())
  );
};

/**
 * Clear user, replacing personal details with default plaeholders using id.
 * @param id
 */
module.exports.removeUser = async function(id) {
  console.log("id", `removed_${parseInt(id).toString()}@email.com`);
  const client = await pool.connect();

  const newEmail = `removed_${parseInt(id).toString()}@email.com`;
  return (
    client
      .query({
        text: `UPDATE customers SET 
                  cust_f_name = $1,
                  cust_l_name = $2, 
                  email = $3, 
                  cust_password = $4
                WHERE cust_id = $5`,
        values: [
          `(removed_fName_${parseInt(id).toString()})`,
          `(removed_lName_${parseInt(id).toString()})`,
          `removed_${parseInt(id).toString()}@email.com`,
          `(removed_password_${parseInt(id).toString()})`,
          id
        ]
      })
      .then(res => res)
      //.catch(err => err)
      .finally(client.release())
  );
};

module.exports.getAllProducts = async function() {
  const client = await pool.connect();
  return client
    .query("SELECT * FROM Products")
    .then(res => res)
    .catch(err => err)
    .finally(client.release());
};

/**
 * Return Customer details from database.
 * @param {string} email
 */
module.exports.getUserDetails = async function(email) {
  const client = await pool.connect();
  return client
    .query({
      text: `SELECT * FROM Customers WHERE email = $1`,
      values: [email]
    })
    .then(res => res)
    .finally(client.release());
};

/**
 * Get cart of customer
 */
module.exports.getCustCart = async function(custId) {
  const client = await pool.connect();
  try {
    client.query("BEGIN");

    //check if customer exist
    const custQuery = await client.query(
      `SELECT * FROM customers WHERE cust_id = $1 FOR UPDATE`,
      [custId]
    );
    if (custQuery.rowCount != 1) {
      client.query("COMMIT");
      return -1;
    }

    const cartQuery = client.query({
      text: `SELECT c.product_id, product_name, product_img, price, quantity, (price*quantity) AS total 
              FROM carts c NATURAL JOIN products 
              WHERE cust_id = $1 
              ORDER BY product_name`,
      values: [custId]
    });
    client.query("COMMIT");
    return cartQuery;
  } catch (error) {
    client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports.getIndividualCartItem = async function(custId, productId) {
  const client = await pool.connect();
  try {
    client.query("BEGIN");
    //check if customer exist
    const custQuery = await client.query(
      `SELECT * FROM customers WHERE cust_id = $1 FOR UPDATE`,
      [custId]
    );
    if (custQuery.rowCount != 1) {
      client.query("COMMIT");
      return -1;
    }

    const itemQuery = await client.query({
      text: `SELECT * FROM carts NATURAL JOIN products WHERE cust_id = $1 AND product_id = $2`,
      values: [custId, productId]
    });

    client.query("COMMIT");
    return itemQuery;
  } catch (error) {
    client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update quantity of a  product of a customers cart to given amount.
 * If item is not already in cart then add entry by given amount.
 * @param {Number} custId
 * @param {Number} productId
 * @param {Number} quantity new amount set.
 * @return the updated entry in the database.
 */
module.exports.updateCartItem = async function(custId, productId, quantity) {
  //if new quantiry is '0' delete it from database instead.
  if (quantity == 0) {
    return this.deleteItemFromCart(custId, productId);
  }

  const client = await pool.connect();
  return client
    .query({
      text: `INSERT INTO carts (cust_id, product_id, quantity) VALUES ($1, $2, $3) 
        ON CONFLICT (cust_id, product_id) DO
          UPDATE SET quantity = ($4) RETURNING cust_id, product_id, quantity`,
      values: [custId, productId, quantity, quantity]
    })
    .then(res => res)
    .finally(client.release());
};

/**
 * Delete item from cart
 */
module.exports.deleteItemFromCart = async function(custId, productId) {
  const client = await pool.connect();
  try {
    client.query("BEGIN");
    //check if customer exist
    const custQuery = await client.query(
      `SELECT * FROM customers WHERE cust_id = $1 FOR UPDATE`,
      [custId]
    );
    if (custQuery.rowCount != 1) {
      client.query("COMMIT");
      return -1;
    }

    const delQuery = await client.query({
      text: `DELETE FROM carts WHERE cust_id = $1 AND product_id = $2 RETURNING *`,
      values: [custId, productId]
    });
    client.query("COMMIT");
    return delQuery;
  } catch (error) {
    client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Empty cart
 */
module.exports.emptyCart = async function(custId) {
  const client = await pool.connect();

  try {
    client.query("BEGIN");
    //check if customer exist
    const custQuery = await client.query(
      `SELECT * FROM customers WHERE cust_id = $1 FOR UPDATE`,
      [custId]
    );
    if (custQuery.rowCount != 1) {
      client.query("COMMIT");
      return -1;
    }

    const delQuery = await client.query({
      text: `DELETE FROM carts WHERE cust_id = $1 RETURNING cust_id`,
      values: [custId]
    });
    client.query("COMMIT");
    return delQuery;
  } catch (error) {
    client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

/**
 *
 */
module.exports.processCart = async function(custId) {
  console.log("processoing", custId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const custValue = [custId];

    const userQuery = "SELECT FROM customers WHERE cust_id = $1";
    const userRes = await client.query(userQuery, custValue);
    //check for user existence

    if (userRes.rowCount == 0) {
      await client.query("COMMIT");
      return -1;
    }

    //save cart list and costs
    const selectQuery = `SELECT c.product_id, product_name, product_img, price, quantity, (price*quantity) AS total 
        FROM carts c NATURAL JOIN products 
        WHERE cust_id = $1 
        ORDER BY product_name 
        FOR UPDATE`;
    const cartList = await client.query(selectQuery, custValue);
    //check for empty cart
    if (cartList.rowCount == 0) {
      await client.query("COMMIT");
      return -2;
    }
    //calculate total
    const costQuery = `SELECT SUM(quantity*price) as total FROM carts NATURAL JOIN products WHERE cust_id = $1 GROUP BY cust_id`;

    const costRes = await client.query(costQuery, custValue);

    const totalCost = costRes.rows[0].total;
    // console.log("costRes", totalCost);

    //update customer credit and last cart
    const custQuery =
      "UPDATE customers SET credit = (credit-$1), cart_update = CURRENT_TIMESTAMP  WHERE cust_id = $2";
    const custValues = [totalCost, custId];
    await client.query(custQuery, custValues);

    //create order
    const orderQuery =
      "INSERT INTO orders (cust_id, total_cost) VALUES($1, $2) RETURNING order_id";
    const orderValue = [custId, totalCost];
    const orderRes = await client.query(orderQuery, orderValue);
    const orderId = orderRes.rows[0].order_id;

    //delete items
    const deleteQuery =
      "DELETE FROM carts WHERE cust_id = $1 RETURNING product_id, quantity";

    const deletedRes = await client.query(deleteQuery, custValue);
    // console.log("delRes");

    //insert deleted items into purchase_products
    let productIds = [];
    let quantity = [];
    let values = "";
    //convert the delete items in string form for query
    deletedRes.rows.forEach(e => {
      values += `(${orderId},${parseInt(e.product_id)},${parseInt(
        e.quantity
      )}),`;
      productIds.push(parseInt(e.product_id));
      quantity.push(parseInt(e.quantity));
    });
    //remove final comma ","
    values = values.substring(0, values.length - 1);

    //"values" should be safe since its values taken from directly from database
    const insertQuery =
      "INSERT INTO purchased_products(order_id, product_id, quantity) VALUES" +
      values;

    // console.log(productIds, quantity);
    const insertRes = await client.query(insertQuery);
    // console.log("insertRes");
    await client.query("COMMIT");

    return {
      custId: custId,
      orderId: orderId,
      cart: cartList.rows,
      totalCost: totalCost
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

/**
 * Search products by term
 */
module.exports.productSearch = async function(searchTerm, categories) {
  const client = await pool.connect();
  let searchQuery = `SELECT DISTINCT product_id, product_name, product_description, product_img, price FROM (SELECT * FROM products p NATURAL JOIN has_category NATURAL JOIN categories WHERE product_name LIKE '%'||$1||'%' OR product_description LIKE '%'||$1||'%') as a`;
  let searchValues = [searchTerm];
  let searchCategories = "";

  if (categories.length > 0) {
    searchCategories = ` WHERE ( cat_name = $${2}`;
    if (typeof categories != "string") {
      searchValues.push(categories[0]);
      for (i = 1; i < categories.length; i++) {
        searchCategories += ` OR cat_name = $${i + 2}`;
        searchValues.push(categories[i]);
      }
    } else {
      searchValues.push(categories);
    }
    searchCategories += ")";
    searchQuery += searchCategories;
  }
  //searchCategories = `AND ( cat_name = '${categories[0]}')`;
  // searchQuery += " GROUP BY product_id";
  console.log("cat ", searchQuery, searchValues);

  return client
    .query(searchQuery, searchValues)
    .then(res => res)
    .finally(client.release());
};

module.exports.updateUserCredit = async function(custId, amount) {
  const client = pool.connect();

  try {
    await client.query("BEGIN");
    //insert toup into topup table
    const topupQuery = "INSERT INTO topups (cust_id, amount) VALUES ($1, $2)";
    const topupValues = [amount, custId];
    client.query(topupQuery, topupValues);

    //update details on customers table
    const custQuery =
      "UPDATE customers SET credit = (credit+$1), WHERE cust_id = $2 RETURNING *";
    const custValues = [custId];
    const custRes = client.query(custQuery, custValues);

    await client.query("COMMIT");

    return custRes;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
/**
 * Get user topups
 */
module.exports.getUserTopups = async function(custId) {
  const client = await pool.connect();
  const query =
    "SELECT amount, topup_date FROM topups WHERE cust_id = $1 ORDER BY topup_date DESC";
  const values = [custId];

  return client
    .query(query, values)
    .then(res => res)
    .finally(client.release());
};

module.exports.archiveOrder = async function(orderId) {
  console.log("starrt archive", orderId);

  const client = await pool.connect();
  try {
    //     await client.query(`WITH del AS (SELECT  * FROM purchased_products WHERE order_id = 33)
    // select * from  customers natural join del`);
    console.log("done");
    await client.query("BEGIN");

    const orderValue = [orderId];

    //check if order exist

    //delete from order
    const selOrderQuery = `SELECT order_id, cust_id, order_date, total_cost
                              FROM orders WHERE order_id = $1`;
    const selOrderRes = await client.query(selOrderQuery, orderValue);

    //nothing deleted means order doesnt exist
    if (selOrderRes.rowCount == 0) {
      await client.query("COMMIT");
      return -1;
    }
    const orderItem = selOrderRes.rows[0];
    //insert to archive order
    const insArchOrdQuery = `INSERT INTO arch_orders (order_id, cust_id, order_date, total_cost) 
                              VALUES ($1, $2, $3, $4) RETURNING *`;
    const insArchOrdValues = [
      orderItem.order_id,
      orderItem.cust_id,
      orderItem.order_date,
      orderItem.total_cost
    ];
    const insArchOrdRes = await client.query(insArchOrdQuery, insArchOrdValues);
    const archived_date = insArchOrdRes.rows[0];

    //transfer pucharse t

    const purchProdQuery = `WITH del AS (DELETE FROM purchased_products WHERE order_id = $1 RETURNING *)
                              INSERT INTO arch_purchases (order_id, product_id, quantity) 
                              SELECT order_id, product_id, quantity FROM del
                              RETURNING *`;

    const purchProdRes = await client.query(purchProdQuery, orderValue);

    const delOrderQuery = "DELETE FROM orders WHERE order_id = $1 RETURNING *";
    const delOrderRes = await client.query(delOrderQuery, orderValue);

    //delete from purchase
    //insert intoarhivedpurcahse
    await client.query("COMMIT");
    console.log("archive done");
    return {
      order: orderItem,
      purchases: delOrderRes.rows
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
module.exports.test = async function() {
  return this.a;
  // let products = [];
  // let quantity = [];

  // const insertQuery =
  //   "INSERT INTO aa(a, b, c) SELECT $1 custId, prodId, quan FROM unnest($2::integer[]) prodId, unnest($3::integer[]) quan";
  // const values = [7, [8, 9, 10], [8, 7, 6]];

  // const client = await pool.connect();

  // client
  //   .query(insertQuery, values)
  //   .then(res => console.log(res))
  //   .catch(err => console.log(err));
};
// SELECT p.product_id, product_name, product_description, product_img, price FROM products p NATURAL JOIN categories WHERE product_name LIKE '%""%' OR product_description LIKE '%""%' AND ( cat_name = 'Foods') GROUP BY product_id
// SELECT p.product_id, product_name, product_description, product_img, price FROM products p NATURAL JOIN categories

// SELECT p.product_id, product_name, product_description, product_img, price FROM products p NATURAL JOIN has_category NATURAL JOIN categories WHERE product_name LIKE '%c%' OR product_description LIKE '%c%' AND ( cat_name = 'Drinks') GROUP BY product_id
// SELECT p.product_id, product_name, product_description, product_img, price FROM products p NATURAL JOIN has_category NATURAL JOIN categories WHERE product_name LIKE '%c%' OR product_description LIKE '%c%' AND ( cat_name = 'Foods') GROUP BY product_id

// "SELECT product_id, product_name, product_description, product_img, price FROM
// (SELECT * FROM products p NATURAL JOIN has_category NATURAL JOIN categories WHERE product_name LIKE '%c%'
// OR product_description LIKE '%c%') as a WHERE (cat_name = 'Drinks');

`WITH del AS (SELECT  * FROM purchased_products WHERE order_id = 33)
select * from  customers natural join del`;
