//initialize
const express = require("express");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const database = require("./dbInterface");

const router = express.Router();

///Client ID: 795121842066-1kdtnc9l0fqes29mneq0onujjls3hm6r.apps.googleusercontent.com
//Secret: r6Aoe9znt9wxCwl2-okrYEqX

// Authentication and Authorization Middleware
var authAdmin = function(req, res, next) {
  if (req.session && req.session.admin) return next();
  else return res.sendStatus(401);
};

// Authentication and Authorization Middleware
var userAuth = function(req, res, next) {
  console.log("user session check");
  console.log(req.session);
  console.log(req.params);
  if (
    req.session &&
    req.session.userid &&
    req.session.userid === parseInt(req.params.userid)
  )
    return next();
  else {
    console.log(here);
    return res.sendStatus(401);
  }
};

module.exports.userAuth = userAuth;
module.exports.authAdmin = authAdmin;

module.exports.routes = function() {
  router.post("/signup", signup);
  router.post("/login", login);
  router.get("/logout", logout);

  router.get("/:userid", userAuth, individual);
  router.put("/:userid", userAuth, edit);
  router.delete("/:userid", userAuth, remove);

  //Cart routes
  router.get("/:userid/cart", getCart);
 // router.get("/:userid/cart", userAuth, getCart);
  router.get("/:userid/cart/checkout", userAuth, checkoutCart);

  router.post("/:userid/cart", userAuth, updateCartItem);

  router.get("/:userid/cart/:productid", userAuth, getIndividualCartItem);
  router.put("/:userid/cart/:productid", userAuth, updateCartItem);
  router.delete("/:userid/cart/:productid", userAuth, removeCartItem);
  router.delete("/:userid/cart/all", userAuth, clearCart);

  return router;
};

/**
 * Processitem from cart of a user
 * @param {*} req
 * @param {*} res
 * @returns  {Promise} Promise List of Object cart details
 * {
 *  custId: Number,
 *  orderId: Number,
 *  totalCost: Number
 *  cart:[{ product_id: Number,
 *          cust_id: Number,
 *          quantity: Number,
 *          product_name: String,
 *          product_description: String,
 *          product_img: String,
 *          price: Number,
 *          total: Number }]
 * }
 */
async function checkoutCart(req, res) {
  const response = await database.processCart(req.body.cart.cust_id);
  if (response.success) {
    res.send(success.result);
    return;
  }
  if (response.errCode == 11) {
    res.status(404).send("Customer cart not found");
    return;
  }
  res.status(500).send("Unable process Cart");
}

/**
 * Get an individual item from cart of a user
 * @param {*} req
 * @param {*} res
 * @returns  {Promise} Promise List of Object of item details
 * [{
 *    product_id: Number,
 *    cust_id: Number,
 *    quantity: Number,
 *    product_name: String,
 *    product_description: String,
 *    product_img: String,
 *    price: Number,
 *    total:Number
 * }]
 *
 */
async function getCart(req, res) {
  //const response = await database.getCart(req.body.cart.cust_id);
  const response = await database.getCart(req.params.userid); // fixed code
// const response = await database.getCart(31); this works
  if (response.success) {
    res.send(response.result);
    return;
  }
  if (response.errCode == 11) {
    res.status(404).send("Customer not found");
    return;
  }
  console.log("Error", response.errMsg);
  res.status(500).send("Unable to get Cart");
}

/**
 * Update the quantity of a product users has in the cart.
 * Can be used to add, increase or decrease quantity.
 * @param {*} req
 * @param {*} res
 */
async function updateCartItem(req, res) {
  const response = await database.updateCartItem(
    req.body.cart.cust_id,
    req.body.cart.product_id,
    req.body.cart.quantity
  );

  if (response.success) {
    res.send(response.result);
  }
  console.log("Error", response.errMsg);
  //bad customer id
  if (response.errCode == 11) {
    res.status(404).send("Customer not found");
    return;
  }
  //bad product id, product may be added later
  if (response.errCode == 31) {
    res.status(404).send("Product not found");
    return;
  }

  res.status(500).send("Unable to add item");
}

