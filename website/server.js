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
import axios from 'axios';

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
    initializeSexualite();
});

/*
------------------------------------------
    Geolocation
------------------------------------------
*/


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

const coords = [
    { lat: 40.7127837, lon: -74.0059413, name: 'New York, NY' },
    { lat: 34.0522342, lon: -118.2436849, name: 'Los Angeles, CA' },
    { lat: 37.3382082, lon: -121.8863286, name: 'San Jose, CA' },
    { lat: 41.8781136, lon: -87.6297982, name: 'Chicago, IL' },
    { lat: 47.6062095, lon: -122.3320708, name: 'Seattle, WA' },
    { lat: 45.554015, lon: -73.717856, name: 'Laval, QC' },      // Laval, QC
    { lat: 45.5016889, lon: -73.567255, name: 'Montreal, QC' }   // Montreal, QC
];


app.get('/api/user-location', async (req, res) => {
    try {
        const userLocation = await axios.get('http://ip-api.com/json/?fields=lat,lon');
        const { lat: userLat, lon: userLon } = userLocation.data;

        if (!userLat || !userLon) {
            return res.status(500).send('Could not retrieve user location');
        }

        const distances = coords.map((location) => {
            const distance = getDistanceFromLatLonInKm(userLat, userLon, location.lat, location.lon);
            return { city: location.name, distance: distance.toFixed(2) };
        });

        // Sort distances and find the closest one
        const closestCity = distances.sort((a, b) => a.distance - b.distance)[0];

        res.json({
            success: true,
            userLocation: { lat: userLat, lon: userLon },
            closestCity: closestCity // This will now return the closest city
        });

    } catch (error) {
        console.error('Error fetching user location:', error);
        res.status(500).send('Error fetching geolocation data');
    }
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
Inititaliser la table des sexualite
------------------------------------------
*/
const initializeSexualite = () => {
    const sexualites = [
        { id_sexualite: 1, type_sexualite: 'Homme' },
        { id_sexualite: 2, type_sexualite: 'Femme' }
    ];

    sexualites.forEach(sexualite => {
        const insertQuery = `
            INSERT INTO e_sexualite (id_sexualite, type_sexualite)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
                type_sexualite = VALUES(type_sexualite);
        `;

        con.query(insertQuery, [sexualite.id_sexualite, sexualite.type_sexualite], (err) => {
            if (err) {
                console.error(`Error inserting sexualite ${sexualite.type_sexualite}:`, err);
            } else {
                console.log(`Sexualite ${sexualite.type_sexualite} added/updated successfully.`);
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
    const googleId = profile.id;
    const nameParts = profile.displayName ? profile.displayName.split(' ') : ["Unknown", "User"];
    const firstName = nameParts[0];
    const lastName = nameParts[1] || "User";
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

    // Check if the user is already registered
    const checkUserQuery = 'SELECT * FROM e_utilisateur WHERE googleId = ?';
    con.query(checkUserQuery, [googleId], (err, results) => {
        if (err) return done(err);

        if (results.length > 0) {
            // User is already registered, return the existing user
            const existingUser = results[0];
            console.log('User already registered:', results[0]);
            existingUser.message = 'User already registered';
            return done(null, existingUser);
        }

        // Proceed with registration only if user is not found
        const insertUserQuery = `
            INSERT INTO e_utilisateur (googleId, e_nom, e_prenom, e_courriel, date_naissance, e_number, genre, e_location, abonnement_id)
            VALUES (?, ?, ?, ?, NULL, '000-000-0000', 'Inconnu', 'Inconnu', 1)
        `;
        con.query(insertUserQuery, [googleId, lastName, firstName, email], (err, results) => {
            if (err) return done(err);

            // New user created successfully, marking as a new user
            const newUser = {
                e_id: results.insertId,
                googleId: googleId,
                e_nom: lastName,
                e_prenom: firstName,
                e_courriel: email,
                e_photo: null,
                abonnement_id: 1, // Default to Basic subscription
                isNewUser: true // Flag to indicate this is a new user
            };

            return done(null, newUser);
        });
    });
}));


// Serialization and Deserialization
passport.serializeUser((user, done) => {
    done(null, user.googleId);
});

passport.deserializeUser((id, done) => {
    const query = 'SELECT * FROM e_utilisateur WHERE googleId = ?';
    con.query(query, [id], (err, results) => {
        if (err) return done(err);
        done(null, results[0]);
    });
});

// Google Auth Routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google Auth Callback Route
app.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: '/event/inscription'
}), (req, res) => {
    if (!req.user) {
        return res.redirect('/event/inscription');
    }
    req.session.user = {
        e_id: req.user.e_id,
        e_nom: req.user.e_nom,
        e_prenom: req.user.e_prenom,
        e_courriel: req.user.e_courriel,
        e_photo: req.user.e_photo || null,
        abonnement_id: req.user.abonnement_id || 1,
        googleId: req.user.googleId
    };

    console.log("User session after Google authentication:", req.session.user);

    if (req.user.message === 'User already registered') {
        return res.redirect('/');
    }

    // Redirect to google-completion to choose preferences
    res.redirect('/event/google-completion');
});

// Route to complete user registration
app.get('/event/google-completion', (req, res) => {
    if (!req.session.user) {
        console.log("User session not found, redirecting to inscription");
        return res.redirect('/event/inscription');
    }

    console.log("User session found:", req.session.user);
    res.render('pages/google-completion', {
        siteTitle: "Compléter l'inscription",
        pageTitle: "Compléter l'inscription",
        userDetails: req.session.user
    });
});
app.post('/event/google-completion', upload.single('profilePicture'), (req, res) => {
    const { phone, birthdate, gender, selectedCard, selectedLikes } = req.body;
    const user = req.session.user;
    console.log("File upload:", req.file); // Check if file is being uploaded
    console.log("Form Data:", req.body);
    const profilePicture = req.file ? req.file.filename : null; // Ensure photo is retrieved properly

    console.log("Profile Picture:", profilePicture); // Log uploaded photo

    if (!user) {
        return res.status(400).send("Utilisateur non connecté.");
    }

    // Validate birthdate
    const isValidDate = (date) => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(date) && !isNaN(new Date(date).getTime());
    };

    if (!isValidDate(birthdate)) {
        return res.status(400).send("Date de naissance incorrecte. Veuillez entrer une date valide au format YYYY-MM-DD.");
    }

    // Validate gender
    const validGenders = ["Homme", "Femme", "Non spécifié"];
    const validGender = validGenders.includes(gender) ? gender : "Non spécifié";

    // Update user information in the database
    const updateUserQuery = `
        UPDATE e_utilisateur 
        SET date_naissance = ?, e_number = ?, genre = ?, e_photo = ? 
        WHERE e_id = ?;
    `;

    con.query(updateUserQuery, [birthdate, phone, validGender, profilePicture, user.e_id], (err) => {
        if (err) {
            console.error("Erreur lors de la mise à jour de l'utilisateur:", err);
            return res.status(500).send("Erreur serveur.");
        }
        console.log("User updated:", phone, birthdate, validGender, profilePicture);

        // Insert card preference
        let insertCardPromise = Promise.resolve();
        if (selectedCard) {
            insertCardPromise = new Promise((resolve, reject) => {
                const fetchCardIdQuery = 'SELECT id_card FROM e_card WHERE type_card = ?';
                con.query(fetchCardIdQuery, [selectedCard], (err, cardResult) => {
                    if (err) {
                        console.error("Erreur lors de la récupération de l'ID de la carte:", err);
                        return reject(err);
                    }
                    if (cardResult.length === 0) {
                        console.error("Carte non trouvée pour le type:", selectedCard);
                        return reject(new Error("Carte non trouvée"));
                    }
                    const cardId = cardResult[0].id_card;
                    const insertCardPreferenceQuery = `
                        INSERT INTO preference (utilisateur_id, card_id) VALUES (?, ?)
                    `;
                    con.query(insertCardPreferenceQuery, [user.e_id, cardId], (err) => {
                        if (err) {
                            console.error("Erreur lors de l'insertion de la carte:", err);
                            return reject(err);
                        }
                        resolve();
                    });
                });
            });
        }

        // Insert like preferences
        let insertPreferencesPromises = [];
        if (selectedLikes) {
            const likesArray = Array.isArray(selectedLikes) ? selectedLikes : [selectedLikes];
            console.log("Likes array to be processed:", likesArray);

            likesArray.forEach(like => {
                const fetchLikeIdQuery = 'SELECT id_like FROM e_likes WHERE type_like = ?';
                insertPreferencesPromises.push(new Promise((resolve, reject) => {
                    con.query(fetchLikeIdQuery, [like], (err, likeResult) => {
                        if (err) {
                            console.error("Erreur lors de la récupération de l'ID du like:", err);
                            return reject(err);
                        }
                        if (likeResult.length === 0) {
                            console.error("Like non trouvé pour le type:", like);
                            return reject(new Error(`Like non trouvé pour le type: ${like}`));
                        }
                        const likeId = likeResult[0].id_like;
                        const insertLikePreferenceQuery = `
                            INSERT INTO preference (utilisateur_id, like_id) VALUES (?, ?)
                        `;
                        con.query(insertLikePreferenceQuery, [user.e_id, likeId], (err) => {
                            if (err) {
                                console.error("Erreur lors de l'insertion du like:", err);
                                return reject(err);
                            }
                            resolve();
                        });
                    });
                }));
            });
        }

        // Wait for all insert operations to complete
        Promise.all([insertCardPromise, ...insertPreferencesPromises])
            .then(() => {
                req.session.user.date_naissance = birthdate;
                req.session.user.e_number = phone;
                req.session.user.genre = validGender;
                req.session.user.e_photo = profilePicture; // Update session with photo
                console.log("Phone:", phone);
                console.log("Birthdate:", birthdate);
                console.log("Gender:", gender);
                res.redirect('/profil');
            })
            .catch((error) => {
                console.error("Erreur lors de l'enregistrement des préférences:", error);
                res.status(500).send("Erreur lors de l'enregistrement des préférences.");
            });
    });
});


// Redirect to profile if the session user is valid
app.get('/profil', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/event/inscription');
    }
    res.redirect('/event/profil');
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
    const userLocation = req.session.user.e_location;

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
                likePreferences: likePreferences,
                location: userLocation
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

app.get("/event/swipe", (req, res) => {
    const userId = req.session.user.e_id; // Get logged-in user ID from session

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
        SELECT card_id, like_id, sexualite_id FROM preference WHERE utilisateur_id = ?;
    `;

    // Fetch the preferences of the logged-in user
    con.query(getPreferencesQuery, [userId], (err, preferenceResults) => {
        if (err) {
            console.error('Error fetching user preferences:', err);
            return res.status(500).send('Error fetching user preferences');
        }

        // Fetch preferences for the logged-in user
        const cardPreferences = preferenceResults
            .filter(pref => pref.card_id)
            .map(pref => cardNames[pref.card_id]);

        const cardPreferences2 = preferenceResults
            .filter(pref => pref.card_id)
            .map(pref => pref.card_id);

        const sexualitePreferences = preferenceResults
            .filter(pref => pref.sexualite_id)
            .map(pref => pref.sexualite_id);

        const likePreferences = preferenceResults
            .filter(pref => pref.like_id)
            .map(pref => likeNames[pref.like_id]);

        console.log('Card Preferences:', cardPreferences);
        console.log('Card Preferences 2:', cardPreferences2);
        console.log('Sexualite Preferences:', sexualitePreferences);
        console.log('Like Preferences:', likePreferences);

        const getMatchesQuery = `
            SELECT match_id, user1_id, user2_id 
            FROM matches
            WHERE user1_id = ? OR user2_id = ?;
        `;

        // Exécuter la requête pour récupérer les matches
        con.query(getMatchesQuery, [userId, userId, userId], (err, matches) => {
            if (err) {
                console.error('Erreur en récupérant les matches:', err);
                return res.status(500).send('Erreur en récupérant les matches');
            }

            // Log the matches in the desired format
            const formattedMatches = matches.map(match => [match.match_id, match.user1_id, match.user2_id]);
            console.log("Matches found:", formattedMatches);

            console.log("Matches trouvés:", matches);


            // Fetch the logged-in user's location from the session
            const userLocation = req.session.user.e_location;
            console.log('User Location:', userLocation); // Check if this is correct

            if (!userLocation || !userLocation.includes(',')) {
                console.error('Invalid location format or missing location data');
                return res.status(400).send('Invalid location format');
            }

            // Split the location string and extract lat, lon
            const locationParts = userLocation.split(','); // Assuming "Latitude: x, Longitude: y"
            if (locationParts.length !== 2) {
                console.error('Location data is not in the correct format');
                return res.status(400).send('Location format is incorrect');
            }

            const userLat = parseFloat(locationParts[0].split(':')[1].trim());
            const userLon = parseFloat(locationParts[1].split(':')[1].trim());

            if (isNaN(userLat) || isNaN(userLon)) {
                console.error('Invalid latitude or longitude values');
                return res.status(400).send('Invalid latitude or longitude');
            }

            // Fetch all users except the logged-in user
            const getUsersQuery = `
            SELECT * FROM e_utilisateur 
            WHERE e_id != ? AND e_id NOT IN 
            (SELECT user1_id FROM matches WHERE user2_id = ? 
             UNION
             SELECT user2_id FROM matches WHERE user1_id = ?)
        `;
            con.query(getUsersQuery, [userId, userId, userId], (err, users) => {
                if (err) {
                    console.error('Error fetching users:', err);
                    return res.status(500).send('Error fetching users');
                }

                // Calculate distance from the logged-in user for each user
                const usersWithDistances = users.map(user => {
                    const userLatLon = user.e_location.split(',');

                    // Ensure correct format for user's location
                    if (userLatLon.length !== 2) {
                        console.error('User location is not in the correct format');
                        return { ...user, distance: 'Unknown' }; // Skip this user if the format is wrong
                    }

                    const otherUserLat = parseFloat(userLatLon[0].split(':')[1].trim());
                    const otherUserLon = parseFloat(userLatLon[1].split(':')[1].trim());

                    if (isNaN(otherUserLat) || isNaN(otherUserLon)) {
                        console.error('Invalid latitude or longitude values for user');
                        return { ...user, distance: 'Unknown' }; // Skip this user if the coordinates are invalid
                    }

                    // Calculate the correct distance between logged-in user and other users
                    const distance = getDistanceFromLatLonInKm(userLat, userLon, otherUserLat, otherUserLon);
                    return {
                        ...user,
                        distance: distance.toFixed(2)
                    };
                });

                // Render the swipe page with users and their calculated distances
                res.render("pages/swipe", {
                    siteTitle: "Swipe",
                    pageTitle: "Swipe",
                    userDetails: req.session.user,
                    cardPreferences: cardPreferences || [],
                    cardPreferences2: cardPreferences2 || [],
                    sexualitePreferences: sexualitePreferences || [],
                    likePreferences: likePreferences || [],
                    matches, formattedMatches,
                    usersWithDistances: usersWithDistances // Pass the users with their distances
                });
            });
        }
        );
    });
});


app.get('/api/users', (req, res) => {
    const query = 'SELECT * FROM e_utilisateur';
    con.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching users' });
        }

        const usersWithDetailsPromises = results.map(async (user) => {
            const likes = await getUserLikes(user.e_id);
            const card = await getUserCard(user.e_id);
            const sexualite = await getUserSexualite(user.e_id);

            return {
                ...user,
                likes: likes,
                card: card,
                sexualite: sexualite
            };
        });

        Promise.all(usersWithDetailsPromises).then(usersWithDetails => {
            console.log('Users with all details:', usersWithDetails);
            res.json(usersWithDetails);
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
            const likeNamesList = results.map(row => likeNames[row.like_id]);
            resolve(likeNamesList);
        });
    });
}

function getUserSexualite(userId) {
    const sexualiteQuery = 'SELECT sexualite_id FROM preference WHERE utilisateur_id = ?';
    return new Promise((resolve, reject) => {
        con.query(sexualiteQuery, [userId], (err, results) => {
            if (err) return reject(err);
            const sexualite = results[0] ? results[0].sexualite_id : null;
            console.log("Sexualite:", sexualite);
            resolve(sexualite);
        });
    });
}


function getUserCard(userId) {
    const cardQuery = 'SELECT card_id FROM preference WHERE utilisateur_id = ?';
    return new Promise((resolve, reject) => {
        con.query(cardQuery, [userId], (err, results) => {
            if (err) return reject(err);
            const card = results[0] ? results[0].card_id : null;
            console.log("cards", card);
            resolve(card);
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

app.post('/api/user/preferences', (req, res) => {
    const userId = req.body.userId; // Get user ID from the request body

    const getPreferencesQuery = `
        SELECT card_id, like_id, sexualite_id
        FROM preference 
        WHERE utilisateur_id = ?`;

    con.query(getPreferencesQuery, [userId], (err, preferenceResults) => {
        if (err) {
            console.error('Error fetching user preferences:', err);
            return res.status(500).json({ error: 'Error fetching user preferences' });
        }

        res.json(preferenceResults); // Send the preferences as a JSON response
    });
});

app.post('/api/user/like', (req, res) => {
    const { userId, likedUserId } = req.body;

    // Insert the like into the likes table
    const insertLikeQuery = 'INSERT INTO likes (liker_id, liked_id) VALUES (?, ?)';
    con.query(insertLikeQuery, [userId, likedUserId], (err, result) => {
        if (err) {
            console.error('Error inserting like:', err);
            return res.status(500).json({ error: 'Database error during the like action.' });
        }

        // Check for mutual like
        const checkMutualLikeQuery = 'SELECT * FROM likes WHERE liker_id = ? AND liked_id = ?';
        con.query(checkMutualLikeQuery, [likedUserId, userId], (err, results) => {
            if (err) {
                console.error('Error checking for mutual like:', err);
                return res.status(500).json({ error: 'Database error checking for mutual like.' });
            }

            if (results.length > 0) { // Mutual like found
                // Check if they are already in a match
                const checkMatchQuery = 'SELECT * FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)';
                con.query(checkMatchQuery, [userId, likedUserId, likedUserId, userId], (matchErr, matchResults) => {
                    if (matchErr) {
                        console.error('Error checking for existing match:', matchErr);
                        return res.status(500).json({ error: 'Database error checking for existing match.' });
                    }

                    if (matchResults.length > 0) {
                        return res.json({ match: true, message: 'You are already matched.' });
                    } else {
                        const insertMatchQuery = 'INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)';
                        con.query(insertMatchQuery, [userId, likedUserId], (matchErr, matchResult) => {
                            if (matchErr) {
                                console.error('Error recording match:', matchErr);
                                return res.status(500).json({ error: 'Database error recording match.' });
                            }
                            res.json({ match: true, message: 'Match found!' });
                        });
                    }
                });
            } else {
                res.json({ match: false, message: 'Like recorded, no match found yet.' });
            }
        });
    });
});


app.get('/api/user/details/:id', (req, res) => {
    const { id } = req.params;
    const query = `
    SELECT u.*, p.like_id, l.type_like, p.card_id, c.type_card, p.sexualite_id, s.type_sexualite
    FROM e_utilisateur u
    LEFT JOIN preference p ON p.utilisateur_id = u.e_id
    LEFT JOIN e_likes l ON l.id_like = p.like_id
    LEFT JOIN e_card c ON c.id_card = p.card_id
    LEFT JOIN e_sexualite s ON s.id_sexualite = p.sexualite_id
    WHERE u.e_id = ?
`;


    con.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).json({ error: 'Database error fetching user details.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const preferences = results.map(row => row.type_like).filter(Boolean);
        const cards = results.map(row => row.type_card).filter(Boolean);
        const sexualities = results.map(row => row.type_sexualite).filter(Boolean);

        res.json({
            ...results[0],
            preferences,
            cards,
            sexualities
        });
    });
});


app.get('/api/user/matches', (req, res) => {
    const userId = req.session.user.e_id; // Get logged-in user ID from session

    const getMatchesQuery = `
SELECT m.match_id, 
       u.e_id, 
       u.e_nom, 
       u.e_prenom, 
       u.e_photo, 
       u.e_location
FROM matches m
JOIN e_utilisateur u 
  ON (u.e_id = m.user1_id AND m.user2_id = ?) 
  OR (u.e_id = m.user2_id AND m.user1_id = ?)
WHERE u.e_id != ?;  

    `;

    // Fetch matches for the logged-in user
    con.query(getMatchesQuery, [userId, userId, userId], (err, matches) => {
        if (err) {
            console.error('Error fetching matches:', err);
            return res.status(500).send('Error fetching matches');
        }

        res.json(matches); // Send the matches as a JSON response
    });
});


app.post('/api/save-availability', (req, res) => {
    const { userId, matchId, availabilities } = req.body;

    console.log("Received Data: userId:", userId, "matchId:", matchId, "availabilities:", availabilities);

    if (!userId || !matchId || !Array.isArray(availabilities) || availabilities.length === 0) {
        console.log("Invalid Data:", { userId, matchId, availabilities });
        return res.status(400).json({ error: "Invalid data. Ensure userId, matchId, and availabilities are provided." });
    }

    console.log("Validating matchId in database...");
    const queryFirstUser = `
        SELECT date, time_range 
        FROM availability 
        WHERE match_id = ?;
    `;

    con.query(queryFirstUser, [matchId], (err, firstUserAvailabilities) => {
        if (err) {
            console.error("Error fetching first user's availability:", err);
            return res.status(500).json({ error: "Error fetching availability" });
        }

        console.log("First User's Available Slots:", firstUserAvailabilities);

        // If no availability exists for the first user, save all availabilities for the second user.
        if (firstUserAvailabilities.length === 0) {
            const queries = availabilities.map(slot => {
                return new Promise((resolve, reject) => {
                    const query = `
                        INSERT INTO availability (user_id, match_id, date, time_range)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE time_range = VALUES(time_range);
                    `;
                    con.query(query, [userId, matchId, slot.date, slot.time_range], (err, results) => {
                        if (err) {
                            console.error("Error inserting availability:", err);
                            return reject(err);
                        }
                        resolve(results);
                    });
                });
            });

            Promise.all(queries)
                .then(() => res.json({ success: true }))
                .catch(err => {
                    console.error("Error saving availability:", err);
                    res.status(500).json({ error: "Database error saving availability." });
                });
        } else {
            // Match available slots with first user's availability
            const validSlots = new Set(
                firstUserAvailabilities.map(slot => `${slot.date}-${slot.time_range}`)
            );

            const filteredAvailabilities = availabilities.filter(slot =>
                validSlots.has(`${slot.date}-${slot.time_range}`)
            );

            console.log("Filtered Availabilities (Matching Slots):", filteredAvailabilities);

            // Save all availabilities regardless of match
            const queries = availabilities.map(slot => {
                return new Promise((resolve, reject) => {
                    const query = `
                        INSERT INTO availability (user_id, match_id, date, time_range)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE time_range = VALUES(time_range);
                    `;
                    con.query(query, [userId, matchId, slot.date, slot.time_range], (err, results) => {
                        if (err) {
                            console.error("Error inserting availability:", err);
                            return reject(err);
                        }
                        resolve(results);
                    });
                });
            });

            Promise.all(queries)
                .then(() => {
                    // If there are matching slots, send a "match alert"
                    if (filteredAvailabilities.length > 0) {
                        console.log("Matching slots found:", filteredAvailabilities);
                        return res.json({ success: true, message: "It's a match!" });
                    }

                    // Otherwise, just save the availability without a match
                    console.log("No matching slots found. Saved all availabilities.");
                    return res.json({ success: true, message: "Availability saved, no match yet." });
                })
                .catch(err => {
                    console.error("Error saving availability:", err);
                    res.status(500).json({ error: "Database error saving availability." });
                });
        }
    });
});



app.get('/api/get-availability/:matchId', (req, res) => {
    const { matchId } = req.params;
    const query = `
        SELECT 
            DATE_FORMAT(date, '%Y-%m-%d') AS date, 
            time_range 
        FROM availability 
        WHERE user_id = ?;
    `;
    con.query(query, [matchId], (err, results) => {
        if (err) {
            console.error("Error fetching availability:", err);
            return res.status(500).json({ error: "Error fetching availability" });
        }
        console.log(results);

        res.json(results);
    });
});

app.post('/api/user/unmatch', (req, res) => {
    const { userId, matchedUserId } = req.body;

    const unmatchQuery = `
      DELETE FROM matches 
      WHERE (user1_id = ? AND user2_id = ?) 
         OR (user1_id = ? AND user2_id = ?);
    `;

    console.log("yes it entered the fetch");

    con.query(unmatchQuery, [userId, matchedUserId, matchedUserId, userId], (err, result) => {
        if (err) {
            console.error('Error unmatching user:', err);
            return res.status(500).json({ error: 'Database error during unmatch' });
        }

        // Fetch updated matches list
        con.query('SELECT * FROM matches WHERE user1_id = ? OR user2_id = ?', [userId, userId], (err, matches) => {
            if (err) {
                console.error('Error fetching updated matches:', err);
                return res.status(500).json({ error: 'Error fetching updated matches' });
            }

            // Return updated matches
            res.json({ success: true, matches: matches });
        });
    });
});

app.post('/api/save-date', (req, res) => {
    const { matchId, date, time_range, location } = req.body;

    if (!matchId || !date || !time_range || !location) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const query = `
        INSERT INTO date_info (match_id, date, time_range, location, date_bool)
        VALUES (?, ?, ?, ?, true)
        ON DUPLICATE KEY UPDATE date = VALUES(date), time_range = VALUES(time_range), location = VALUES(location), date_bool = VALUES(date_bool);
    `;

    con.query(query, [matchId, date, time_range, location], (err, result) => {
        if (err) {
            console.error('Error saving date info:', err);
            return res.status(500).json({ error: 'Database error while saving date info.' });
        }

        res.json({ success: true });
    });
});


app.get('/api/get-date/:matchId', (req, res) => {
    const { matchId } = req.params;

    const query = `
        SELECT date, time_range, location, date_bool
        FROM date_info
        WHERE match_id = ?;
    `;

    con.query(query, [matchId], (err, results) => {
        if (err) {
            console.error('Error fetching date info:', err);
            return res.status(500).json({ error: 'Database error while fetching date info.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No date information found for this match.' });
        }

        res.json(results[0]); // Return the first result since match_id is unique
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

    const verifyUserQuery = "SELECT * FROM e_utilisateur WHERE e_courriel = ?";
    con.query(verifyUserQuery, [email], async (err, result) => {
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
            // Fetch current location using IP geolocation
            try {
                const userLocation = await axios.get('http://ip-api.com/json/?fields=lat,lon');
                const { lat, lon } = userLocation.data;
                const userLocationString = `Latitude: ${lat}, Longitude: ${lon}`;

                // Update user's location in the database
                const updateLocationQuery = 'UPDATE e_utilisateur SET e_location = ? WHERE e_id = ?';
                con.query(updateLocationQuery, [userLocationString, user.e_id], (err) => {
                    if (err) {
                        console.error('Error updating location:', err);
                        return res.status(500).send('Error updating location');
                    }

                    // Store user session
                    req.session.user = {
                        e_id: user.e_id,
                        e_nom: user.e_nom,
                        e_prenom: user.e_prenom,
                        date_naissance: user.date_naissance,
                        e_courriel: user.e_courriel,
                        e_photo: user.e_photo,
                        e_location: userLocationString, // Store updated location in session
                        e_number: user.e_number,
                        abonnement_id: user.abonnement_id // Include subscription info
                    };

                    console.log("User connected:", req.session.user); // Log session details
                    res.redirect('/'); // Redirect user to home page
                });
            } catch (err) {
                console.error('Error fetching user location:', err);
                return res.status(500).send('Error fetching location');
            }
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
    const userId = req.session.user ? req.session.user.e_id : null;

    if (!userId) {
        return res.status(400).send('Utilisateur non connecté.');
    }

    // Step-by-step deletion queries to remove related data
    const deleteAvailabilityByMatchQuery = 'DELETE FROM availability WHERE match_id IN (SELECT e_id FROM e_utilisateur WHERE e_id = ?)';
    const deleteAvailabilityByUserQuery = 'DELETE FROM availability WHERE user_id = ?';
    const deleteDateInfoQuery = 'DELETE FROM date_info WHERE match_id IN (SELECT match_id FROM matches WHERE user1_id = ? OR user2_id = ?)';
    const deleteLikesQuery = 'DELETE FROM likes WHERE liker_id = ? OR liked_id = ?';
    const deleteMatchesQuery = 'DELETE FROM matches WHERE user1_id = ? OR user2_id = ?';
    const deletePreferencesQuery = 'DELETE FROM preference WHERE utilisateur_id = ?';
    const deletePhotosQuery = 'DELETE FROM e_photo WHERE utilisateur_id = ?';
    const deleteUserQuery = 'DELETE FROM e_utilisateur WHERE e_id = ?';

    // Execute queries sequentially to avoid dependency issues
    con.query(deleteAvailabilityByMatchQuery, [userId], (err) => {
        if (err) {
            console.error('Error deleting availability by match:', err);
            return res.status(500).send('Erreur lors de la suppression de la disponibilité par match.');
        }

        con.query(deleteAvailabilityByUserQuery, [userId], (err) => {
            if (err) {
                console.error('Error deleting availability by user:', err);
                return res.status(500).send('Erreur lors de la suppression de la disponibilité par utilisateur.');
            }

            con.query(deleteDateInfoQuery, [userId, userId], (err) => {
                if (err) {
                    console.error('Error deleting date info:', err);
                    return res.status(500).send('Erreur lors de la suppression des informations de rendez-vous.');
                }

                con.query(deleteLikesQuery, [userId, userId], (err) => {
                    if (err) {
                        console.error('Error deleting likes:', err);
                        return res.status(500).send('Erreur lors de la suppression des likes.');
                    }

                    con.query(deleteMatchesQuery, [userId, userId], (err) => {
                        if (err) {
                            console.error('Error deleting matches:', err);
                            return res.status(500).send('Erreur lors de la suppression des correspondances.');
                        }

                        con.query(deletePreferencesQuery, [userId], (err) => {
                            if (err) {
                                console.error('Error deleting preferences:', err);
                                return res.status(500).send('Erreur lors de la suppression des préférences.');
                            }

                            con.query(deletePhotosQuery, [userId], (err) => {
                                if (err) {
                                    console.error('Error deleting photos:', err);
                                    return res.status(500).send('Erreur lors de la suppression des photos.');
                                }

                                // Finally, delete the user
                                con.query(deleteUserQuery, [userId], (err) => {
                                    if (err) {
                                        console.error('Error deleting user:', err);
                                        return res.status(500).send('Erreur lors de la suppression de l\'utilisateur.');
                                    }

                                    req.session.destroy((err) => {
                                        if (err) {
                                            console.error('Error during session destruction:', err);
                                            return res.status(500).send('Erreur lors de la déconnexion.');
                                        }

                                        res.redirect('/'); // Redirect to homepage after successful deletion
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});



/*
-----------------------------
  Inscrire à un compte
-----------------------------
*/



app.post('/event/inscription', upload.single('photo'), (req, res) => {
    const { email, password, phone, firstName, lastName, birthdate, gender, selectedCard, selectedLikes, selectedSexualite } = req.body;
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

            // Retrieve the ID of the newly inserted user
            const userId = result.insertId;
            // Prepare to insert card preference if selected
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
                        // Now insert the preference
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
            // Insert likes preferences if selected
            let likesPromises = [];
            if (selectedLikes) {
                console.log(selectedLikes);
                const likesArray = selectedLikes.split(',').map(like => like.trim()); // Trim spaces
                console.log("Trimmed likes being processed:", likesArray); // Debugging output
                likesPromises = likesArray.map(like => {
                    return new Promise((resolve, reject) => {
                        console.log("Fetching like ID for:", like); // Debugging output
                        const fetchLikeIdQuery = "SELECT id_like FROM e_likes WHERE type_like = ?";
                        con.query(fetchLikeIdQuery, [like], (err, likeResult) => {
                            if (err) {
                                console.error("Error fetching like ID:", err);
                                return reject("Internal Server Error");
                            }
                            if (likeResult.length === 0) {
                                console.error("Selected like not found in database:", like); // Debugging output
                                return reject(`Selected like "${like}" not valid`);
                            }
                            const likeId = likeResult[0].id_like;
                            // Now insert the preference
                            const insertLikePreferenceQuery = `
                     INSERT INTO preference (utilisateur_id, like_id)
                     VALUES (?, ?)
                 `;
                            con.query(insertLikePreferenceQuery, [userId, likeId], (err) => {
                                if (err) {
                                    console.error("Error inserting like preference:", err);
                                    return reject("Error inserting like preference");
                                }
                                console.log(`Like ${like} added/updated successfully.`); // Successful insert log
                                resolve();
                            });
                        });
                    });
                });
            }

            let sexualiteIdPromise = Promise.resolve();
            if (selectedSexualite) {
                console.log("Selected sexualite:", selectedSexualite); // Log selectedSexualite value

                sexualiteIdPromise = new Promise((resolve, reject) => {
                    const fetchSexualiteIdQuery = "SELECT id_sexualite FROM e_sexualite WHERE id_sexualite = ?";
                    console.log("Running query:", fetchSexualiteIdQuery, "with value:", selectedSexualite);

                    con.query(fetchSexualiteIdQuery, [selectedSexualite], (err, sexualiteResult) => {
                        if (err) {
                            console.error("Error fetching sexualite ID:", err);
                            return reject("Internal Server Error");
                        }
                        if (sexualiteResult.length === 0) {
                            console.error("Selected sexualite not found in database:", selectedSexualite);
                            return reject("Selected sexualite not valid");
                        }
                        const sexualiteId = sexualiteResult[0].id_sexualite;
                        // Insert the preference
                        const insertSexualitePreferenceQuery = `
                            INSERT INTO preference (utilisateur_id, sexualite_id)
                            VALUES (?, ?)
                        `;
                        con.query(insertSexualitePreferenceQuery, [userId, sexualiteId], (err) => {
                            if (err) {
                                console.error("Error inserting sexualite preference:", err);
                                return reject("Error inserting sexualite preference");
                            }
                            resolve();
                        });
                    });
                }).catch((error) => {
                    console.error("Promise error in sexualiteIdPromise:", error);
                });
            }

            // Wait for all promises to resolve and handle any rejections
            Promise.all([cardIdPromise, sexualiteIdPromise, ...likesPromises])
                .then(() => {
                    // Log the user in by setting the session
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
                    return res.redirect('/'); // Redirect after successful registration
                })
                .catch((error) => {
                    console.error("Error during registration:", error);
                    return res.status(500).send(error); // Handle any errors from promises
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


app.post('/event/update-profile-picture', upload.single('profilePicture'), (req, res) => {
    const userId = req.session.user.e_id; // Ensure the user is logged in
    const uploadedPhoto = req.file ? req.file.filename : null;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'Utilisateur non connecté.' });
    }

    if (!uploadedPhoto) {
        return res.status(400).json({ success: false, message: 'Aucune photo téléchargée.' });
    }

    // Get the existing profile picture to delete later
    const getPhotoQuery = 'SELECT e_photo FROM e_utilisateur WHERE e_id = ?';
    con.query(getPhotoQuery, [userId], (err, result) => {
        if (err) {
            console.error('Error fetching current profile picture:', err);
            return res.status(500).json({ success: false, message: 'Erreur serveur.' });
        }

        const currentPhoto = result[0]?.e_photo;

        // Update the profile picture in the database
        const updatePhotoQuery = 'UPDATE e_utilisateur SET e_photo = ? WHERE e_id = ?';
        con.query(updatePhotoQuery, [uploadedPhoto, userId], (err) => {
            if (err) {
                console.error('Error updating profile picture in database:', err);
                return res.status(500).json({ success: false, message: 'Erreur serveur.' });
            }

            // Delete the old profile picture from the server, if it exists
            if (currentPhoto && currentPhoto !== 'default.jpg') {
                const oldPhotoPath = path.join(__dirname, '/uploads', currentPhoto);
                fs.unlink(oldPhotoPath, (err) => {
                    if (err) {
                        console.error('Error deleting old profile picture:', err);
                    }
                });
            }

            // Update the session to reflect the new profile picture
            req.session.user.e_photo = uploadedPhoto;

            return res.json({
                success: true,
                message: 'Photo de profil mise à jour avec succès.',
                photoUrl: `/uploads/${uploadedPhoto}`
            });
        });
    });
});