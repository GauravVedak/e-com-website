/*********************************************************************************
 *  WEB322 – Assignment 06
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part of this
 *  assignment has been copied manually or electronically from any other source (including web sites) or
 *  distributed to other students.
 *
 *  Name:  Gaurav Amol Vedak
 *  Date:  8th August, 2024
 *  Student ID:  140524232
 *  Vercel Web App URL: https://web322-app-ten.vercel.app
 *
 *  GitHub Repository URL: https://github.com/GauravVedak/web322-app
 *
 ********************************************************************************/
const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const exphbs = require("express-handlebars");
const handlebars = require("handlebars");
const pg = require("pg");
const mongoose = require("mongoose");
const authData = require("./auth-service");
const clientSessions = require("client-sessions");

app.use(
  clientSessions({
    cookieName: "session",
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.set("views", path.join(__dirname, "views"));

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: {
      navLink: function (url, options) {
        return (
          '<li class="nav-item"><a ' +
          (url == app.locals.activeRoute
            ? ' class="nav-link active" '
            : ' class="nav-link" ') +
          ' href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
      formatDate: function (dateObj) {
        let year = dateObj.getFullYear();
        let month = (dateObj.getMonth() + 1).toString();
        let day = dateObj.getDate().toString();
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      },
    },
  })
);

app.set("view engine", ".hbs");

cloudinary.config({
  cloud_name: "dl5a51ejc",
  api_key: "988189816345359",
  api_secret: "nxAtOoyjcDKvsWQ4e2bDDuSr6dc",
  secure: true,
});

const upload = multer();

const itemData = require("./store-service");

app.use(express.static(__dirname + "public"));

app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/shop");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "item" by category
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await itemData.getPublishedItems();
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    // get the latest item from the front of the list (element 0)
    let item = items[0];

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.item = item;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await itemData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

app.get("/items", ensureLogin, (req, res) => {
  let category = req.query.category;
  let minDate = req.query.minDate;

  const spawnItems = (data) => {
    if (data.length > 0) {
      res.render("items", { items: data });
    } else {
      res.render("items", { message: "no results" });
    }
  };

  if (category != undefined) {
    itemData
      .getItemsByCategory(category)
      .then(spawnItems)
      .catch(() => {
        res.render("items", { message: "no results" });
      });
  } else if (minDate != undefined) {
    itemData
      .getItemsByMinDate(minDate)
      .then(spawnItems)
      .catch(() => {
        res.render("items", { message: "no results" });
      });
  } else {
    itemData
      .getAllItems()
      .then(spawnItems)
      .catch(() => {
        res.render("items", { message: "no results" });
      });
  }
});

app.get("/item/:id", ensureLogin, (req, res) => {
  let id = req.params.id;

  itemData
    .getItemById(id)
    .then((item) => {
      res.json(item);
    })
    .catch((err) => {
      res.send({ message: err });
    });
});

app.get("/categories", ensureLogin, (req, res) => {
  itemData
    .getCategories()
    .then((categories) => {
      if (categories.length > 0) {
        res.render("categories", { categories });
      } else {
        res.render("categories", { message: "no results" });
      }
    })
    .catch((err) => {
      res.render("categories", { message: "no results" });
    });
});

app.get("/items/add", ensureLogin, (req, res) => {
  res.render("addItem");
});

app.get("/shop/:id", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // declare empty array to hold "item" objects
    let items = [];

    // if there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      items = await itemData.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await itemData.getPublishedItems();
    }

    // sort the published items by itemDate
    items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));

    // store the "items" and "item" data in the viewData object (to be passed to the view)
    viewData.items = items;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the item by "id"
    viewData.item = await itemData.getItemById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await itemData.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", { data: viewData });
});

app.post(
  "/items/add",
  ensureLogin,
  upload.single("featureImage"),
  (req, res) => {
    if (req.file) {
      let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
      }

      upload(req).then((uploaded) => {
        processItem(uploaded.url);
      });
    } else {
      processItem("");
    }

    function processItem(imageUrl) {
      req.body.featureImage = imageUrl;

      itemData.addItem(req.body).then((newItem) => {
        res.redirect("/items");
      });
    }
  }
);

app.get("/items/add", ensureLogin, (req, res) => {
  itemData
    .getCategories()
    .then((data) => {
      res.render("addItem", { categories: data });
    })
    .catch((err) => {
      res.render("addItem", { categories: [] });
    });
});

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render("addCategory");
});

app.post("/categories/add", ensureLogin, (req, res) => {
  itemData
    .addCategory(req.body)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.send("An error occured while trying to add the category");
    });
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  itemData
    .deleteCategoryById(req.params.id)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Category / Category not found");
    });
});

app.get("/items/delete/:id", ensureLogin, (req, res) => {
  itemData
    .deleteItemById(req.params.id)
    .then(() => {
      res.redirect("/items");
    })
    .catch((err) => {
      res.status(500).send("Unable to Remove Item / Item not found");
    });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", { successMessage: "User created" });
    })
    .catch((err) => {
      res.render("register", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName, //authenticated user's userName
        email: user.email, //authenticated user's email
        loginHistory: user.loginHistory, //authenticated user's loginHistory
      };
      res.redirect("/items");
    })
    .catch((err) => {
      res.render("login", { errorMessage: err, userName: req.body.userName });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.use((req, res, next) => {
  res.status(404).render("404");
});

itemData
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
