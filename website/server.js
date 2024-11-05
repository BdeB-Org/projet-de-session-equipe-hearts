import dotenv from 'dotenv';
import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql";
import { body, validationResult } from "express-validator";
import dateFormat from "dateformat";
import bcrypt from 'bcrypt';
import { Client, Environment } from 'square';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import cron from 'node-cron';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import FacebookStrategy from 'passport-facebook';
import TwitterStrategy from 'passport-twitter';
import AppleStrategy from 'passport-apple';

import fs from 'fs';

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
app.use('/images', express.static(path.join(__dirname, '/website/images')));

app.use('/uploads', express.static(path.join(__dirname, '/website/uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.json()); // For parsing application/json

app.use('/cyberpunk-css-main', express.static(path.join(__dirname, 'cyberpunk-css-main')));



// Serve the cyberpunk CSS with the correct MIME type
app.get('/cyberpunk-css-main/cyberpunk.css', (req, res) => {
    const options = {
        root: path.join(__dirname, 'cyberpunk-css-main'),
        headers: {
            'Content-Type': 'text/css', // Explicitly set the correct MIME type
        }
    };

    res.sendFile('cyberpunk.css', options, (err) => {
        if (err) {
            console.error('Error serving CSS file:', err);
            res.status(err.status).end();
        }
    });
});


/*
------------------------------------------
PTSD NODE MAILER
------------------------------------------
*/

let transporter;
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Set the credentials
oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

// Retrieve the access token
try {
    const accessToken = await oauth2Client.getAccessToken();
    console.log('Access Token:', accessToken.token);

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.GMAIL_USER,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: accessToken.token,
        },
    });

    console.log('Nodemailer transporter is set up and ready to use.');

} catch (error) {
    console.error('Error setting up email transporter:', error);
}



/*
------------------------------------------
    Connect to server
------------------------------------------
*/
const server = app.listen(4000, function () {
    console.log("serveur fonctionne sur 4000... ! ");
});

/*
------------------------------------------
    Connect MySql
------------------------------------------
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

app.use(passport.initialize());
app.use(passport.session());

con.connect(function (err) {
    if (err) throw err;
    console.log("connected!");
    initializeSubscriptions();
    initializeCards();
    initializeLikes();
});

/*
------------------------------------------
    Crypting
------------------------------------------
*/

// Route to hash a URL dynamically based on query parameters
app.get("/hash-url", (req, res) => {
    const { amount, subscriptionType } = req.query;
    const baseUrl = `localhost:4000/event/payment?amount=${amount}&subscriptionType=${subscriptionType}`;
    const hashedUrl = hashString(baseUrl);
    res.redirect(`localhost:4000/event/payment?hash=${hashedUrl}`);
});

function hashString(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}



/*
------------------------------------------
    Configuration de EJS
------------------------------------------
*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use('/images', express.static(path.join(__dirname, 'images')));

/*
------------------------------------------
Configuration API SQUARE FIOHSAIOGFHASIPFH
------------------------------------------
*/

const squareClient = new Client({
    environment: Environment.Sandbox,
    accessToken: process.env.SQUARE_ACCESS_TOKEN
});

/*
    cron
*/

cron.schedule('0 0 * * *', () => {
    const resetQuery = `
        UPDATE e_utilisateur 
        SET swipe_count = 0, last_swipe_time = CURRENT_TIMESTAMP
        WHERE abonnement_id IS NOT NULL;
    `;

    con.query(resetQuery, (err, result) => {
        if (err) {
            console.error('Error resetting swipe count:', err);
        } else {
            console.log('Swipe counts have been reset for all users.');
        }
    });
});


