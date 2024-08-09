//username : gauravvedakofficial
//password : 7K67oq1YlYjxI6rb
//connection-string : mongodb+srv://gauravvedakofficial:7K67oq1YlYjxI6rb@cluster0.sevnt61.mongodb.net/Cluster0?retryWrites=true&w=majority&appName=Cluster0
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User;

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(
      "mongodb+srv://gauravvedakofficial:7K67oq1YlYjxI6rb@cluster0.sevnt61.mongodb.net/Cluster0?retryWrites=true&w=majority&appName=Cluster0"
    );

    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });

    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = async function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          let newUser = new User({
            userName: userData.userName,
            password: hash,
            email: userData.email,
            loginHistory: [],
          });

          newUser
            .save()
            .then(() => {
              resolve();
            })
            .catch((err) => {
              if (err.code === 11000) {
                reject("User Name already taken");
              } else {
                reject("There was an error creating the user: " + err);
              }
            });
        })
        .catch((err) => {
          reject("There was an error encrypting the password");
          console.log(err); // Show any errors that occurred during the process
        });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName })
      .exec()
      .then((users) => {
        if (users.length === 0) {
          reject("Unable to find user: " + userData.userName);
        } else {
          bcrypt
            .compare(userData.password, users[0].password)
            .then((result) => {
              if (result === false) {
                reject("Incorrect Password for user: " + userData.userName);
              } else {
                users[0].loginHistory.push({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                });

                User.updateOne(
                  { userName: users[0].userName },
                  { $set: { loginHistory: users[0].loginHistory } }
                )
                  .exec()
                  .then(() => {
                    resolve(users[0]);
                  })
                  .catch((err) => {
                    reject("There was an error verifying the user: " + err);
                  });
              }
            })
            .catch((err) => {
              reject("There was an error comparing the password: " + err);
            });
        }
      })
      .catch((err) => {
        reject("Unable to find user: " + userData.userName);
      });
  });
};
