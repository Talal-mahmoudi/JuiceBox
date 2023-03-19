const express = require('express');
const tagsRouter = express.Router();

const {getAllTags, getPostsByTagName} = require('../db');

tagsRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");

//   res.send({ message: 'hello from /users!' });
    next();
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    // read the tagname from the params
    const { tagName } = req.params;

    try {
        // use our method to get posts by tag name from the db
        // send out an object to the client { posts: // the posts }
        const retrievePosts = await getPostsByTagName(tagName);
        const filteredPosts = retrievePosts.filter(post=>{
            return post.active || (req.user && post.author.id === req.user.id);
        });
        res.send({posts: filteredPosts});    

    } catch ({ name, message }) {
        // forward the name and message to the error handler
        next({
            name,
            message
        });
    }
  });

tagsRouter.get('/', async (req,res)=>{
    try {
        
        const tags = await getAllTags();
        res.send({
            tags
        });

    } catch (error) {
        console.log(error);
    }
});

module.exports = tagsRouter;