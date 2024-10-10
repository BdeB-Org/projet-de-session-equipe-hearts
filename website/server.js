import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql";
import { body, validationResult } from "express-validator";
import dateFormat from "dateformat";
import bcrypt from 'bcrypt';
import { Client, Environment } from 'square';
import dotenv from 'dotenv';


dotenv.config();


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
    initializeSubscriptions();
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

const squareClient = new Client({
    environment: Environment.Sandbox,
    accessToken: process.env.SQUARE_ACCESS_TOKEN
});


/*
Inititaliser la table d'abonnement
*/
const initializeSubscriptions = () => {
    const subscriptions = [
        { e_id: 1, e_type: 'Basic', prix: 0.00, e_duree: 30 },
        { e_id: 2, e_type: 'Premium', prix: 9.99, e_duree: 30 },
        { e_id: 3, e_type: 'Diamond', prix: 19.99, e_duree: 30 }
    ];

    subscriptions.forEach(subscription => {
        const insertQuery = `
            INSERT INTO e_abonnement (e_id, e_type, prix, e_duree)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                e_type = VALUES(e_type),
                prix = VALUES(prix),
                e_duree = VALUES(e_duree);
        `;

        con.query(insertQuery, [subscription.e_id, subscription.e_type, subscription.prix, subscription.e_duree], (err) => {
            if (err) {
                console.error(`Error inserting subscription ${subscription.e_type}:`, err);
            } else {
                console.log(`Subscription ${subscription.e_type} added/updated successfully.`);
            }
        });
    });
};


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
        siteTitle: "Créer Compte",
        pageTitle: "Créer Compte",
        userDetails: req.session.user,

    });
});

app.get("/event/confirmation", function (req, res) {
    res.render("pages/confirmation", {
        siteTitle: "Créer Compte",
        pageTitle: "Créer Compte",
        userDetails: req.session.user,

    });
});


app.get("/event/payment", function (req, res) {
    const subscriptionName = req.query.subscriptionType || "Your Subscription"; // Retrieve the subscription name dynamically
    res.render("pages/payment", {
        siteTitle: "Payment",
        pageTitle: "Payment",
        userDetails: req.session.user,
        subscriptionName: subscriptionName // Pass subscription name
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

app.get("/event/profil", function (req, res) {
    if (!req.session.user) {
        // Si l'utilisateur n'est pas connecté, on le redirige vers la page de connexion
        return res.redirect("/event/inscription");
    }

    // Si l'utilisateur est connecté, on affiche son profil
    res.render("pages/profil", {
        siteTitle: "Profil",
        pageTitle: "Votre Profil",
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


app.post('/event/payment', async (req, res) => {
    console.log('Received payment request:', req.body);

    const { sourceId, amount, subscriptionType } = req.body;

    if (!subscriptionType) {
        return res.status(400).json({ success: false, message: 'Subscription type is required' });
    }

    const paymentRequest = {
        sourceId: sourceId,
        amountMoney: {
            amount: amount,
            currency: 'CAD'
        },
        idempotencyKey: `idempotency-key-${Date.now()}` // Ensuring idempotency for the payment
    };

    try {
        // Process the payment with Square API
        const paymentResponse = await squareClient.paymentsApi.createPayment(paymentRequest);

        const query = 'SELECT e_id FROM e_abonnement WHERE e_type = ?';
        con.query(query, [subscriptionType], (err, results) => {
            if (err) {
                console.error('Error querying subscription details:', err);
                return res.status(500).send('Error querying subscription details');
            }

            if (results.length === 0) {
                console.error('Subscription type not found:', subscriptionType);
                return res.status(404).send('Subscription type not found');
            }

            const subscriptionId = results[0].e_id;

            const { e_nom, e_prenom, date_naissance, e_courriel, e_location, e_number, e_password } = req.session.user || {};
            const formattedDateNaissance = dateFormat(date_naissance, "yyyy-mm-dd");
            const e_photo = null;

            const insertQuery = `
            INSERT INTO e_utilisateur (e_nom, e_prenom, date_naissance, e_courriel, e_photo, e_location, e_number, e_password, abonnement_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            con.query(insertQuery, [e_nom, e_prenom, formattedDateNaissance, e_courriel, e_photo, e_location, e_number, e_password, subscriptionId
            ], (err, result) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    return res.status(500).send('Error inserting user');
                }

                req.session.user = { e_id: result.insertId, e_nom, e_prenom, e_courriel };

                console.log("Payment successful! Payment ID:", paymentResponse.result.payment.id);

                // Send JSON response with redirect URL
                res.json({ success: true, redirect: '/event/confirmation' });
            });
        });

    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});
