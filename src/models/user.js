const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

//the second object that we pass to User on const User = mongoose.model("User", userSchema) below will be automatically turned into schema by moongose
//with creating a schema by our self, it will allows us to take advantage of middlware
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, //removing extra spaces
    },
    email: {
      type: String,
      //unique will create an index in our mongodb db to gerentee uniqeness in a way that no one can register with the same email
      //for getting unique to work we need to delete(drop) the db and just re saving any file on vs code to re create it
      unique: true,
      required: true,
      trim: true,
      lowercase: true, //convert email to lowercase before saving it
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    password: {
      type: String,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password'");
        }
      },
    },

    age: {
      type: Number,
      default: 0,
      //customize validator for age
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number");
        }
      },
    },
    //with creating a tokens array of objects will giving the user to be able to login from the laptop and from the phone
    //without the array when we login to both devices and logout only from one of them, the user will not be able to logout from the second device
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      // this going to allows us to store our buffer with our binary img data right in the db along side the user that the img belongs to
      type: Buffer,
    },
  },
  {
    timestamps: true, //time stap for createdAt and updatedAt
  }
);

//virtual is a realtionship between two entities, it not actual data on the database
userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

//next methos is for not exposing the user password and tokens in the response back, this function will always be called whenever we use the User model
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar

  return userObject;
};

//methods are making the function accessible on the instances - user.{somthing} (lowercase u)
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  //we using process.env.JWT_SECRET from our dev.env file to hide that info when deploying the app
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token: token });
  await user.save();
  return token;
};
//NEXT WE CREATING THE LOGIN FUNCTION THAT WILL BE USE IN user.js ON ROUTES, THE FUNCTION VERIFY THE EMAIL AND PASSWORD ON LOGIN
//by using statics we will be able to access directly from the user on model

//statics are making the function accessible on models - User.{somthing}
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to login");
  }

  return user;
};

//NEXT WE WILL HASH THE PLAIN TEXT PASSWORD BEFORE USER CREATED OR UPDATED HIS PASS WITH THE SCHEMA VALIDATION MIDDLEWARE
//userSchema.pre used for doing somthing before an event, somthing like before validation
//userSchema.post used for doing somthing after an event, somthing like after the user has been saved

//this refers to the document that we are going to save
//here we are saying "i want to do somthing before users are saved", this refers to the users that are about to save
userSchema.pre("save", async function (next) {
  const user = this;

  console.log("just before saving!");

  //true if the user first created or updated password
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

//delete all user tasks when user is removed
userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
