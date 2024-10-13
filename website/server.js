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

app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(express.json()); // For parsing application/json

/*
------------------------------------------
PTSD NODE MAILER
------------------------------------------
*/

let transporter;

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_UR
);

// Set the credentials, using the refresh token from your .env file
oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

console.log(process.env.REFRESH_TOKEN);

try {
    const accessToken = await oauth2Client.getAccessToken();
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.GMAIL_USER,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: accessToken.token, // Use accessToken.token instead of accessToken
        },
    });

    // The transporter is now ready for use, and you can send emails later in your code
    console.log('Nodemailer transporter is set up and ready to use.');

} catch (error) {
    console.error('Error setting up email transporter:', error);
    // Handle the error appropriately, such as sending a response back to the client
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


con.connect(function (err) {
    if (err) throw err;
    console.log("connected!");
    initializeSubscriptions();
});



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
    Pages gets
------------------------------------------
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


app.get('/api/users', (req, res) => {
    const query = 'SELECT * FROM e_utilisateur';
    con.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching users' });
        }
        res.json(results); // Send user data as JSON
    });
});

app.get('/api/user/swipe-data/:userId', (req, res) => {
    const userId = req.params.userId;
    const currentTime = new Date(); // Get current time

    // Query database to get swipe_count and last_swipe_time for the user
    con.query('SELECT swipe_count, last_swipe_time FROM e_utilisateur WHERE e_id = ?', [userId], (error, results) => {
        if (error) throw error;

        const user = results[0];
        const lastSwipeTime = new Date(user.last_swipe_time);

        // Get today's date at 12am
        const todayAtMidnight = new Date();
        todayAtMidnight.setHours(0, 0, 0, 0); // Set time to 12 am

        // Check if last swipe time is before today at 12 am
        if (lastSwipeTime < todayAtMidnight) {
            // Reset the swipe count and last swipe time for the new day
            user.swipe_count = 0;
            con.query('UPDATE e_utilisateur SET swipe_count = 0, last_swipe_time = CURRENT_TIMESTAMP WHERE e_id = ?', [userId], (err) => {
                if (err) throw err;
            });
        }

        // Return the updated swipe count and last swipe time
        res.json({
            swipe_count: user.swipe_count,
            last_swipe_time: user.last_swipe_time
        });
    });
});

app.post('/api/user/update-swipe', (req, res) => {
    const { userId, swipeCount, swipeTime } = req.body;

    // Update the user's swipe_count and last_swipe_time
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
  Connectez a un compte
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
  Déconnectez a un compte
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
  Payer un abonnement
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
  Changer l'abonnement a gratuir
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
  Changer le mot de passe
*/


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

/*
  Delete un compte
*/


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


/*
  Inscrire a un compte
*/



import multer from 'multer';

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' }); // or configure as needed for file storage

// Use multer in the POST route
app.post('/event/inscription', upload.single('photo'), (req, res) => {
    const { email, password, phone, firstName, lastName, birthdate } = req.body;

    // Debug: print the request body and file
    console.log(req.body);  // Should now show form values
    console.log(req.file);  // Shows file details if a photo was uploaded

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

        const defaultLocation = 'Unknown';  // Replace with location handling if needed
        const uploadedPhoto = req.file ? req.file.filename : null; // Save the file path if photo was uploaded

        con.query(insertUserQuery, [lastName, firstName, birthdate, email, uploadedPhoto, defaultLocation, phone, password], (err, result) => {
            if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).send("Internal Server Error");
            }

            console.log("New user inserted:", result);
            req.session.user = { email, firstName, lastName }; // Set session for the new user
            res.redirect('/');
        });
    });
});