/**
 * Get an individual item from cart of a user
 * @param {*} req
 * @param {*} res
 * @returns  {Promise} Promise Object with item details
 * {
 *  product_id: Number,
 *  cust_id: Number,
 *  quantity: Number,
 *  product_name: String,
 *  product_description: String,
 *  product_img: String,
 *  price: Number
  }

 */
async function getIndividualCartItem(req, res) {
  const response = await database.getIndividualCartItem(
    req.params.userid,
    req.params.product_id
  );
  if (response.success) {
    send.send(response.result);
    return;
  }
  if (response.errCode == 11) {
    res.status(404).send("Customer not found");
    return;
  }

  if (response.errCode == 41) {
    res.status(404).send("Item not in cart");
    return;
  }
  res.status(500).send("Unable to get individual item");
  return;
}
/**
 * Remove cart item
 * @param {*} req
 * @param {*} res
 */
async function removeCartItem(req, res) {
  const response = await database.deleteItemFromCart(
    req.params.userid,
    req.params.product_id
  );
  if (!response.success) {
    res.status(500).send("Unable to delete individual item");
    return;
  }

  send.send(response.result);
}

async function clearCart(req, res) {
  const response = await database.emptyCart(req.body.cart.cust_id);
  if (response.success) {
    console.log(response);
    res.send("Success");
  }

  if (response.errCode == 11) {
    res.status(404).send("Customer not found");
    return;
  }

  send.status(500).send("Unable to serve request");
  return;
}

async function individual(req, res) {
  var record = await database.getUserDetails(req.session.email);

  if (!record.success) {
    res.render("pages/user", {
      first_name: record.result.cust_f_name,
      last_name: record.result.cust_l_name,
      email: record.result.email,
      credit: record.result.credit,
      joined: record.result.join_date,
      items: []
    });
    return;
  }

  if (response.errCode == 11) {
    res.status(404).send("Customer not found");
    return;
  }
  res.status(500).send("Server error");
}

async function signup(req, res) {
  if (!req.body.user.username || !req.body.user.password) {
    res.status(401).send("creating user failed");
    return;
  }

  var record = await database.getUserDetails(req.body.user.username);
  if (record.success) {
    res.status(401).send("username taken");
    return;
  }

  if (req.body.user.password.length < 8) {
    res.status(400).send("Password too short (<8)");
    return;
  }

  var hash = bcrypt.hashSync(req.body.user.password, saltRounds);

  var result = await database.addNewUser(
    req.body.user.cust_f_name,
    req.body.user.cust_l_name,
    req.body.user.username,
    hash
  );

  // if (!result.success) {
  //   if (result.error.constraint == "email_check") {
  //     res.status(400).send("Bad email address");
  //     return;
  //   }
  console.log("result", result);
  if (!result.success) {
    //incorrect email format
    if (result.errCode == 22) {
      res.status(400).send("Bad email address");
      return;
    }

    res.status(500).send("Error serving request");
    return;
  }

  req.session.userid = result.result.cust_id;
  req.session.email = result.result.email;

  res.send("Signed up!");
}

function edit(req, res) {
  res.send("Edit");
}

/**
 * Remove user details from database.
 * Does not remove data entries.
 * @param {*} req
 * @param {*} res
 */
async function remove(req, res) {
  var record = await database.removeUser(req.session.userid);
  if (!record.success) {
    res.status(500).send("Unable to serve request");
    return;
  }

  req.session.destroy();
  res.send("User deleted");
}

async function login(req, res) {
  console.log(req.body);

  var record = await database.getUserDetails(req.body.user.username);

  console.log(record);
  if (!req.body.user.username || !req.body.user.password || !record.success) {
    res.status(401).send("login failed");
    return;
  }

  if (bcrypt.compareSync(req.body.user.password, record.result.cust_password)) {
    req.session.userid = record.result.cust_id;
    req.session.email = record.result.email;

    let successMessage = {};
    successMessage.username = record.result.email;
    successMessage.id = record.result.cust_id;

    
    
    res.send(successMessage);

    console.log(successMessage);
    return;
  }

  res.status(401).send("failed login");
}

function logout(req, res) {
  req.session.destroy();
  res.send("logged out");
}
