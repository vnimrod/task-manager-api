const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const router = new express.Router();
const sharp = require("sharp");

const { sendWelcomeEmail, sendCanelationEmail } = require("../emails/account");

router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user: user, token: token });
  } catch (err) {
    res.status(400).send(err);
  }

  //WITHOUR ASYNC AWAIT
  // user
  //   .save()
  //   .then(() => {
  //     res.status(201).send(user);
  //   })
  //   .catch((err) => {
  //     res.status(400).send(err);
  //   });
});

//JWT - JASON WEB TOKEN,
router.post("/users/login", async (req, res) => {
  try {
    //findByCredentials is our own method created on models user.js
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken(); // our own function
    res.send({ user: user, token: token });
  } catch (err) {
    res.status(400).send();
  }
});

router.post("/users/logout", auth, async (req, res) => {
  //next is for logout from a specific device that we are logged in (computer, phone etc )
  try {
    //object token
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  //req.user running only if auth.js completed his run
  res.send(req.user);

  //below will not use the code below to find the user because we found him on auth already
  // try {
  //   //find({}) gives us all the users
  //   const users = await User.find({});
  //   res.send(users);
  // } catch (err) {
  //   res.status(500).send();
  // }
});

//router.patch is for updating existing resource
router.patch("/users/me", auth, async (req, res) => {
  //error handling when we try to update somthing that not exist on user like heigh
  const updates = Object.keys(req.body); //return the keys of the body
  const allowedUpdates = ["name", "email", "password", "age"];
  //every takes callback that called on every item on the array
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update); //return boolean if allowedUpdates includes the update value from req.body (that we send from postman)
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    //new will return the new updated user instead of the user before update by defult
    //
    // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });

    //below 4 lines are the same as the 4 line above, but in this way will help us with the middlware(pre, on user.js models) to run correctly
    // const user = await User.findById(req.params.id);

    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });

    await req.user.save();
    res.send(req.user);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    //IN THIS FUNCTION WE HAVE ACCESS TO req.user BEACUSE WE RUN AUTH BEFORE THE ASYNC FUNCTION

    // const user = await User.findByIdAndDelete(req.user._id);

    // if (!user) {
    //   return res.status(404).send();
    // }

    await req.user.remove();
    res.send(req.user);
    sendCanelationEmail(req.user.email, req.user.name);
  } catch (err) {
    res.status(500).send();
  }
});

const upload = multer({
  // dest: "avatars", //destantion folder for the image, it will save the imgas to the file system, and when we deploy the app that data will not deploy with it
  //insted we use req.file down below on the post request
  limits: {
    fileSize: 1000000,
  },
  //req contain the req we have made,
  //file for info about the file being uploaded,
  //cb - callback for tell multer that we finished
  fileFilter(req, file, cb) {
    //if the file dont match jpg, jpeg or png
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload only jpg or jpeg or png files"));
    }
    cb(undefined, true); //undefind say that nothing went wrong, then we provides the true if the upload should be expected
  },
});

//upload.single is the call for the middleware that we need, the string name on single is a name that we choose and thats the name we put on the request on postman on body form-data key
router.post("/users/me/avatar", auth, upload.single("avatar"),
  async (req, res) => {

    //buffer contains all the binary data for that file, we do that so we can deploy the app and also get access to our images, also the avatar property is a name the we choose it can be any.
    //also with that binary data we can access that image from the browser on jsbin we add <img src="data:image/jpg;base64,{the binary data img stored on the db}">
    //.resize() reduce the img that the user upload automatically to the sizes provided
    //.png() converts any img to a png format
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height:250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save();
    res.send();
  },
  //below is another middleware that we use for errors, we should use exactly all four arguments that express knows that that function is design to handle errors
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});

//next function is for serving up the binary data img so that user can see it in a new tab or by url
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    //next we will tell the user what img is that img, png? jpeg?
    //we use set for setting an header, get key value pair, first the name of the response we are trying to set, and the value we trying to set on it
    //with that header set, the binary data image will be converted to image that we can see on the browser on localhost:3000/user/{userId}/avatar
    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send();
  }
});

module.exports = router;