/*
------------------------------------------
Inititaliser la table d'abonnement
------------------------------------------
*/
const initializeSubscriptions = () => {
    const subscriptions = [
        { e_id: 1, e_type: 'Basic', prix: 0.00, e_duree: 30 },
        { e_id: 2, e_type: 'Premium', prix: 9.99, e_duree: 30 },
        { e_id: 3, e_type: 'Diamant', prix: 19.99, e_duree: 30 }
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
------------------------------------------
Inititaliser la table des cartes
------------------------------------------
*/
const initializeCards = () => {
    const cards = [
        { id_card: 1, type_card: 'Ace' },
        { id_card: 2, type_card: 'Joker' },
        { id_card: 3, type_card: 'Reine' },
        { id_card: 4, type_card: 'Roi' }
    ];

    cards.forEach(card => {
        const insertQuery = `
            INSERT INTO e_card (id_card, type_card)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
                type_card = VALUES(type_card);
        `;

        con.query(insertQuery, [card.id_card, card.type_card], (err) => {
            if (err) {
                console.error(`Error inserting card ${card.type_card}:`, err);
            } else {
                console.log(`Card ${card.type_card} added/updated successfully.`);
            }
        });
    });
};

/*
------------------------------------------
Inititaliser la table des likes
------------------------------------------
*/
const initializeLikes = () => {
    const likes = [
        { id_like: 1, type_like: 'Musique' },
        { id_like: 2, type_like: 'Cinéma' },
        { id_like: 3, type_like: 'Voyages' },
        { id_like: 4, type_like: 'Sport' },
        { id_like: 5, type_like: 'Lecture' },
        { id_like: 6, type_like: 'Cuisine' }
    ];

    likes.forEach(like => {
        const insertQuery = `
            INSERT INTO e_likes (id_like, type_like)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
                type_like = VALUES(type_like);
        `;

        con.query(insertQuery, [like.id_like, like.type_like], (err) => {
            if (err) {
                console.error(`Error inserting like ${like.type_like}:`, err);
            } else {
                console.log(`Like ${like.type_like} added/updated successfully.`);
            }
        });
    });
};


/*
------------------------------------------
    Connect to GOOGLE FEUGH
------------------------------------------
*/

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    const user = {
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
    };
    const query = 'INSERT INTO e_utilisateur (googleId, e_nom, e_prenom, e_courriel) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE e_nom = ?, e_prenom = ?';
    con.query(query, [user.googleId, user.name.split(' ')[0], user.name.split(' ')[1], user.email, user.name.split(' ')[0], user.name.split(' ')[1]], (err) => {
        if (err) return done(err);
        return done(null, user);
    });
}));


app.get('/auth/google', (req, res, next) => {
    console.log("Google Auth Route Hit");
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })(req, res, next);
});

passport.serializeUser((user, done) => {
    console.log('Serializing user:', user);
    done(null, user.googleId);
});

passport.deserializeUser((id, done) => {
    console.log('Deserializing user with ID:', id);
    const query = 'SELECT * FROM e_utilisateur WHERE googleId = ?';
    con.query(query, [id], (err, results) => {
        if (err) return done(err);
        done(null, results[0]);
    });
});


app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/event/inscription'
}), (req, res) => {
    res.redirect('/');
});

/*
------------------------------------------
    Connect to FACEBOOK
------------------------------------------
*/

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails', 'photos']
}, (accessToken, refreshToken, profile, done) => {
    const user = {
        facebookId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        photo: profile.photos[0].value
    };

    const query = `
        INSERT INTO e_utilisateur (facebookId, e_nom, e_prenom, e_courriel, e_photo) 
        VALUES (?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE e_nom = ?, e_prenom = ?, e_photo = ?
    `;
    con.query(query, [user.facebookId, user.name.split(' ')[0], user.name.split(' ')[1], user.email, user.photo, user.name.split(' ')[0], user.name.split(' ')[1], user.photo], (err) => {
        if (err) return done(err);
        return done(null, user);
    });
}));

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/event/inscription' }), (req, res) => {
    res.redirect('/');
});

/*
------------------------------------------
    Connect to Twitter
------------------------------------------
*/

passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: '/auth/twitter/callback'
}, (token, tokenSecret, profile, done) => {
    const user = {
        twitterId: profile.id,
        name: profile.displayName,
        photo: profile.photos[0].value
    };

    const query = `
        INSERT INTO e_utilisateur (twitterId, e_nom, e_courriel, e_photo) 
        VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE e_nom = ?, e_photo = ?
    `;
    con.query(query, [user.twitterId, user.name.split(' ')[0], user.email, user.photo, user.name.split(' ')[0], user.photo], (err) => {
        if (err) return done(err);
        return done(null, user);
    });
}));

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/event/inscription' }), (req, res) => {
    res.redirect('/');
});

/*
------------------------------------------
    Connect to Apple
------------------------------------------
*/

passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY,
    callbackURL: '/auth/apple/callback'
}, (accessToken, refreshToken, idToken, profile, done) => {
    const user = {
        appleId: profile.id,
        email: profile.email
    };

    const query = `
        INSERT INTO e_utilisateur (appleId, e_courriel) 
        VALUES (?, ?) 
        ON DUPLICATE KEY UPDATE e_courriel = ?
    `;
    con.query(query, [user.appleId, user.email, user.email], (err) => {
        if (err) return done(err);
        return done(null, user);
    });
}));

