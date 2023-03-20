const express = require('express');
const postsRouter = express.Router();

const {requireUser} = require('./utils');
const {getAllPosts, createPost, updatePost, getPostById} = require('../db');

// postsRouter.post('/', requireUser, async(req,res,next)=>{
//     res.send({message: 'under construction'});
// });
postsRouter.post('/', requireUser, async(req,res,next)=>{
    const {title, content, tags=""} = req.body;
    const tagArr = tags.trim().split(/\s+/)
    const postData = {};

    if(tagArr.length){
        postData.tags = tagArr;
    }
    if(req.user){
        postData.authorId = req.user.id;
    }
    if(title){
        postData.title = title;

    }
    if(content){
        postData.content = content;
    }
    try {
        // const {authorId, title, content} = req.body
        // postData.authorId = authorId;
        // postData.title = title;
        // postData.content = content;
        //add authorId, title, content to postData object;
        // const post = await createPost(postData.authorId, postData.title, postData.content);
        const post = await createPost(postData);
        if(post){
            res.send({post});
        }else{
            next({
                name: "IncorrectPostDats",
                message: "You did a lot of things wrong :(" 
            });
        }


    } catch ({name, message}) {
        next({name, message});
    }
});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;
    
    const updateFields = {};
    
    if (tags && tags.length > 0) {
        updateFields.tags = tags.trim().split(/\s+/);
    }
    
    if (title) {
        updateFields.title = title;
    }
    
    if (content) {
        updateFields.content = content;
    }
    
    try {
        const originalPost = await getPostById(postId);
    
        if (originalPost.author.id === req.user.id) {
            const updatedPost = await updatePost(postId, updateFields);
            res.send({ post: updatedPost })
        } else {
            next({
            name: 'UnauthorizedUserError',
            message: 'You cannot update a post that is not yours'
            })
        }
    } catch ({ name, message }) {
        next({ name, message });
    }
});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
        const post = await getPostById(req.params.postId);
    
        if (post && post.author.id === req.user.id) {
            const updatedPost = await updatePost(post.id, { active: false });
    
            res.send({ post: updatedPost });
        } else {
            // if there was a post, throw UnauthorizedUserError, otherwise throw PostNotFoundError
            next(post ? { 
            name: "UnauthorizedUserError",
            message: "You cannot delete a post which is not yours"
            } : {
            name: "PostNotFoundError",
            message: "That post does not exist"
            });
      }
  
    } catch ({ name, message }) {
      next({ name, message })
    }
  });

postsRouter.use((req, res, next) => {
  console.log("A request is being made to /posts");

//   res.send({ message: 'hello from /users!' });
    next();
});

postsRouter.get('/', async (req,res)=>{
    try {
        
        const allPosts = await getAllPosts();
        const allActivePosts = allPosts.filter(post=>{
            // if(post.author.active){
            //     return true;
            // }
            // return false;
            //or
            return post.author.active;
        })
        const posts = allActivePosts.filter(post=>{
            // if(post.active){
            //     return true;
            // }
            // if(req.user && post.author.id == req.user.id){
            //     return true;
            // }
            // return false;
            //or
            return post.active || (req.user && post.author.id === req.user.id);
        })
        res.send({
            posts
        });

    } catch (error) {
        console.log(error);
    }
});

module.exports = postsRouter;