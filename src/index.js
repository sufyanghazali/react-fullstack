const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const path = require("path");

const url = "mongodb://localhost:27017";
const client = new MongoClient(url);
const dbName = "my-blog";

const withDB = async (operations, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    await operations(db);
    client.close();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/build")));

app.get("/hello", (req, res) => {
  res.send("Hello");
});

app.get("/hello/:name", (req, res) => {
  res.send(`Hello ${req.params.name}`);
});

app.get("/api/articles/:name", async (req, res) => {
  const articleName = req.params.name;

  withDB(async (database) => {
    const article = await database
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(article);
  }, res);
});

app.post("/hello", (req, res) => {
  res.send(`Hello ${req.body.name}!`);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  const articleName = req.params.name;

  withDB(async (db) => {
    const article = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: article.upvotes + 1,
        },
      }
    );

    const updatedArticle = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticle);
  }, res);
});

app.post("/api/articles/:name/comment", async (req, res) => {
  const { name } = req.params;
  const { username, text } = req.body;

  withDB(async (db) => {
    const article = await db.collection("articles").findOne({ name });

    console.log(article);

    await db.collection("articles").updateOne(
      {
        name,
      },
      {
        $set: {
          comments: [...article.comments, { username, text }],
        },
      }
    );

    const updatedArticle = await db.collection("articles").findOne({ name });

    res.status(200).json(updatedArticle);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => {
  console.log("Server up. Listening on port 8000.");
});