app.get('/auth/apple', passport.authenticate('apple'));
app.get('/auth/apple/callback', passport.authenticate('apple', { failureRedirect: '/event/inscription' }), (req, res) => {
    res.redirect('/');
});

/*
------------------------------------------
    APP GETS
------------------------------------------
*/



app.get("/", function (req, res) {
    res.render("pages/accueil", {
        siteTitle: "Index",
        pageTitle: "index",
        userDetails: req.session.user,
    });
});

app.get("/event/error", function (req, res) {
    res.render("pages/error", {
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
    console.log("User Details on Abonnement Page:", req.session.user); // Debugging line
    res.render("pages/abonnement", {
        siteTitle: "Créer Compte",
        pageTitle: "Créer Compte",
        userDetails: req.session.user,
    });
});


app.get("/event/confirmation", function (req, res) {
    res.render("pages/confirmation", {
        siteTitle: "Confirmation",
        pageTitle: "Payment Confirmation",
        userDetails: req.session.user,
        subscriptionType: req.session.subscriptionType || "Unknown Subscription",
        paymentId: req.session.paymentId || "Unknown Payment ID",
        amount: req.session.amount.toFixed(2),
        tvqAmount: req.session.tvqAmount.toFixed(2),
        tpsAmount: req.session.tpsAmount.toFixed(2),
        totalAmount: req.session.totalAmount.toFixed(2),
        confirmationEmail: req.session.confirmationEmail  // Pass the email to the view
    });
});

app.get("/event/payment", (req, res) => {
    const { amount, subscriptionType, hash } = req.query;

    // Rebuild the base URL to match what was hashed on the client
    const baseUrl = `/event/payment?amount=${amount}&subscriptionType=${subscriptionType}`;
    const generatedHash = hashString(baseUrl);


    // Compare the client-provided hash with the server-generated one
    if (hash !== generatedHash) {
        return res.redirect("/event/error");
    }

    // Log for debugging
    console.log("Generated hash:", generatedHash);
    console.log("Received hash:", hash);

    // Validate the hash
    if (hash !== generatedHash) {
        return res.redirect("/event/error");
    }

    // Continue processing if hash is valid
    res.render("pages/payment", {
        siteTitle: "Payment",
        pageTitle: "Payment",
        userDetails: req.session.user,
        amount,
        subscriptionName: subscriptionType,
        hashedUrl: hash
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
    const userId = req.session.user.e_id;
    const cardNames = {
        1: 'Ace',
        2: 'Joker',
        3: 'Reine',
        4: 'Roi'
    };

    const likeNames = {
        1: 'Musique',
        2: 'Cinéma',
        3: 'Voyages',
        4: 'Sport',
        5: 'Lecture',
        6: 'Cuisine'
    };

    const getPreferencesQuery = `
        SELECT card_id, like_id 
        FROM preference 
        WHERE utilisateur_id = ?`;

    con.query(getPreferencesQuery, [userId], (err, preferenceResults) => {
        if (err) {
            console.error('Error fetching user preferences:', err);
            return res.status(500).send('Error fetching user preferences');
        }

        const cardPreferences = preferenceResults
            .filter(pref => pref.card_id)
            .map(pref => cardNames[pref.card_id]);

        const likePreferences = preferenceResults
            .filter(pref => pref.like_id)
            .map(pref => likeNames[pref.like_id]);

        // Ensure you're passing the user session data correctly
        res.render("pages/swipe", {
            siteTitle: "Swipe",
            pageTitle: "Swipe",
            userDetails: req.session.user, // Make sure this is populated correctly
            cardPreferences: cardPreferences,
            likePreferences: likePreferences // This should be an array
        });
    });

});

app.get("/event/profil", function (req, res) {
    if (!req.session.user) {
        return res.redirect("/event/inscription");
    }

    const subscriptionNames = {
        1: "Basique",
        2: "Premium",
        3: "Diamant"
    };

    const cardNames = {
        1: 'Ace',
        2: 'Joker',
        3: 'Reine',
        4: 'Roi'
    };

    const likeNames = {
        1: 'Musique',
        2: 'Cinéma',
        3: 'Voyages',
        4: 'Sport',
        5: 'Lecture',
        6: 'Cuisine'
    };

    const userSubscriptionName = subscriptionNames[req.session.user.abonnement_id] || 'Aucun abonnement actif';
    const userId = req.session.user.e_id;

    const getPhotosQuery = 'SELECT photo_url FROM e_photo WHERE utilisateur_id = ?';
    con.query(getPhotosQuery, [userId], (err, photoResults) => {
        if (err) {
            console.error('Error fetching user photos:', err);
            return res.status(500).send('Error fetching user photos');
        }

        const userPhotos = photoResults.map(row => row.photo_url);

        const getPreferencesQuery = `
            SELECT card_id, like_id 
            FROM preference 
            WHERE utilisateur_id = ?`;
        con.query(getPreferencesQuery, [userId], (err, preferenceResults) => {
            if (err) {
                console.error('Error fetching user preferences:', err);
                return res.status(500).send('Error fetching user preferences');
            }

            const cardPreferences = preferenceResults
                .filter(pref => pref.card_id)
                .map(pref => cardNames[pref.card_id]);

            const likePreferences = preferenceResults
                .filter(pref => pref.like_id)
                .map(pref => likeNames[pref.like_id]);

            res.render("pages/profil", {
                siteTitle: "Profil",
                pageTitle: "Votre Profil",
                userDetails: req.session.user,
                subscriptionName: userSubscriptionName,
                userPhotos: userPhotos,
                cardPreferences: cardPreferences,
                likePreferences: likePreferences
            });
        });
    });
});



app.get('/event/download-receipt', (req, res) => {
    const { subscriptionType, amount, tvqAmount, tpsAmount, totalAmount, paymentId, confirmationEmail } = req.session;
    const userDetails = req.session.user;

    if (!userDetails) {
        return res.status(400).send("User details not found in session.");
    }

    const doc = new PDFDocument();
    const pdfStream = new PassThrough();
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${paymentId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(pdfStream);
    pdfStream.pipe(res);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0d0d0d');
    doc.fontSize(30)
        .fillColor('#00ff00')
        .text('Reçu de Paiement', { align: 'center', underline: true })
        .moveDown();

    doc.fillColor('#ff007f');
    doc.fontSize(18)
        .text(`Merci, ${userDetails.e_prenom} ${userDetails.e_nom}!`, { align: 'center' })
        .moveDown();

    doc.fillColor('#00ffff');
    doc.text(`Votre abonnement: ${subscriptionType}`, { align: 'center' })
        .text(`ID de paiement: ${paymentId}`, { align: 'center' })
        .text(`Email: ${userDetails.e_courriel}`, { align: 'center' })
        .text(`Le reçu a été envoyé à: ${confirmationEmail}`, { align: 'center' })
        .moveDown();

    doc.fillColor('#ffcc00');
    doc.fontSize(16)
        .text(`Prix d'abonnement: $${amount.toFixed(2)}`)
        .text(`TVQ: $${tvqAmount.toFixed(2)}`)
        .text(`TPS: $${tpsAmount.toFixed(2)}`)
        .text(`Total: $${totalAmount.toFixed(2)}`)
        .moveDown();

    doc.fillColor('#ff007f')
        .fontSize(14)
        .text('Merci d\'avoir choisi notre service !', { align: 'center', italics: true })
        .moveDown();
    doc.end();
});

/*
-----------------------------
    Pages swipes
-----------------------------
*/
app.get('/api/users', (req, res) => {
    const query = 'SELECT * FROM e_utilisateur';
    con.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching users' });
        }

        // Prepare users with their likes
        const usersWithLikesPromises = results.map(async (user) => {
            const likes = await getUserLikes(user.e_id); // Ensure this returns an array
            return {
                ...user,
                likes: likes // Add the likes array here
            };
        });

        Promise.all(usersWithLikesPromises).then(usersWithLikes => {
            res.json(usersWithLikes);
        });
    });
});


function getUserLikes(userId) {
    const likeNames = {
        1: 'Musique',
        2: 'Cinéma',
        3: 'Voyages',
        4: 'Sport',
        5: 'Lecture',
        6: 'Cuisine'
    };

    const likesQuery = 'SELECT like_id FROM preference WHERE utilisateur_id = ?';
    return new Promise((resolve, reject) => {
        con.query(likesQuery, [userId], (err, results) => {
            if (err) return reject(err);
            const likeNamesList = results.map(row => likeNames[row.like_id]); // Ensure this returns a string array
            resolve(likeNamesList);
        });
    });
}


app.get('/api/user/swipe-data/:userId', (req, res) => {
    const userId = req.params.userId;
    const currentTime = new Date();

    con.query('SELECT swipe_count, last_swipe_time FROM e_utilisateur WHERE e_id = ?', [userId], (error, results) => {
        if (error) throw error;

        const user = results[0];
        const lastSwipeTime = new Date(user.last_swipe_time);

        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0);

        if (lastSwipeTime < todayAtMidnight) {
            user.swipe_count = 0;
            con.query('UPDATE e_utilisateur SET swipe_count = 0, last_swipe_time = CURRENT_TIMESTAMP WHERE e_id = ?', [userId], (err) => {
                if (err) throw err;
            });
        }

        res.json({
            swipe_count: user.swipe_count,
            last_swipe_time: user.last_swipe_time
        });
    });
});

app.post('/api/user/update-swipe', (req, res) => {
    const { userId, swipeCount, swipeTime } = req.body;

    con.query('UPDATE e_utilisateur SET swipe_count = ?, last_swipe_time = ? WHERE e_id = ?', [swipeCount, swipeTime, userId], (error, results) => {
        if (error) throw error;
        res.json({ success: true });
    });
});



/*
------------------------------------------
    LES POSTS
------------------------------------------
*/


/*
-----------------------------
  Connectez a un compte
-----------------------------
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
            // Assign user details including abonnement_id to the session
            req.session.user = {
                e_id: user.e_id,
                e_nom: user.e_nom,
                e_prenom: user.e_prenom,
                date_naissance: user.date_naissance,
                e_courriel: user.e_courriel,
                e_photo: user.e_photo,
                e_location: user.e_location,
                e_number: user.e_number,
                abonnement_id: user.abonnement_id // This line must be included
            };
            console.log("User connected:", req.session.user); // Log session details
            res.redirect('/');
        } else {
            console.log(password);
            console.log(user.e_password);
            res.status(401).send("Incorrect password");
        }
    });
});

/*
-----------------------------
  Déconnectez a un compte
-----------------------------
*/


app.post('/event/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error while logging out:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.redirect('/');
    });
});

