const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();
const port = process.env.PORT

//with express.json(), express will automatically parse incoming json to and object that we can use
//after running this command we will be able to run req.body (from postman for example)
app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

app.listen(port);
