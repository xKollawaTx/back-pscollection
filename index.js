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
      res.status(500).send({ message: "Internal Server Error" })
    })
})

//addgame section
const gameSchema = mongoose.Schema({
  image: String,
  name: String,
  platform: String,
  gener: String,
  rating: String,
  publisher: String,
  dateAdded: { type: Date, default: Date.now }
}, { timestamps: true });
const gameModel = mongoose.model("game", gameSchema);

//save game data
//api
app.post("/addgame", async (req, res) => {
  console.log(req.body)
  const { name } = req.body
  const { platform } = req.body
  gameModel
    .findOne({ name: name }, { platform: platform })
    .exec()
    .then((result) => {
      if (result) {
        if (result.platform === platform) {
          if (result.name === name) {
            res.send({ message: "Game Already Exist", alert: "false" })
          }
        }
      } else {
        const data = gameModel(req.body)
        const datasave = data.save()
        res.send({ message: "Game added successfully", alert: "true" })
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" })
    })
})

// get game data
app.get("/game", (req, res) => {
  gameModel
    .find({})
    .exec()
    .then((data) => {
      res.send((JSON.stringify(data)));
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" })
    })
})

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
        gameModel.findOne({ name }).exec().then((game) => {
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
app.get("/game/:id", (req, res) => {
  const { id } = req.params;
  gameModel
    .findById(id)
    .exec()
    .then((game) => {
      if (game) {
        res.status(200).json(game);
      } else {
        res.status(404).json({ message: "Game not found" });
      }
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
        res.send(JSON.stringify(game))
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
      res.send((JSON.stringify(data)));
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error" })
    })
})

//server running
app.listen(PORT, () => console.log("Server is running on port :" + PORT));