/*
-----------------------------
  Payer un abonnement
-----------------------------
*/


app.post('/event/payment', async (req, res) => {
    console.log('Received payment request:', req.body);

    const { sourceId, amount, subscriptionType, confirmationEmail } = req.body;
    const totalAmountInCents = amount; // Amount received in cents
    const totalAmount = totalAmountInCents / 100; // Convert cents to dollars

    const tvqRate = 0.09975;
    const tpsRate = 0.05;

    // Calculate the original amount and taxes
    const tvqAmount = totalAmount / (1 + tvqRate + tpsRate) * tvqRate;
    const tpsAmount = totalAmount / (1 + tvqRate + tpsRate) * tpsRate;
    const originalAmount = totalAmount - tvqAmount - tpsAmount;

    // Store the calculated amounts in the session
    req.session.amount = originalAmount; // Original amount
    req.session.tvqAmount = tvqAmount; // TVQ amount
    req.session.tpsAmount = tpsAmount; // TPS amount
    req.session.totalAmount = totalAmount; // Total amount with tax
    req.session.confirmationEmail = confirmationEmail;

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
        const paymentId = paymentResponse.result.payment.id;

        // Fetch subscription ID
        const query = 'SELECT e_id FROM e_abonnement WHERE e_type = ?';
        con.query(query, [subscriptionType], (err, results) => {
            if (err) {
                console.error('Error querying subscription details:', err);
                return res.status(500).send('Error querying subscription details');
            }

            const subscriptionId = results[0].e_id;
            const { e_id } = req.session.user || {}; // Get logged-in user's e_id from session

            if (!e_id) {
                return res.status(401).send('User not logged in');
            }

            // Update the user's subscription
            const updateQuery = `UPDATE e_utilisateur SET abonnement_id = ? WHERE e_id = ?`;
            con.query(updateQuery, [subscriptionId, e_id], (err) => {
                if (err) {
                    console.error('Error updating user subscription:', err);
                    return res.status(500).send('Error updating user subscription');
                }

                // Update session with new subscription details
                req.session.user.abonnement_id = subscriptionId;
                req.session.subscriptionType = subscriptionType; // Store subscription type
                req.session.paymentId = paymentId; // Store payment ID

                // Send a quick response to the client
                res.json({ success: true, redirect: '/event/confirmation' });

                // Handle email sending asynchronously after response
                setImmediate(() => {
                    sendConfirmationEmail(confirmationEmail, subscriptionType, originalAmount, tvqAmount, tpsAmount, totalAmount, paymentId);
                });
            });
        });

    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

const sendConfirmationEmail = (confirmationEmail, subscriptionType, originalAmount, tvqAmount, tpsAmount, totalAmount, paymentId) => {
    const subject = `Votre reçu pour l'abonnement ${subscriptionType}`;
    const html = `
        <div style="font-family: 'Arial', sans-serif; background-color: #0d0d0d; color: #ff007f; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(255, 0, 127, 0.5);">
            <h1 style="color: #00ff00; text-align: center;">Merci pour votre paiement !</h1>
            <hr style="border: 1px solid #00bfff;">
            <p style="font-size: 18px;">Votre abonnement: <strong style="color: #00ffff;">${subscriptionType}</strong></p>
            <p style="font-size: 18px;">Montant: <strong style="color: #ffcc00;">$${originalAmount.toFixed(2)}</strong></p>
            <p style="font-size: 18px;">TVQ: <strong style="color: #ffcc00;">$${tvqAmount.toFixed(2)}</strong></p>
            <p style="font-size: 18px;">TPS: <strong style="color: #ffcc00;">$${tpsAmount.toFixed(2)}</strong></p>
            <p style="font-size: 20px; font-weight: bold;">Montant payé total: <strong style="color: #ff007f;">$${totalAmount.toFixed(2)}</strong></p>
            <p style="font-size: 16px;">Nous espérons que vous apprécierez votre abonnement.</p>
            <footer style="margin-top: 20px; text-align: center;">
                <p style="font-size: 14px;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                <p style="font-size: 14px;">Merci d'avoir choisi notre service !</p>
            </footer>
        </div>
    `;

    const mailOptions = {
        from: 'hearts.corps@gmail.com',
        to: confirmationEmail,
        subject: subject,
        html: html
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};


/*
-----------------------------
  Changer l'abonnement a gratuit
-----------------------------
*/


app.post('/event/change-plan', (req, res) => {
    const userId = req.session.user.e_id;
    const { abonnement_id } = req.body;

    const updateQuery = 'UPDATE e_utilisateur SET abonnement_id = ? WHERE e_id = ?';

    con.query(updateQuery, [abonnement_id, userId], (err, result) => {
        if (err) {
            console.error('Error updating subscription:', err);
            return res.status(500).json({ success: false, message: 'Erreur lors du changement de plan' });
        }

        req.session.user.abonnement_id = abonnement_id;

        res.json({ success: true });
    });
});

/*
-----------------------------
  Changer le mot de passe
-----------------------------
*/
app.post('/event/change-password', async (req, res) => {
    const { old_password, new_password, confirm_password } = req.body;
    const userId = req.session.user.e_id; // Assuming user ID is stored in session

    // Ensure all fields are provided
    if (!old_password || !new_password || !confirm_password) {
        return res.json({ success: false, message: 'Tous les champs sont requis' });
    }

    // Check if new password and confirmation match
    if (new_password !== confirm_password) {
        return res.json({ success: false, message: 'Les mots de passe ne correspondent pas' });
    }

    try {
        // Fetch the user's current password from the database
        const query = 'SELECT e_password FROM e_utilisateur WHERE e_id = ?';
        con.query(query, [userId], async (err, result) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer.' });
            }

            if (result.length === 0) {
                return res.json({ success: false, message: 'Utilisateur non trouvé' });
            }

            const user = result[0];

            // Compare the current password with the provided old password
            if (old_password !== user.e_password) {
                return res.json({ success: false, message: 'Le mot de passe actuel est incorrect' });
            }

            // Update the password in the database
            const updateQuery = 'UPDATE e_utilisateur SET e_password = ? WHERE e_id = ?';
            con.query(updateQuery, [new_password, userId], (err, result) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.json({ success: false, message: 'Erreur lors de la mise à jour du mot de passe' });
                }

                return res.json({ success: true, message: 'Le mot de passe a bien été changé' });
            });
        });
    } catch (error) {
        console.error('Error processing password change:', error);
        return res.json({ success: false, message: 'Erreur interne. Veuillez réessayer plus tard.' });
    }
});



