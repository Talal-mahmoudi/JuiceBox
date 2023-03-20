require('dotenv').config();
const { Client } = require('pg');
// const client = new Client('postgres://localhost:5432/juicebox-dev');
const client = new Client(process.env.DATABASE_URL);

async function createUser({ 
    username, 
    password,
    name,
    location
  }) {
    try {
      const { rows: [ user ] } = await client.query(`
        INSERT INTO users(username, password, name, location) 
        VALUES($1, $2, $3, $4) 
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
      `, [username, password, name, location]);
      console.log("This is the createUser's user obj");
      console.log(user);
  
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  async function updateUser(id, fields = {}) {
    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    // return early if this is called without fields
    if (setString.length === 0) {
      return;
    }
  
    try {
      const { rows: [ user ] } = await client.query(`
        UPDATE users
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields));
  
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  async function getAllUsers() {
    try {
      const { rows } = await client.query(`
        SELECT id, username, name, location, active 
        FROM users;
      `);
  
      return rows;
    } catch (error) {
      throw error;
    }
  }
  
  async function getUserById(userId) {
    try {
      const { rows: [ user ] } = await client.query(`
        SELECT id, username, name, location, active
        FROM users
        WHERE id=${ userId };
      `);
      console.log(user);
  
      if (!user) {
        return null
      }
  
      user.posts = await getPostsByUser(userId);
  
      return user;
    } catch (error) {
      throw error;
    }
  }
  
  
  async function createPost({
    authorId,
    title,
    content,
    tags = []
  }) {
    try {
      const { rows: [ post ] } = await client.query(`
        INSERT INTO posts("authorId", title, content) 
        VALUES($1, $2, $3)
        RETURNING *;
      `, [authorId, title, content]);
      
      const tagList = await createTags(tags);
      return await addTagsToPost(post.id, tagList);
  
    //   return post;
    } catch (error) {
      throw error;
    }
  }
  
  async function updatePost(id, fields = {}) {
    
    const {tags} = fields;
    delete fields.tags;
    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    // return early if this is called without fields
    // if (setString.length === 0) {
    //   return;
    // }
  
    try {
        if(setString.length >0){
            // const { rows: [ post ] } = 
            await client.query(`
                UPDATE posts
                SET ${ setString }
                WHERE id=${ id }
                RETURNING *;
            `, Object.values(fields));
        }
        if(tags === undefined){
            return await getPostById(id);
        }
        const tagList = await createTags(tags);
        const tagListIdString = tagList.map(
            tag => `${tag.id}`
        ).join(', ');

        await client.query(`
            DELETE FROM post_tags
            WHERE "tagId"
            NOT IN (${tagListIdString})
            AND "postId"=$1;
        `, [id]);

        await addTagsToPost(id, tagList);

        return await getPostById(id);

    //   return post;
    } catch (error) {
      throw error;
    }
  }
  
  async function getAllPosts() {
    try {
      const { rows: postIds } = await client.query(`
        SELECT id
        FROM posts;
      `);
      console.log(postIds);
    //   console.log("Testing")
        
        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));
        // console.log("tesing");
        
      return posts;
    } catch (error) {
      throw error;
    }
  }
  
  async function getPostsByUser(userId) {
    try {
      const { rows: postIds} = await client.query(`
        SELECT id
        FROM posts
        WHERE "authorId"=${ userId };
      `);
      const posts = await Promise.all(postIds.map(
        post => getPostById(post.id)
      ));
  
      return posts;
    } catch (error) {
      throw error;
    }
  }
  

  async function createTags(tagList) {
    if (tagList.length === 0) { 
      return; 
    }

    const insertValues = tagList.map(
      (_, index) => `$${index + 1}`).join('), (');
    
    const selectValues = tagList.map(
      (_, index) => `$${index + 1}`).join(', ');

    try {

        await client.query(`
            INSERT INTO tags(name)
            VALUES (${insertValues})
            ON CONFLICT (name) DO NOTHING;
        `, Object.values(tagList));

        

        const {rows} = await client.query(`
            SELECT * FROM tags
            WHERE name
            IN (${selectValues});
        `,Object.values(tagList));
        console.log(rows);
        return rows;
      // select all tags where the name is in our taglist
      // return the rows from the query
    } catch (error) {
      throw error;
    }
  }
  async function createPostTag(postId, tagId) {
    try {
      await client.query(`
        INSERT INTO post_tags("postId", "tagId")
        VALUES ($1, $2)
        ON CONFLICT ("postId", "tagId") DO NOTHING;
      `, [postId, tagId]);
    } catch (error) {
      throw error;
    }
  }

  async function addTagsToPost(postId, tagList) {
    try {
        console.log(postId)
      const createPostTagPromises = tagList.map(
        tag => createPostTag(postId, tag.id)
      );
        console.log("calling createPostTag")
      await Promise.all(createPostTagPromises);
        console.log("calling promise");
      return await getPostById(postId);
    } catch (error) {
      throw error;
    }
  }


  async function getPostById(postId) {
    try {
        // console.log(postId);
      const { rows: [ post ]  } = await client.query(`
        SELECT *
        FROM posts
        WHERE id=$1;
      `, [postId]);
    //  console.log("finished first query")
      const { rows: tags } = await client.query(`
        SELECT tags.*
        FROM tags
        JOIN post_tags ON tags.id=post_tags."tagId"
        WHERE post_tags."postId"=$1;
      `, [postId])
        // console.log(post);
        // console.log("finished");
        if(!post) {
            throw{
                name: "PostNotFoundError",
                message: "could not find a post with that postId"
            };
        }
      const { rows: [author] } = await client.query(`
        SELECT id, username, name, location
        FROM users
        WHERE id=$1;
      `, [post.authorId])
  
      post.tags = tags;
      post.author = author;
  
      delete post.authorId;
  
      return post;
    } catch (error) {
      throw error;
    }
  }

  async function getPostsByTagName(tagName) {
    try {
      const { rows: postIds } = await client.query(`
        SELECT posts.id
        FROM posts
        JOIN post_tags ON posts.id=post_tags."postId"
        JOIN tags ON tags.id=post_tags."tagId"
        WHERE tags.name=$1;
      `, [tagName]);
  
      return await Promise.all(postIds.map(
        post => getPostById(post.id)
      ));
    } catch (error) {
      throw error;
    }
  }

  async function getAllTags() {
    try {
      const { rows } = await client.query(`
        SELECT * 
        FROM tags;
      `);
  
      return rows
    } catch (error) {
      throw error;
    }
  }
  async function getUserByUsername(username) {
    try {
      const { rows} = await client.query(`
        SELECT *
        FROM users
        WHERE username=$1;
      `,[username]);
      console.log("This is the getUserByUsername function");
        console.log(rows[0]);
      
      
      if(rows.length){
        console.log("user already exists");
        rows[0].posts = await getPostsByUser(rows[0].id);
        return rows[0];
      }else{
        return undefined;
      }
    //   return ;
    } catch (error) {
      throw error;
    }
  }

module.exports = {
    client,
    getUserByUsername,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
    getUserById,
    getPostById,
    createTags,
    addTagsToPost,
    createPostTag,
    addTagsToPost,
    getPostsByTagName,
    getAllTags
}
