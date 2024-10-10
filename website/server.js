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
app.use('/images', express.static(path.join(__dirname, '/website/images')));


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
        // Redirect to login page if not logged in
        return res.redirect("/event/inscription");
    }

    // Render profile page with default message and messageType
    res.render("pages/profil", {
        siteTitle: "Profil",
        pageTitle: "Votre Profil",
        userDetails: req.session.user,
        message: null, // No message by default
        messageType: '' // No message type by default
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

    const { sourceId, amount, subscriptionType, 'confirmation-email': confirmationEmail } = req.body;

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

        // Make sure subscriptionType is correct
        console.log("Subscription Type:", subscriptionType); // Add this line

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

            const { e_id } = req.session.user || {}; // Get logged-in user's e_id from session

            if (!e_id) {
                return res.status(401).send('User not logged in');
            }

            // Update the logged-in user's abonnement_id instead of inserting a new user
            const updateQuery = `
            UPDATE e_utilisateur
            SET abonnement_id = ?
            WHERE e_id = ?
            `;

            con.query(updateQuery, [subscriptionId, e_id], (err, result) => {
                if (err) {
                    console.error('Error updating user subscription:', err);
                    return res.status(500).send('Error updating user subscription');
                }
                req.session.user.abonnement_id = subscriptionId; // Ensure session is updated

                // Optional: Fetch the updated user details from the database
                const fetchUpdatedUserQuery = "SELECT * FROM e_utilisateur WHERE e_id = ?";
                con.query(fetchUpdatedUserQuery, [e_id], (err, updatedUserResult) => {
                    if (err) {
                        console.error('Error fetching updated user:', err);
                        return;
                    }
                    // Update session with new user details
                    req.session.user = updatedUserResult[0]; // Assuming updatedUserResult has user details
                });

                // Store payment details in the session
                req.session.subscriptionType = subscriptionType; // Store subscription type
                req.session.paymentId = paymentResponse.result.payment.id; // Store payment ID

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

app.post('/event/change-password', async (req, res) => {
    const { old_password, new_password, confirm_password } = req.body;
    const userId = req.session.user.e_id; // Assuming user ID is stored in session

    // Ensure all fields are provided
    if (!old_password || !new_password || !confirm_password) {
        return res.render('pages/profil', {
            userDetails: req.session.user,
            message: 'Tous les champs sont requis',
            messageType: 'error'
        });
    }

    // Check if new password and confirmation match
    if (new_password !== confirm_password) {
        return res.render('pages/profil', {
            userDetails: req.session.user,
            message: 'Les mots de passe ne correspondent pas',
            messageType: 'error'
        });
    }

    try {
        // Fetch the user's current password from the database
        const query = 'SELECT e_password FROM e_utilisateur WHERE e_id = ?';
        con.query(query, [userId], async (err, result) => {
            if (err) {
                console.error('Error fetching user:', err);
                return res.render('pages/profil', {
                    userDetails: req.session.user,
                    message: 'Erreur serveur. Veuillez réessayer.',
                    messageType: 'error'
                });
            }

            if (result.length === 0) {
                return res.render('pages/profil', {
                    userDetails: req.session.user,
                    message: 'Utilisateur non trouvé',
                    messageType: 'error'
                });
            }

            const user = result[0];

            // Compare the current password directly (for plain-text passwords)
            if (old_password !== user.e_password) {
                return res.render('pages/profil', {
                    userDetails: req.session.user,
                    message: 'Le mot de passe actuel est incorrect',
                    messageType: 'error'
                });
            }

            // Update the password in the database
            const updateQuery = 'UPDATE e_utilisateur SET e_password = ? WHERE e_id = ?';
            con.query(updateQuery, [new_password, userId], (err, result) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.render('pages/profil', {
                        userDetails: req.session.user,
                        message: 'Erreur lors de la mise à jour du mot de passe',
                        messageType: 'error'
                    });
                }

                // Update successful
                return res.render('pages/profil', {
                    userDetails: req.session.user,
                    message: 'Le mot de passe a bien été changé',
                    messageType: 'success'
                });
            });
        });
    } catch (error) {
        console.error('Error processing password change:', error);
        return res.render('pages/profil', {
            userDetails: req.session.user,
            message: 'Erreur interne. Veuillez réessayer plus tard.',
            messageType: 'error'
        });
    }
});

// Assuming this is part of your server.js

app.post('/event/delete-account', (req, res) => {
    const userId = req.session.user ? req.session.user.e_id : null; // Ensure session exists

    if (!userId) {
        return res.status(400).send('Utilisateur non connecté.');
    }

    const deleteUserQuery = 'DELETE FROM e_utilisateur WHERE e_id = ?';

    con.query(deleteUserQuery, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).send('Erreur interne du serveur.');
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




// Create a new account
app.post('/event/inscription', (req, res) => {
    const { email, password, phone, firstName, lastName, birthdate } = req.body;

    // Check if email already exists
    const checkEmailQuery = "SELECT * FROM e_utilisateur WHERE e_courriel = ?";
    con.query(checkEmailQuery, [email], (err, result) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.status(500).send("Internal Server Error");
        }

        if (result.length > 0) {
            return res.status(409).send("Email already in use");
        }

        // If email does not exist, insert new user
        const insertUserQuery = `
            INSERT INTO e_utilisateur (e_nom, e_prenom, date_naissance, e_courriel, e_photo, e_location, e_number, e_password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Assuming e_photo and e_location are not being used right now, use placeholders
        const defaultPhoto = null;  // Replace with actual photo handling if needed
        const defaultLocation = 'Unknown';  // Replace with location handling if needed

        con.query(insertUserQuery, [lastName, firstName, birthdate, email, defaultPhoto, defaultLocation, phone, password], (err, result) => {
            if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).send("Internal Server Error");
            }

            console.log("New user inserted:", result);
            req.session.user = { email, firstName }; // Set session for the new user
            res.redirect('/');
        });
    });
});

