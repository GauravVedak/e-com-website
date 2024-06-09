const { json } = require('express');
const fs = require('fs');
const { resolve } = require('node:path');

var items = [];
var categories = [];

function initialize(){
    return new Promise((resolve, reject) => {
        fs.readFile('./data/items.json', 'utf8', (err, data) => {
            if(err) {
                reject("unable to read file: 'items.json'")
            }
            else {
                try{
                    items = JSON.parse(data);
                    fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                        if (err) {
                            reject("unable to read file: 'categories.json'");
                        }
                        else {
                            try{
                                categories = JSON.parse(data);
                                resolve();
                            }
                            catch{
                                reject("unable to convert file's contents: 'categories.json'");
                            }
                        }
                    });}
                catch{
                    reject("unable to convert file's contents: 'items.json'");
                }
            }
        });
    });
}

function getAllItems(){
    return new Promise((resolve, reject) => {
        var itemLength = items.length;
        if (itemLength>0){
            resolve(items);
    }
    else {
        reject("No results returned");
        }
    });
}

function getPublishedItems(){
    return new Promise((resolve, reject) => {
        var itemsPublished= [];
        
        for(var i =0; i<items.length; i++){
            if(items[i].published==true){
                itemsPublished.push(items[i]);
            }
        }
        if(itemsPublished.length > 0){
            resolve(itemsPublished);
        }
        else{
            reject("no results returned");
        }
    });
}

function getCategories(){
    return new Promise((resolve, reject) => {
        if (categories.length>0){
            resolve(categories);
    }
    else {
        reject("No results returned");
        }
    });
}

module.exports = {getAllItems, getCategories, getPublishedItems, initialize};