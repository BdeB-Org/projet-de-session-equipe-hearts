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
   PAGES DE GET
*/

app.get("/", function (req, res) {
    res.render("pages/accueil", {
        siteTitle: "Index",
        pageTitle: "index",
        // userDetails: req.session.user,
    });
});

app.get("/event/inscription", function (req, res) {
    res.render("pages/inscription", {
        siteTitle: "Connexion",
        pageTitle: "Connectez-vous",
        // userDetails: req.session.user,
    });
});

app.get("/event/creationCompte", function (req, res) {
    res.render("pages/creationCompte", {
        siteTitle: "Créer Compte",
        pageTitle: "Créer Compte",
        // userDetails: req.session.user,

    });
});

app.get("/event/abonnement", function (req, res) {
    res.render("pages/abonnement", {
        siteTitle: "Abonnez-Vous",
        pageTitle: "Abonnez-Vous",
        // userDetails: req.session.user,

    });
});

app.get("/event/apropos", function (req, res) {
    res.render("pages/apropos", {
        siteTitle: "Aprpoos",
        pageTitle: "A Propos",
        // userDetails: req.session.user,

    });
});


/*
    LES POSTS
*/


app.post('/event/creationCompte', (req, res) => {
    const { email, password } = req.body;


    const verifyUserQuery = "SELECT * FROM e_utilisateur WHERE E_COURRIEL = ?";
    con.query(verifyUserQuery, [email], (err, result) => {
        if (err) {
            console.error("Error verifying user:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (result.length > 0) {
            return res.status(400).send("Email already in use");
        }
        bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error("Error hashing password:", hashErr);
                return res.status(500).send("Internal Server Error");
            }

            const insertUserQuery = "INSERT INTO e_utilisateur (E_COURRIEL, E_PASSWORD) VALUES (?, ?)";
            con.query(insertUserQuery, [email, hashedPassword], (insertErr) => {
                if (insertErr) {
                    console.error("Error inserting user:", insertErr);
                    return res.status(500).send("Internal Server Error");
                }
                res.status(201).send("User created successfully");
            });
        });
    });
});
