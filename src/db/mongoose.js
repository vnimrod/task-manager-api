const mongoose = require("mongoose");

//we using process.env.MONGODB_URL from our dev.env file to hide that info when deploying the app
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  //next two properties will prevent warnings
  useUnifiedTopology: true,
  useFindAndModify: false
});


//Examples

//THIS USER WILL BE IN MODELS USER.JS
// const validator = require("validator");
// const User = mongoose.model("User", {
//   name: {
//     type: String,
//     required: true,
//     trim: true, //removing extra spaces
//   },
//   email: {
//     type: String,
//     required: true,
//     trim: true,
//     lowercase: true, //convert email to lowercase before saving it
//     validate(value) {
//       if (!validator.isEmail(value)) {
//         throw new Error("Email is invalid");
//       }
//     },
//   },
//   password: {
//     type: String,
//     minlength: 7,
//     trim: true,
//     validate(value) {
//       if (value.toLowerCase().includes("password")) {
//         throw new Error("Password cannot contain 'password'");
//       }
//     },
//   },

//   age: {
//     type: Number,
//     default: 0,
//     //customize validator for age
//     validate(value) {
//       if (value < 0) {
//         throw new Error("Age must be a positive number");
//       }
//     },
//   },
// });

// const me = new User({
//   name: "Nimi    ",
//   age: "30",
//   email: "Nimi@gmail.com",
//   password: "1234567",
// });

// //Save to db
// me.save()
//   .then((me) => {
//     console.log(me);
//   })
//   .catch((err) => {
//     console.log("Erorr!", err);
//   });

//TASK WILL BE ON MODELS task.js
// const Task = mongoose.model("Task", {
//   description: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   completed: {
//     type: Boolean,
//     defualt: false,
//   },
// });

// const task = new Task({
//   description: "Shopping",
//   completed: true,
// });

// task
//   .save()
//   .then((task) => {
//     console.log(task);
//   })
//   .catch((err) => {
//     console.log("Error!", err);
//   });
