const jwt = require("jsonwebtoken");
const env = require("dotenv");
env.config({
  path: "../../.env",
});

const JWT_SECRET = process.env.JWT_SECRET;

const fetchuser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    console.log("token not found");
    res.status(401).send("Please authenticate using a valid token");
  } else {
    
    try {
      const data = jwt.verify(token, JWT_SECRET);
      req.user = data.user;
      next();
    } catch (error) {
      console.error(error.message);
      res.status(401).send("Please authenticate using a valid token");
    }
  }
};

module.exports = fetchuser;
