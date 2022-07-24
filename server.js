const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");

dotenv.config();

const userService = require("./user-service.js");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

let jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
jwtOptions.secretOrKey = process.env.JWT_SECRET;

let strategy = new JwtStrategy(jwtOptions, (jwt_payload, next) => {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        next(null, {
            _id: jwt_payload._id,
            userName: jwt_payload.userName
        });
    } else {
        next(null, false);
    }
});

passport.use(strategy);
app.use(passport.initialize());

app.use(express.json());
app.use(cors({ origin: '*', credentials: true }));

/* TODO Add Your Routes Here */
// POST /api/user/register
app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
        .then(success => {
            res.json({ "message": success });
        }).catch(err => {
            res.status(422).json({ "message": err });
        });
});

//POST /api/user/login
app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
        .then(user => {
            let payload = {
                _id: user._id,
                userName: user.userName
            };
            let token = jwt.sign(payload, jwtOptions.secretOrKey);

            res.json({ "message": "login successful", "token": token });
        }).catch(err => res.status(422).json({ "message": err }));
});

// GET /api/user/favourites
app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.getFavourites(req.user._id)
        .then(favourites => res.json(favourites))
        .catch(err => res.json({ "message": err }));
});

// PUT /api/user/favourites/:id
app.put("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.addFavourite(req.user._id, req.params.id)
        .then(favourites => res.json(favourites))
        .catch(err => res.json({ "message": err }));
});

// DELETE /api/user/favourites/:id
app.delete("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id)
        .then(favourites => res.json(favourites))
        .catch(err => res.json({ "message": err }));
});

userService.connect()
    .then(() => {
        app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
    })
    .catch((err) => {
        console.log("unable to start the server: " + err);
        process.exit();
    });