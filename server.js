const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: "dl5a51ejc",
  api_key: "988189816345359",
  api_secret: "nxAtOoyjcDKvsWQ4e2bDDuSr6dc",
  secure: true,
});

const upload = multer();

const storeService = require("./store-service");

app.use(express.static(__dirname + "public"));

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/about.html"));
});

app.get("/shop", (req, res) => {
  storeService
    .getPublishedItems()
    .then((itemsPublished) => {
      res.json(itemsPublished);
    })
    .catch((err) => {
      res.send({ message: err });
    });
});

app.get("/items", (req, res) => {
  let category = req.query.category;
  let minDate = req.query.minDate;

  if (category != undefined) {
    storeService
      .getItemsByCategory(category)
      .then((matchingItems) => {
        res.json(matchingItems);
      })
      .catch((err) => {
        res.send({ message: err });
      });
  } else if (minDate != undefined) {
    storeService
      .getItemsByMinDate(minDate)
      .then((matchItems) => {
        res.json(matchItems);
      })
      .catch((err) => {
        res.send({ message: err });
      });
  } else {
    storeService
      .getAllItems()
      .then((items) => {
        res.json(items);
      })
      .catch((err) => {
        res.send({ message: err });
      });
  }
});

app.get("/item/:id", (req, res) => {
  let id = req.params.id;

  storeService
    .getItemById(id)
    .then((item) => {
      res.json(item);
    })
    .catch((err) => {
      res.send({ message: err });
    });
});

app.get("/categories", (req, res) => {
  storeService
    .getCategories()
    .then((categories) => {
      res.json(categories);
    })
    .catch((err) => {
      res.send({ message: err });
    });
});
app.get("/items/add", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "addItem.html"));
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

    storeService.addItem(req.body).then((newItem) => {
      res.redirect("/items");
    });
  }
});

app.use((req, res, next) => {
  res.status(404).send("404 - We're unable to find what you're looking for.");
});

storeService
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`server listening on: ${HTTP_PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
