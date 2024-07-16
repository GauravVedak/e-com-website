/*********************************************************************************
 *  WEB322 – Assignment 04
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Gaurav Amol Vedak Student ID: 140524232 Date: 16th July, 2024
 *
 *  Vercel Web App URL: https://web322-app-gauravvedaks-projects.vercel.app
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

app.get("/items", (req, res) => {
  let category = req.query.category;
  let minDate = req.query.minDate;

  if (category != undefined) {
    itemData
      .getItemsByCategory(category)
      .then((matchingItems) => {
        res.render("items", { items: matchingItems });
      })
      .catch((err) => {
        res.render("items", { message: "no results" });
      });
  } else if (minDate != undefined) {
    itemData
      .getItemsByMinDate(minDate)
      .then((matchItems) => {
        res.render("items", { items: matchItems });
      })
      .catch((err) => {
        res.render("items", { message: "no results" });
      });
  } else {
    itemData
      .getAllItems()
      .then((items) => {
        res.render("items", { items: items });
      })
      .catch((err) => {
        res.render("items", { message: "no results" });
      });
  }
});

app.get("/item/:id", (req, res) => {
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

app.get("/categories", (req, res) => {
  itemData
    .getCategories()
    .then((categories) => {
      res.render("categories", { categories: categories });
    })
    .catch((err) => {
      res.render("categories", { message: "no results" });
    });
});
app.get("/items/add", (req, res) => {
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

app.post("/items/add", upload.single("featureImage"), (req, res) => {
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
});

app.use((req, res, next) => {
  res.status(404).render("404");
});

itemData
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
