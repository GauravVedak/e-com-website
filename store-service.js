const { json } = require("express");
const fs = require("fs");
const { resolve } = require("node:path");
const path = require("path");

var items = [];
var categories = [];

function initialize() {
  return new Promise((resolve, reject) => {
    const pathOfItems = path.join(__dirname, "data", "items.json");
    const pathOfCategories = path.join(__dirname, "data", "categories.json");
    fs.readFile(pathOfItems, "utf8", (err, data) => {
      if (err) {
        reject("unable to read file: 'items.json'");
      } else {
        try {
          items = JSON.parse(data);
          fs.readFile(pathOfCategories, "utf8", (err, data) => {
            if (err) {
              reject("unable to read file: 'categories.json'");
            } else {
              try {
                categories = JSON.parse(data);
                resolve();
              } catch {
                reject("unable to convert file's contents: 'categories.json'");
              }
            }
          });
        } catch {
          reject("unable to convert file's contents: 'items.json'");
        }
      }
    });
  });
}

function getAllItems() {
  return new Promise((resolve, reject) => {
    var itemLength = items.length;
    if (itemLength > 0) {
      resolve(items);
    } else {
      reject("No results returned");
    }
  });
}

function getPublishedItems() {
  return new Promise((resolve, reject) => {
    var itemsPublished = [];

    for (var i = 0; i < items.length; i++) {
      if (items[i].published == true) {
        itemsPublished.push(items[i]);
      }
    }
    if (itemsPublished.length > 0) {
      resolve(itemsPublished);
    } else {
      reject("no results returned");
    }
  });
}

function getPublishedItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    var itemsPublishedByCategory = [];

    for (var i = 0; i < items.length; i++) {
      if (items[i].published == true && items[i].category == category) {
        itemsPublishedByCategory.push(items[i]);
      }
    }
    if (itemsPublishedByCategory.length > 0) {
      resolve(itemsPublishedByCategory);
    } else {
      reject("No results returned");
    }
  });
}

function getCategories() {
  return new Promise((resolve, reject) => {
    if (categories.length > 0) {
      resolve(categories);
    } else {
      reject("No results returned");
    }
  });
}

function addItem(itemData) {
  return new Promise((resolve, reject) => {
    if (itemData.published == undefined) {
      itemData.published = false;
    } else {
      itemData.published = true;
    }
    itemData.postDate = new Date().toISOString().split("T")[0];
    itemData.id = items.length + 1;
    items.push(itemData);
    resolve(itemData);
  });
}

function getItemsByCategory(category) {
  return new Promise((resolve, reject) => {
    let matchingItems = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].category == category) {
        matchingItems.push(items[i]);
      }
    }
    if (matchingItems.length > 0) {
      resolve(matchingItems);
    } else {
      reject("No results returned");
    }
  });
}

function getItemsByMinDate(minDateStr) {
  return new Promise((resolve, reject) => {
    let matchItems = [];
    for (let i = 0; i < items.length; i++) {
      let itemPostDate = new Date(items[i].postDate);
      let queryMinDate = new Date(minDateStr);
      if (itemPostDate >= queryMinDate) {
        matchItems.push(items[i]);
      }
    }
    if (matchItems.length > 0) {
      resolve(matchItems);
    } else {
      reject("No results returned");
    }
  });
}

function getItemById(id) {
  return new Promise((resolve, reject) => {
    let matchingItem = undefined;
    for (let i = 0; i < items.length; i++) {
      if (items[i].id == id) {
        matchingItem = items[i];
      }
    }
    if (matchingItem != undefined) {
      resolve(matchingItem);
    } else {
      reject("No result returned");
    }
  });
}

module.exports = {
  getAllItems,
  getCategories,
  getPublishedItems,
  initialize,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
};