/*
-----------------------------
  Delete un compte
-----------------------------
*/


app.post('/event/delete-account', (req, res) => {
    const userId = req.session.user ? req.session.user.e_id : null; // Ensure session exists

    if (!userId) {
        return res.status(400).send('Utilisateur non connecté.');
    }

    // Start with deleting preferences
    const deletePreferencesQuery = 'DELETE FROM preference WHERE utilisateur_id = ?';
    con.query(deletePreferencesQuery, [userId], (err) => {
        if (err) {
            console.error('Error deleting user preferences:', err);
            return res.status(500).send('Erreur lors de la suppression des préférences de l\'utilisateur.');
        }

        // Now delete the user
        const deleteUserQuery = 'DELETE FROM e_utilisateur WHERE e_id = ?';
        con.query(deleteUserQuery, [userId], (err) => {
            if (err) {
                console.error('Error deleting user:', err);
                return res.status(500).send('Erreur lors de la suppression de l\'utilisateur.');
            }

            req.session.destroy((err) => {
                if (err) {
                    console.error('Error during logout:', err);
                    return res.status(500).send('Erreur lors de la déconnexion.');
                }
                res.redirect('/');
            });
        });
    });
});


/*
-----------------------------
  Inscrire à un compte
-----------------------------
*/

import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '/uploads')); // Specify uploads folder
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Get the file extension
        cb(null, `${file.fieldname}-${Date.now()}${ext}`); // Use the original file extension
    }
});

