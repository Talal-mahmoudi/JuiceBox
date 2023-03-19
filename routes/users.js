const express = require('express');
require('dotenv').config();
const usersRouter = express.Router();

const jwt = require('jsonwebtoken');
async function myJwt(){
    let mySignedToken = await jwt.sign({"username": "albert", "password": "bertie99"}, process.env.JWT_SECRET)
    console.log(mySignedToken);
}
// myJwt();

const {getAllUsers, getUserByUsername, createUser} = require('../db');

usersRouter.use((req, res, next) => {
  console.log("A request is being made to /users");

//   res.send({ message: 'hello from /users!' });
    next();
});

usersRouter.get('/', async (req,res)=>{
    try {

        const users = await getAllUsers();
        res.send({
            users
        });

    } catch (error) {
        console.log(error);
    }
});
usersRouter.post('/login', async (req,res,next)=>{
    const {username,password} = req.body;

    if(!username || !password){
        next({
            name: "MissingCredentialsError",
            message: "Please supply both a username and password"
        });
    }
    try {
        const user = await getUserByUsername(username);
        if(user && user.password == password){
            const token = await jwt.sign({username, password}, process.env.JWT_SECRET)
            res.send({message: "you're logged in!", token: token});
        }else{
            next({
                name: 'IncorrectCredentialError',
                message: 'Username or password is incorrect'
            })
        }
    } catch (error) {
        console.log(error);
        next(error);
        
    }
    // console.log(req.body);
    // res.end();
});

usersRouter.post('/register', async (req, res, next) => {
    const { username, password, name, location } = req.body;
    // console.log("req.body");
    try {
        // console.log("start of the try block");
      const _user = await getUserByUsername(username);
        // console.log("getuserByUsername");
      if (_user) {
        next({
          name: 'UserExistsError',
          message: 'A user by that username already exists'
        });
      }
  
      const user = await createUser({
        username,
        password,
        name,
        location,
      });
      console.log(user);
    //   const {id} = user
      const token = jwt.sign({ 
        id: user.id,
        username
      }, process.env.JWT_SECRET, {
        expiresIn: '1w'
      });
  
      res.send({ 
        message: "thank you for signing up",
        token 
      });
    } catch ({ name, message }) {
      next({ name, message })
    } 
  });

module.exports = usersRouter;

//or

// module.exports = {
//     usersRouter
// }