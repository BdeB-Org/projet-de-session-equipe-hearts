import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql";
import { body, validationResult } from "express-validator";
import dateFormat from "dateformat";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

con.connect(function (err) {
    if (err) throw err;
    console.log("connected!");
});


/*
    Configuration de EJS
*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");


/*
   PAGES DE GET
*/

app.get("/", function (req, res) {
    res.render("pages/accueil", {
        siteTitle: "Index",
        pageTitle: "index",
        /*userDetails: req.session.user,*/
    });
});

app.get("/event/connect", function (req, res) {
    res.render("pages/connexion", {
        siteTitle: "Connexion",
        pageTitle: "Connectez-vous",
    });
});

app.get("/event/creationCompte", function (req, res) {
    res.render("pages/creationCompte", {
        siteTitle: "Créer Compte",
        pageTitle: "Créer Compte",
    });
});

app.get("/event/Abonnement", function (req, res) {
    res.render("pages/abonnement", {
        siteTitle: "Créer Compte",
        pageTitle: "Créer Compte",
    });
});

app.get("/event/apropos", function (req, res) {
    res.render("pages/apropos", {
        siteTitle: "Créer Compte",
        pageTitle: "Créer Compte",
    });
});

/*
    LES POSTS
*/