// Set up multer for file uploads
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/; // Acceptable file types
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!'); // Reject non-image files
        }
    }
});

app.post('/event/inscription', upload.single('photo'), (req, res) => {
    const { email, password, phone, firstName, lastName, birthdate, gender, selectedCard, selectedLikes } = req.body;
    const uploadedPhoto = req.file ? req.file.filename : null;

    const checkEmailQuery = "SELECT * FROM e_utilisateur WHERE e_courriel = ?";
    con.query(checkEmailQuery, [email], (err, result) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (result.length > 0) {
            return res.status(409).send("Email already in use");
        }

        // Insert the new user
        const insertUserQuery = `
            INSERT INTO e_utilisateur (e_nom, e_prenom, date_naissance, e_courriel, e_photo, e_location, e_number, e_password, abonnement_id, genre)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const defaultLocation = 'Inconnu';

        con.query(insertUserQuery, [lastName, firstName, birthdate, email, uploadedPhoto, defaultLocation, phone, password, 1, gender], (err, result) => {
            if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).send("Internal Server Error");
            }

            const userId = result.insertId;

            let cardIdPromise = Promise.resolve();
            if (selectedCard) {
                cardIdPromise = new Promise((resolve, reject) => {
                    const fetchCardIdQuery = "SELECT id_card FROM e_card WHERE type_card = ?";
                    con.query(fetchCardIdQuery, [selectedCard], (err, cardResult) => {
                        if (err) {
                            console.error("Error fetching card ID:", err);
                            return reject("Internal Server Error");
                        }

                        if (cardResult.length === 0) {
                            console.error("Selected card not found in database.");
                            return reject("Selected card not valid");
                        }

                        const cardId = cardResult[0].id_card;

                        const insertCardPreferenceQuery = `
                            INSERT INTO preference (utilisateur_id, card_id)
                            VALUES (?, ?)
                        `;
                        con.query(insertCardPreferenceQuery, [userId, cardId], (err) => {
                            if (err) {
                                console.error("Error inserting card preference:", err);
                                return reject("Error inserting card preference");
                            }
                            resolve();
                        });
                    });
                });
            }

            let likesPromises = [];
            if (selectedLikes) {
                const likesArray = selectedLikes.split(',').map(like => like.trim());
                console.log("Trimmed likes being processed:", likesArray);

                likesPromises = likesArray.map(like => {
                    return new Promise((resolve, reject) => {
                        console.log("Fetching like ID for:", like);
                        const fetchLikeIdQuery = "SELECT id_like FROM e_likes WHERE type_like = ?";
                        con.query(fetchLikeIdQuery, [like], (err, likeResult) => {
                            if (err) {
                                console.error("Error fetching like ID:", err);
                                return reject("Internal Server Error");
                            }

                            if (likeResult.length === 0) {
                                console.error("Selected like not found in database:", like);
                                return reject(`Selected like "${like}" not valid`);
                            }

                            const likeId = likeResult[0].id_like;

                            const insertLikePreferenceQuery = `
                    INSERT INTO preference (utilisateur_id, like_id)
                    VALUES (?, ?)
                `;
                            con.query(insertLikePreferenceQuery, [userId, likeId], (err) => {
                                if (err) {
                                    console.error("Error inserting like preference:", err);
                                    return reject("Error inserting like preference");
                                }
                                console.log(`Like ${like} added/updated successfully.`);
                                resolve();
                            });
                        });
                    });
                });
            }


            Promise.all([cardIdPromise, ...likesPromises])
                .then(() => {
                    req.session.user = {
                        e_id: userId,
                        e_nom: lastName,
                        e_prenom: firstName,
                        date_naissance: birthdate,
                        e_courriel: email,
                        e_photo: uploadedPhoto,
                        e_location: defaultLocation,
                        e_number: phone,
                        abonnement_id: 1,
                        genre: gender
                    };
                    return res.redirect('/');
                })
                .catch((error) => {
                    console.error("Error during registration:", error);
                    return res.status(500).send(error);
                });
        });
    });
});



app.get('/uploads/:filename', (req, res) => {
    const options = {
        root: path.join(__dirname, 'website/uploads'),
        headers: {
            'Content-Type': 'image/png', // Change this based on the file type if needed
        }
    };

    res.sendFile(req.params.filename, options, (err) => {
        if (err) {
            res.status(err.status).end();
        }
    });
});

/*
--------------------------------
        PROFILES
--------------------------------
*/
app.post('/event/update-profile', (req, res) => {
    const { new_firstName, new_lastName, new_email } = req.body;
    const userId = req.session.user.e_id;

    if (!userId) {
        return res.json({ success: false, message: "Utilisateur non connecté" });
    }

    const updateProfileQuery = `
        UPDATE e_utilisateur 
        SET e_prenom = ?, e_nom = ?, e_courriel = ? 
        WHERE e_id = ?;
    `;

    con.query(updateProfileQuery, [new_firstName, new_lastName, new_email, userId], (err, result) => {
        if (err) {
            console.error("Error updating profile:", err);
            return res.json({ success: false, message: "Erreur lors de la mise à jour du profil dans la base de données." });
        }

        req.session.user.e_prenom = new_firstName;
        req.session.user.e_nom = new_lastName;
        req.session.user.e_courriel = new_email;

        res.json({ success: true, message: "Profil mis à jour avec succès." });
    });
});

app.post('/event/update-photos', upload.array('photos', 20), (req, res) => {
    const userId = req.session.user.e_id;
    const photoUrls = req.files.map(file => file.filename);

    const existingPhotosQuery = 'SELECT photo_url FROM e_photo WHERE utilisateur_id = ?';
    con.query(existingPhotosQuery, [userId], (err, results) => {
        if (err) return res.status(500).send('Error fetching existing photos');

        const existingPhotos = results.map(row => row.photo_url);
        const newPhotos = photoUrls.filter(url => !existingPhotos.includes(url));

        if (newPhotos.length === 0) {
            return res.json({ success: true, message: 'No new photos to upload.' });
        }
        const insertPromises = newPhotos.map(photoUrl => {
            const insertPhotoQuery = 'INSERT INTO e_photo (utilisateur_id, photo_url) VALUES (?, ?)';
            return new Promise((resolve, reject) => {
                con.query(insertPhotoQuery, [userId, photoUrl], (err) => {
                    if (err) {
                        console.error('Error inserting photo:', err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        });

        Promise.all(insertPromises)
            .then(() => res.json({ success: true, message: 'Photos uploaded successfully.' }))
            .catch(err => res.status(500).send('Error saving photos'));
    });
});



app.delete('/event/delete-photo/:photoUrl', (req, res) => {
    const photoUrl = req.params.photoUrl;
    const userId = req.session.user.e_id;

    const deletePhotoQuery = 'DELETE FROM e_photo WHERE photo_url = ? AND utilisateur_id = ?';
    con.query(deletePhotoQuery, [photoUrl, userId], (err) => {
        if (err) {
            console.error('Error deleting photo from database:', err);
            return res.status(500).send('Error deleting photo');
        }

        const filePath = path.join(__dirname, '/uploads', photoUrl);
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting photo file:', err);
        });

        res.json({ success: true, message: 'Photo deleted successfully.' });
    });
});
