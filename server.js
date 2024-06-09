/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Gaurav Amol Vedak
Student ID: 140524232
Date: 9th June, 2024
Vercel Web App URL: https://web322-app-ten.vercel.app/
GitHub Repository URL: https://github.com/GauravVedak/web322-app

********************************************************************************/

const express = require('express');
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

const path = require('path');

const storeService = require('./store-service');

app.use(express.static(__dirname + 'public')); 

app.get('/', (req, res) => {
    res.redirect('/about');
  });

  app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'));
  });

  app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
    .then((itemsPublished) => {
      res.json(itemsPublished);
    })
    .catch((err) => {
      res.send({message:err});
    });
  });

  app.get('/items', (req, res) => {
    storeService.getAllItems()
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      res.send({message:err});
    });
  });

  app.get('/categories', (req, res) => {
    storeService.getCategories()
    .then((categories) => {
      res.json(categories);
    })
    .catch((err) => {
      res.send({message:err});
    });
  });

  app.use((req, res, next) => {
    res.status(404).send("404 - We're unable to find what you're looking for.");
  });

storeService.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
    console.log(`server listening on: ${HTTP_PORT}`);
    });
  })
.catch((err) => {
    console.log(err);
});