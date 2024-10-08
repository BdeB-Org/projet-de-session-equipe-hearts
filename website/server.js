import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql";
import { body, validationResult } from "express-validator";
import dateFormat from "dateformat";
import bcrypt from 'bcrypt';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static("public"));

app.use(express.static('website'));

app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

/*
    Connect to server
*/
const server = app.listen(4000, function () {
    console.log("serveur fonctionne sur 4000... ! ");
});

/*
    Connect MySql
*/
const con = mysql.createConnection({
    host: "localhost",
    user: "scott",
    password: "oracle",
    database: "myhearts"
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));


con.connect(function (err) {
    if (err) throw err;
    console.log("connected!");
});



/*
    Configuration de EJS
*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use('/images', express.static(path.join(__dirname, 'images')));

/*
Configuration API SQUARE FIOHSAIOGFHASIPFH
*/

import { Client, Environment } from 'square';

const squareClient = new Client({
    environment: Environment.Sandbox,
    accessToken: process.env.SQUARE_ACCESS_TOKEN
});

// Payment route
app.post('/event/payment', async (req, res) => {
    const { amount } = req.body;

    // Create a payment request
    const paymentRequest = {
        sourceId: 'YOUR_SOURCE_ID',
        amount: amount * 100,
        currency: 'CAD',
    };

    try {
        const response = await squareClient.paymentsApi.createPayment(paymentRequest);
        console.log(response);
        return res.json({ success: true, paymentId: response.result.payment.id });
    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

import dotenv from 'dotenv';
dotenv.config();





/*
   PAGES DE GET
*/

app.get("/", function (req, res) {
    res.render("pages/accueil", {
        siteTitle: "Index",
        pageTitle: "index",
        userDetails: req.session.user,
    });
});

app.get("/event/payment", function (req, res) {
    res.render("pages/payment", {
        siteTitle: "Payment",
        pageTitle: "Payment",
        userDetails: req.session.user,
    });
});

app.get("/event/inscription", function (req, res) {
    res.render("pages/inscription", {
        siteTitle: "Connexion",
        pageTitle: "Connectez-vous",
        userDetails: req.session.user,
    });
});

app.get("/event/creationCompte", function (req, res) {
    res.render("pages/creationCompte", {
        siteTitle: "Créer Compte",
        pageTitle: "Créer Compte",
        userDetails: req.session.user,

    });
});

app.get("/event/abonnement", function (req, res) {
    res.render("pages/abonnement", {
        siteTitle: "Abonnez-Vous",
        pageTitle: "Abonnez-Vous",
        userDetails: req.session.user,

    });
});

app.get("/event/apropos", function (req, res) {
    res.render("pages/apropos", {
        siteTitle: "Aprpoos",
        pageTitle: "A Propos",
        userDetails: req.session.user,

    });
});

app.get("/event/swipe", function (req, res) {
    res.render("pages/swipe", {
        siteTitle: "Aprpoos",
        pageTitle: "A Propos",
        userDetails: req.session.user,

    });
});

app.get("/event/userDetails", function (req, res) {
    if (!req.session.user) {
        return res.redirect('/event/creationCompte');
    }
    res.render("pages/userDetails", {
        siteTitle: "User Details",
        pageTitle: "User Details",
        userDetails: req.session.user,
    });
});



/*
    LES POSTS
*/


app.post('/event/connect', (req, res) => {
    const { email, password } = req.body;

    const verifyUserQuery = "SELECT * FROM e_utilisateur WHERE E_COURRIEL = ?";
    con.query(verifyUserQuery, [email], (err, result) => {
        if (err) {
            console.error("Error verifying user:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (result.length === 0) {
            return res.status(401).send("Email not found");
        }
        const user = result[0];
        console.log("Retrieved user:", user);
        if (password === user.e_password) {
            req.session.user = user;
            console.log("the user is connected")
            res.redirect('/');
        } else {
            console.log(password);
            console.log(user.e_password); //ITS IN LOWER CAPS CUZ UHH BAHH IDK ITS IN LOWER CAPS
            res.status(401).send("Incorrect password");
        };
    });

});

app.post('/event/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error while logging out:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.redirect('/');
    });
});
