const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const { findOneAndDelete } = require("../models/task");
const router = new express.Router();

router.post("/tasks", auth, async (req, res) => {
  // const task = new Task(req.body);

  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err);
  }

  // task
  //   .save()
  //   .then(() => {
  //     res.status(201).send(task);
  //   })
  //   .catch((err) => {
  //     res.status(400).send(err);
  //   });
});

//GET /tasks?completed=true

// limit , skip - pagination
//GET /tasks?limit=10&skip=10 - limit the amount of results we getting back on every request
//- skip allowes us to iterate over pages, so if limit=10&skip=0 we get the first 10 result and get the first page, if limit=10&skip=10 we getting the second page
//GET /tasks?sortBy=createdAt:{asc || desc} - sorting the tasks
router.get("/tasks", auth, async (req, res) => {
  //with match we are filtering the data that the use will ask, like fetch only completed tasks
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true"; //we doing an if statment because without it the req.query.completed will be string and not boolean
  }

  if(req.query.sortBy){
    const parts = req.query.sortBy.split(":")
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1
  }

  try {
    // const tasks = await Task.find({});
    //populate allows us to to get reference to other documents, in our case realtions between user and tasks, its same as const tasks we define one line above
    await req.user
      .populate({
        path: "tasks",
        match: match,
        options: { //using for pagination and sorting
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort: sort
        }
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (err) {
    res.status(500).send();
  }
  // Task.find({})
  //   .then((tasks) => {
  //     res.send(tasks);
  //   })
  //   .catch(() => {
  //     res.status(500).send();
  //   });
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    // const task = await Task.findById(_id);
    const task = await Task.findOne({ _id: _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (err) {
    res.status(500).send();
  }

  // Task.findById(_id)
  //   .then((task) => {
  //     if (!task) {
  //       return res.status(404).send();
  //     }

  //     res.send(task);
  //   })
  //   .catch(() => {
  //     res.status(500).send();
  //   });
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    // const task = await Task.findById(req.params.id);
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => {
      task[update] = req.body[update];
    });

    await task.save();

    res.send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    // const task = await Task.findByIdAndDelete(req.params.id);
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
