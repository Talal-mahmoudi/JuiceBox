require('dotenv').config();
const express = require('express');
const server = express();
const morgan = require('morgan');

const {client } = require('./db');

server.use(morgan('dev'));

server.use(express.json());

server.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body);
    console.log("<_____Body Logger END_____>");
  
    next();
  });

server.use('/api', (req, res, next) => {
    console.log("A request was made to /api");
    next();
});
  
// server.get('/api', (req, res, next) => {
//     console.log("A get request was made to /api");
//     res.send({ message: "success" });
// });

const apiRouter = require('./routes');
server.use('/api', apiRouter);


client.connect();
server.listen(3000, () => {
  console.log('The server is up on port 3000')
});