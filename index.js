const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const e = require("express");
const dotenv = require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 8080;
//mongodb connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connect to Databse"))
  .catch((err) => console.log(err));

//schema
const userSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  username: {
    type: String,
    unique: true,
  },
  password: String,
  confirmpassword: String,
  image: String,
});
//model
const userModel = mongoose.model("user", userSchema);

//api
app.get("/", (req, res) => {
  res.send("Server is running");
});
//signup
app.post("/signup", (req, res) => {
  console.log(req.body);
  const { email, username } = req.body;

  userModel
    .findOne({ $or: [{ email: email }, { username: username }] })
    .exec()
    .then((result) => {
      if (result) {
        if (result.email === email) {
          res.send({ message: "Email Already Exist", alert: "false" });
        } else if (result.username === username) {
          res.send({ message: "Username Already Exist", alert: "false" });
        }
      } else {
        const data = userModel(req.body);
        const save = data.save();
        res.send({ message: "Create account successfully", alert: "true" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
});

//signin
app.post("/signin", (req, res) => {
  console.log(req.body);
  const { email } = req.body;
  userModel
    .findOne({ email: email })
    .exec()
    .then((result) => {
      if (result) {
        console.log(result);
        const dataSend = {
          _id: result._id,
          email: result.email,
          username: result.username,
          image: result.image,
        };
        console.log(dataSend);
        res.send({
          message: "Sign In successfully",
          alert: "true",
          data: dataSend,
        });
      } else {
        res.send({
          message: "Email not avialable,plase sign up",
          alert: "false",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
});

//game section
const gameSchema = mongoose.Schema(
  {
    image: String,
    name: String,
    platform: String,
    genre: String,
    rating: String,
    publisher: String,
    dateAdded: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const gameModel = mongoose.model("game", gameSchema);

//add game by admin
app.post("/addgame", async (req, res) => {
  console.log(req.body);
  const { name } = req.body;
  const { platform } = req.body;
  gameModel
    .findOne({ name: name }, { platform: platform })
    .exec()
    .then((result) => {
      if (result) {
        if (result.platform === platform) {
          if (result.name === name) {
            res.send({ message: "Game Already Exist", alert: "false" });
          }
        }
      } else {
        const data = gameModel(req.body);
        const datasave = data.save();
        res.send({ message: "Game added successfully", alert: "true" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
});

// get game data
app.get("/game", (req, res) => {
  gameModel
    .find({})
    .exec()
    .then((data) => {
      res.send(JSON.stringify(data));
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
});

// Search game by name
app.get("/searchgame", (req, res) => {
  const { name } = req.query;

  const regex = new RegExp(`^${name}`, "i");

  gameModel
    .find({ name: { $regex: regex } })
    .exec()
    .then((data) => {
      if (data.length > 0) {
        res.status(200).json(data);
      } else {
        gameModel
          .findOne({ name })
          .exec()
          .then((game) => {
            if (game) {
              res.status(200).json([game]);
            } else {
              res.status(404).json({ message: "Game not found" });
            }
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

// Edit game
app.put("/editgame/:id", (req, res) => {
  const { id } = req.params;
  const { image, name, platform, genre, rating, publisher } = req.body;
  gameModel
    .findByIdAndUpdate(
      id,
      {
        image: image,
        name: name,
        platform: platform,
        genre: genre,
        rating: rating,
        publisher: publisher,
      },
      { new: true }
    )
    .exec()
    .then((updatedGame) => {
      res.send({
        message: "Game updated successfully",
        game: updatedGame,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

// Delete game
app.delete("/deletegame/:id", (req, res) => {
  const { id } = req.params;

  gameModel
    .findByIdAndDelete(id)
    .exec()
    .then((game) => {
      if (game) {
        res.status(200).json({ message: "Game deleted successfully" });
      } else {
        res.status(404).json({ message: "Game not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

// Get game details by ID
app.get("/game/:id", (req, res) => {
  const { id } = req.params;
  gameModel
    .findById(id)
    .exec()
    .then((game) => {
      if (game) {
        res.send(JSON.stringify(game));
      } else {
        res.status(404).json({ message: "Game not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//get user data
app.get("/user", (req, res) => {
  userModel
    .find({})
    .exec()
    .then((data) => {
      res.send(JSON.stringify(data));
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
});

//get user data by id
app.get("/user/:id", (req, res) => {
  const { id } = req.params;
  userModel
    .findById(id)
    .exec()
    .then((user) => {
      if (user) {
        res.send(JSON.stringify(user));
      } else {
        res.status(404).json({ message: "User not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
});


// Update user data by ID and check if email or username already exist
app.put("/updateuser/:id", (req, res) => {
  const { id } = req.params;
  const { email, username, password, confirmpassword, image } = req.body;
  userModel
    .findById(id)
    .exec()
    .then((user) => {
      if (user) {
        if (user.email === email) {
          res.send({ message: "Email Already Exist", alert: "false" });
        } else if (user.username === username) {
          res.send({ message: "Username Already Exist", alert: "false" });
        } else {
          userModel
            .findByIdAndUpdate(
              id,
              {
                email: email,
                username: username,
                password: password,
                confirmpassword: confirmpassword,
                image: image,
              },
              { new: true }
            )
            .exec()
            .then((updatedUser) => {
              res.send({
                message: "User updated successfully",
                user: updatedUser,
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ message: "Internal Server Error" });
            });
        }
      } else {
        res.status(404).json({ message: "User not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//collection section
const collectionSchema = mongoose.Schema(
  {
    name: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    gameIds: [mongoose.Schema.Types.Mixed],
  },
  { timestamps: true }
);
const collectionModel = mongoose.model("collection", collectionSchema);

//Create collection
app.post("/createcollection", (req, res) => {
  const { name, userId, gameId } = req.body;
  collectionModel
    .findOne({ name: name, user: userId, game: gameId })
    .exec()
    .then((result) => {
      if (result) {
        res.send({ message: "Collection Already Exist", alert: "false" });
      } else {
        // Create a new collection
        const newCollection = collectionModel({
          name: name,
          user: userId,
          gameId: gameId,
        });
        // Save the collection to the database
        newCollection
          .save()
          .then((savedCollection) => {
            res.send({
              message: "Collection created successfully",
              alert: "true",
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(500).send({ message: "Internal Server Error" });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
});

// add game id to collection
app.post("/collection/addgame/:id", (req, res) => {
  const { id } = req.params;
  const { gameId } = req.body;
  collectionModel
    .findById(id)
    .exec()
    .then((collection) => {
      if (collection) {
        if (collection.gameIds.includes(gameId)) {
          res.send({
            message: "Game already exists in the collection",
            alert: "false",
          });
        } else {
          collectionModel
            .findByIdAndUpdate(
              id,
              {
                $push: { gameIds: gameId },
              },
              { new: true }
            )
            .exec()
            .then((updatedCollection) => {
              res.send({
                message: "Game added to collection successfully",
                alert: "true",
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ message: "Internal Server Error" });
            });
        }
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

// Get all collections
app.get("/collection", (req, res) => {
  collectionModel
    .find({})
    .populate("user")
    .exec()
    .then((collections) => {
      res.send(JSON.stringify(collections));
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
});

// Get collection by ID
app.get("/collection/:id", (req, res) => {
  const { id } = req.params;
  collectionModel
    .findById(id)
    .populate("user")
    .exec()
    .then((collection) => {
      if (collection) {
        res.send(JSON.stringify(collection));
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//get game id from collection id
app.get("/collection/game/:id", (req, res) => {
  const { id } = req.params;
  collectionModel
    .findById(id)
    .populate("gameIds")
    .exec()
    .then((collection) => {
      if (collection) {
        res.send(JSON.stringify(collection));
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//edit collection
app.put("/updatecollection/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  collectionModel
    .findByIdAndUpdate(id, { name: name }, { new: true })
    .exec()
    .then((updatedCollection) => {
      res.send({
        message: "Collection updated successfully",
        collection: updatedCollection,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//delete collection
app.delete("/deletecollection/:id", (req, res) => {
  const { id } = req.params;
  collectionModel
    .findByIdAndDelete(id)
    .exec()
    .then((collection) => {
      if (collection) {
        res.status(200).json({ message: "Collection deleted successfully" });
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//delete gameID from collectionID
app.delete("/collection/:id/deletegame/:gameid", (req, res) => {
  const { id, gameid } = req.params;
  collectionModel
    .findByIdAndUpdate(
      id,
      {
        $pull: { gameIds: gameid },
      },
      { new: true }
    )
    .exec()
    .then((collection) => {
      if (collection) {
        res.status(200).json({ message: "Game deleted successfully" });
      } else {
        res.status(404).json({ message: "Game not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

// Get collection by user ID
app.get("/collection/user/:id", (req, res) => {
  const { id } = req.params;
  collectionModel
    .find({ user: id })
    .populate("user")
    .exec()
    .then((collection) => {
      if (collection) {
        res.send(JSON.stringify(collection));
      } else {
        res.status(404).json({ message: "Collection not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//server running
app.listen(PORT, () => console.log("Server is running on port :" + PORT));

//Request section
const requestSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    image: String,
    name: String,
    platform: String,
    genre: String,
    rating: String,
    publisher: String,
    dateAdded: { type: Date, default: Date.now },
    state: String,
  },
  { timestamps: true }
);
const requestModel = mongoose.model("request", requestSchema);

//add request by user
app.post("/createrequest", (req, res) => {
  const { userId, image, name, platform, genre, rating, publisher, state } =
    req.body;

  // Validate request data
  if (
    !userId ||
    !image ||
    !name ||
    !platform ||
    !genre ||
    !rating ||
    !publisher ||
    !state
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Create a new request
  const newRequest = new requestModel({
    user: userId,
    image,
    name,
    platform,
    genre,
    rating,
    publisher,
    state,
  });

  // Save the request to the database
  newRequest
    .save()
    .then((savedRequest) => {
      res.status(201).json({
        message: "Request created successfully",
        request: savedRequest,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//get request data
app.get("/request", (req, res) => {
  requestModel
    .find({})
    .populate("user")
    .exec()
    .then((data) => {
      res.send(JSON.stringify(data));
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" });
    });
});

//get request data by user id
app.get("/request/user/:id", (req, res) => {
  const { id } = req.params;
  requestModel
    .find({ user: id })
    .populate("user")
    .exec()
    .then((request) => {
      if (request.length > 0) {
        res.send(JSON.stringify(request));
      } else {
        res.status(404).json({ message: "Request not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//edit request by id
app.put("/updaterequest/:id", (req, res) => {
  const { id } = req.params;
  const { image, name, platform, genre, rating, publisher, state } = req.body;
  requestModel
    .findByIdAndUpdate(
      id,
      {
        image: image,
        name: name,
        platform: platform,
        genre: genre,
        rating: rating,
        publisher: publisher,
        state: state,
      },
      { new: true }
    )
    .exec()
    .then((updatedRequest) => {
      res.send({
        message: "Request updated successfully",
        request: updatedRequest,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

//delete request by id
app.delete("/deleterequest/:id", (req, res) => {
  const { id } = req.params;
  requestModel
    .findByIdAndDelete(id)
    .exec()
    .then((request) => {
      if (request) {
        res.status(200).json({ message: "Request deleted successfully" });
      } else {
        res.status(404).json({ message: "Request not found" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    });
});
