const pg = require("pg");
const Sequelize = require("sequelize");
var sequelize = new Sequelize("SenecaDB", "SenecaDB_owner", "zoICrkvnS1x6", {
  host: "ep-crimson-bird-a55ryn7u-pooler.us-east-2.aws.neon.tech",
  dialect: "postgres",
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
  query: { raw: true },
});

var Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  itemDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

var Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Item.belongsTo(Category, { foreignKey: "category" });

sequelize
  .sync()
  .then(() => {
    console.log("The models were successfully synchronized without any issues");
  })
  .catch((err) => {
    console.error("There was an issue synchronizing the models:", err);
  });

function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject("Unable to sync the database");
      });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        published: true,
        category: category,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {
    itemData.published = itemData.published ? true : false;
    for (var property in itemData) {
      if (itemData[property] == "") {
        itemData[property] = null;
      }
    }
    itemData.itemDate = new Date();

    Item.create(itemData)
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject("Unable to create item");
      });
  });
}

function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        category: category,
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

function getItemsByMinDate(minDateStr) {
  const { gte } = Sequelize.Op;
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        itemDate: {
          [gte]: new Date(minDateStr),
        },
      },
    })
      .then((data) => {
        resolve(data);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        id: id,
      },
    })
      .then((data) => {
        resolve(data[0]);
      })
      .catch(() => {
        reject("No results returned");
      });
  });
}

function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
    for (var property in categoryData) {
      if (categoryData[property] == "") {
        categoryData[property] = null;
      }
    }

    Category.create(categoryData)
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject("Unable to create category");
      });
  });
}

function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
    Category.destroy({
      where: { id: id },
    })
      .then((deleted) => {
        if (deleted) {
          resolve();
        } else {
          reject("Couldn't find the id of that category");
        }
      })
      .catch(() => {
        reject("Unable to delete the category");
      });
  });
}

function deleteItemById(id) {
  return new Promise((resolve, reject) => {
    Item.destroy({
      where: { id: id },
    })
      .then((deleted) => {
        if (deleted) {
          resolve();
        } else {
          reject("Couldn't find the id of that item");
        }
      })
      .catch(() => {
        reject("Unable to delete the item");
      });
  });
}

module.exports = {
  Item,
  Category,
  sequelize,
  getAllItems,
  getCategories,
  getPublishedItems,
  initialize,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCategory,
  deleteCategoryById,
  deleteItemById,
};
