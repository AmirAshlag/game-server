const { Router } = require("express");
const gameDataRouter = Router();

let cards = [];
let score = 0

gameDataRouter.post("/cards", (req, res) => {
  cards = req.body.cards;
  // console.log(cards);
});

gameDataRouter.get("/cards", (req, res) => {
  console.log("request sent");
  // console.log(cards);
  res.send(cards);
});

gameDataRouter.post("/score", (req, res) => {
  score = req.body.score;
  console.log(score);
});

gameDataRouter.get("/score", (req, res) => {
  console.log("request sent");
  console.log(score);
  res.send(score);
});  


module.exports = { gameDataRouter };
