const express = require('express');
const apiRouter = express.Router();

const jwt = require('jsonwebtoken');
const {getUserById, getUserByUsername} = require('../db');
const {JWT_SECRET} = process.env;

apiRouter.use(async(req,res,next)=>{
    console.log("This is the top of the routeHandler");
    const prefix='Bearer ';
    const auth = req.header('Authorization');

    if(!auth){
        next();
    }else if(auth.startsWith(prefix)){
        console.log("TOP of else-if block");
        const token = auth.slice(prefix.length);
        console.log(token);
        try {
            console.log("top of the try block");
            const jwtId = jwt.verify(token, JWT_SECRET);
            const {username} = jwtId;
            console.log(jwtId);
            console.log("username: " +username);
            if(username){
                console.log("top of the if statement in the try block");
                req.user = await getUserByUsername(username);
                console.log("Logging req.user" + req.user);
                next();
            }
        } catch ({name, message}) {
            next({name, message});
        }
    }else{
        next({
            name: 'AuthorizationHeaderError',
            message: `Authorization token must start with ${prefix}`
        });
    }
});
apiRouter.use((req,res,next) =>{
    if(req.user){
        console.log("User is set: ",req.user);
    }
    next();
});

const usersRouter = require('./users');
const postsRouter = require('./posts');
const tagRouter = require('./tags');
apiRouter.use('/users', usersRouter);
apiRouter.use('/posts', postsRouter);
apiRouter.use('/tags', tagRouter);

apiRouter.use((error,req,res,next)=>{
    res.send({
        name: error.name,
        message: error.message
    });
});


module.exports = apiRouter;