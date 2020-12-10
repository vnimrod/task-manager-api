const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try{   
        //Authorization is the key value pair from postman read users
        const token = req.header("Authorization").replace("Bearer ", "") //by removing baerer with empty string we get the jwt value only
        const decoded = jwt.verify(token, process.env.JWT_SECRET); //we use this web token secret from env file /config/dev.env to hiding it when deploying the app
        console.log(decoded)
                                        //this object will find a user with the correct id who has that auth token(with tokens.token: token), for if he user logout this token is invalid
        const user = await User.findOne({ _id: decoded._id, "tokens.token": token })

        if(!user){
            throw new Error() // this will triger catch down below
        }
        
        //token will be used for logged out from the specief device that we was logged in from
        req.token = token
        //req.user, user is the name that we choose and later will be using it on index.js on (/users/me)
        req.user = user
        next();
    }catch(err) {
        res.status(401).send( {error: "Please authenticate." })
    }
};

module.exports = auth;
