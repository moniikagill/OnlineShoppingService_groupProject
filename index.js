const express = require("express");
const app = express();
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);

const user = require("./user");
const database = require("./dbInterface");

const port = process.env.PORT || 8080;

app.use(
  session({
    store: new SQLiteStore(),
    secret: "test secret",
    resave: true,
    saveUninitialized: true
  })
);

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(function(req, res, next) {
  res.locals.username = req.session.hasOwnProperty("email")
    ? req.session.email
    : "";
  res.locals.uid = req.session.hasOwnProperty("userid")
    ? req.session.userid
    : "";
  next();
});

app.use("/api/user", user.routes()); // REST API

// index page
app.get("/", function(req, res) {
  res.render("pages/index");
});

app.get("/products", async (req, res) => {
  try {
    if (!req.query.hasOwnProperty("search")) {
      req.query.search = "";
    }

    if (!req.query.hasOwnProperty("category")) {
      req.query.category = [];
    }

    //TEMP FIX req.query.category => [req.query.category]
    const response = await database.productSearch(
      req.query.search,
      req.query.category
    );
    console.log(response);
    res.render("pages/products", {
      rows: await response.result
    });
  } catch (err) {
    console.log("fetch failed", err);
    res.status(500).send(err);
  }
});
// for the cart
app.post("/api/getCustId", async (req, res) => {
  try {
    const response = await getCustId(req, res);
    res.send(JSON.stringify(response));
  } catch (err) {
    console.log("fetch failed", err);
    res.status(500).send(err);
  }
});

async function getCustId(req, res) {
  console.log("Req " + req.body.user.email); 
  var record = await database.getUserDetails(req.body.user.email);

  if (!record.success) {
    res.status(500).send("Server error");
    return;
  }
  console.log("get cut id", res);
  return record.result.cust_id;
}

// post for the cart
app.post("/api/postCart", async (req, res) => {
  try {
    const response = await database.updateCartItem(
      req.body.cart.cust_id,
      req.body.cart.product_id,
      req.body.cart.quantity
    );
    console.log(response);
    res.send("Success");
  } catch (err) {
    console.log("fetch failed", err);
    res.status(500).send(err);
  }
});

app.get("/test", async (req, res) => {
  database.test();
});
app.use(express.static("public"));

app.listen(port, function() {
  console.log("Listening on " + port);
});
