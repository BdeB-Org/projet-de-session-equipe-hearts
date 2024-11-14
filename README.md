# Pour deployer notre application 
1. Ouvrir CMD(terminal) et entrez cette ligne de commande : docker run -d -p 3306:3306 --name heart-server -e MYSQL_ROOT_PASSWORD=oracle -e MYSQL_DATABASE=scott -e MYSQL_USER=scott -e MYSQL_PASSWORD=oracle mysql/mysql-server:latest
2. Ouvrir Desktop Docker et partez le conteneur.
3. Cliquez sur les 3 petits points et allez dans le terminal du conteneur heart-server.
4. Entrez la commande dans la terminal du heart-server: mysql -u root -p et entrez le mot de passe : oracle 
6. Exécutez la ligne de commande en dessous dans Docker Desktop du gym-server ** OUVRIR LE README POUR COPY PASTE (NE PAS UTILISER LE PREVIEW) **
7. Ouvrir le fichier github dans visual studio code et aller dans le répertoire \git_web\Hearts\hearts\Projet_etudiant1>
8. Exécuter le server avec : node server.js
9. Ouvrez http://localhost:4000/ dans votre navigateur web.
10. Ajoutez les modules nodes suivants :

# Packages (Terminal VS)

npm install multer dotenv square nodemailer googleapis node-cron crypto-js passport-facebook passport-twitter passport-apple passport passport-google-oauth20 express-session axios

# Base de données

CREATE DATABASE myhearts;

USE myhearts;

ALTER TABLE preference DROP FOREIGN KEY preference_ibfk_1; -- Utilisateur_id
ALTER TABLE preference DROP FOREIGN KEY preference_ibfk_2; -- Card_id
ALTER TABLE preference DROP FOREIGN KEY preference_ibfk_3; -- Like_id

ALTER TABLE relation_5 DROP FOREIGN KEY relation_5_ibfk_1; -- Utilisateur_id_utilisateur
ALTER TABLE relation_5 DROP FOREIGN KEY relation_5_ibfk_2; -- Lieu_id_lieu

ALTER TABLE likes DROP FOREIGN KEY likes_ibfk_1; -- user
ALTER TABLE likes DROP FOREIGN KEY likes_ibfk_2; -- user

ALTER TABLE matches DROP FOREIGN KEY matches_ibfk_1;
ALTER TABLE matches DROP FOREIGN KEY matches_ibfk_2;

ALTER TABLE e_photo DROP FOREIGN KEY e_photo_ibfk_1;

DROP TABLE IF EXISTS e_utilisateur;
DROP TABLE IF EXISTS e_abonnement;
DROP TABLE IF EXISTS lieu;
DROP TABLE IF EXISTS preference;
DROP TABLE IF EXISTS relation_5;
DROP TABLE IF EXISTS e_card;
DROP TABLE IF EXISTS e_likes;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS e_photo;

CREATE TABLE e_utilisateur (
    e_id INT AUTO_INCREMENT NOT NULL,
    e_nom VARCHAR(100) NOT NULL,
    e_prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NULL,
    e_courriel VARCHAR(100) NOT NULL,
    e_photo VARCHAR(255) NULL,
    e_location TEXT NOT NULL,
    e_number TEXT NOT NULL,
    e_password VARCHAR(255),
    abonnement_id VARCHAR(255),
    swipe_count INT DEFAULT 0,
    last_swipe_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    genre VARCHAR(10) NOT NULL,
    googleId VARCHAR(255) UNIQUE,
    PRIMARY KEY (e_id)
);

CREATE TABLE e_photo (
    id_photo INT AUTO_INCREMENT NOT NULL,
    utilisateur_id INT NOT NULL,
    photo_url VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_photo),
    FOREIGN KEY (utilisateur_id) REFERENCES e_utilisateur(e_id) ON DELETE CASCADE
);

CREATE TABLE e_abonnement (
    e_id INT NOT NULL,
    e_type VARCHAR(100) NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    e_duree INT NOT NULL,
    PRIMARY KEY (e_id)
);

CREATE TABLE lieu (
    id_lieu INT NOT NULL,
    nom VARCHAR(100) NOT NULL,
    type_lieu VARCHAR(100),
    adresse VARCHAR(100),
    PRIMARY KEY (id_lieu)
);

CREATE TABLE e_card (
    id_card INT AUTO_INCREMENT NOT NULL,
    type_card VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_card)
);

CREATE TABLE e_likes (
    id_like INT AUTO_INCREMENT NOT NULL,
    type_like VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_like)
);

CREATE TABLE e_sexualite (
    id_sexualite INT AUTO_INCREMENT NOT NULL,
    type_sexualite VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_sexualite)
);


CREATE TABLE preference (
    id_preference INT AUTO_INCREMENT NOT NULL,
    utilisateur_id INT,
    card_id INT,
    like_id INT,
    sexualite_id INT,
    PRIMARY KEY (id_preference),
    FOREIGN KEY (utilisateur_id) REFERENCES e_utilisateur(e_id),
    FOREIGN KEY (card_id) REFERENCES e_card(id_card),
    FOREIGN KEY (like_id) REFERENCES e_likes(id_like),
    FOREIGN KEY (sexualite_id) REFERENCES e_sexualite(id_sexualite)
);

CREATE TABLE likes (
    like_id INT AUTO_INCREMENT PRIMARY KEY,
    liker_id INT NOT NULL,
    liked_id INT NOT NULL,
    like_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (liker_id) REFERENCES e_utilisateur(e_id),
    FOREIGN KEY (liked_id) REFERENCES e_utilisateur(e_id)
);

CREATE TABLE matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    match_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES e_utilisateur(e_id),
    FOREIGN KEY (user2_id) REFERENCES e_utilisateur(e_id)
);

CREATE TABLE relation_5 (
    utilisateur_id_utilisateur INT NOT NULL,
    lieu_id_lieu INT NOT NULL,
    PRIMARY KEY (utilisateur_id_utilisateur, lieu_id_lieu),
    FOREIGN KEY (lieu_id_lieu) REFERENCES lieu(id_lieu),
    FOREIGN KEY (utilisateur_id_utilisateur) REFERENCES utilisateur(id_utilisateur)
);

GRANT ALL PRIVILEGES ON *.* TO 'scott'@'%';
ALTER USER 'scott'@'%' IDENTIFIED WITH mysql_native_password BY 'oracle';
FLUSH PRIVILEGES;

# Insertions de la bdd (comptes test)

INSERT INTO e_utilisateur (e_nom, e_prenom, e_courriel, e_password, e_photo, e_location, e_number, abonnement_id, swipe_count, last_swipe_time, genre, googleId)
VALUES
    ('Test1', 'User', '1@gmail.com', 'a', 'user1photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Homme', '1'),
    ('Test2', 'User', '2@gmail.com', 'a', 'user2photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Homme', '2'),
    ('Test3', 'User', '3@gmail.com', 'a', 'user3photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Femme', '3'),
    ('Test4', 'User', '4@gmail.com', 'a', 'user4photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Femme', '4'),
    ('Test5', 'User', '5@gmail.com', 'a', 'user5photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Homme', '5'),
    ('Test6', 'User', '6@gmail.com', 'a', 'user6photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Femme', '6'),
    ('Test7', 'User', '7@gmail.com', 'a', 'user7photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Homme', '7'),
    ('Test8', 'User', '8@gmail.com', 'a', 'user8photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Femme', '8'),
    ('Test9', 'User', '9@gmail.com', 'a', 'user9photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Homme', '9'),
    ('Test10', 'User', '10@gmail.com', 'a', 'user10photo.jpg', 'Montreal', '1234567890', 1, 0, CURRENT_TIMESTAMP, 'Femme', '20');

INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (1, 2, 1, 1),  -- Test1: Joker, Musique, Homme
    (1, 2, 3, 1),  -- Test1: Joker, Voyages, Homme
    (1, 2, 4, 1);  -- Test1: Joker, Sport, Homme
-- Preferences for Test2 (User with e_id = 2)
INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (2, 2, 1, 1),  -- Test2: Joker, Musique, Homme
    (2, 2, 2, 1),  -- Test2: Joker, Cinéma, Homme
    (2, 2, 3, 1);  -- Test2: Joker, Voyages, Homme

-- Preferences for Test3 (User with e_id = 3)
INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (3, 3, 1, 2),  -- Test3: Reine, Musique, Femme
    (3, 3, 4, 2),  -- Test3: Reine, Sport, Femme
    (3, 3, 6, 2);  -- Test3: Reine, Cuisine, Femme

-- Preferences for Test4 (User with e_id = 4)
INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (4, 4, 1, 2),  -- Test4: Roi, Musique, Femme
    (4, 4, 3, 2),  -- Test4: Roi, Voyages, Femme
    (4, 4, 5, 2);  -- Test4: Roi, Lecture, Femme

-- Preferences for Test5 (User with e_id = 5)
INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (5, 1, 1, 1),  -- Test5: Ace, Musique, Homme
    (5, 1, 4, 1),  -- Test5: Ace, Sport, Homme
    (5, 1, 6, 1);  -- Test5: Ace, Cuisine, Homme

-- Preferences for Test6 (User with e_id = 6)
INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (6, 2, 2, 2),  -- Test6: Joker, Cinéma, Femme
    (6, 2, 3, 2),  -- Test6: Joker, Voyages, Femme
    (6, 2, 5, 2);  -- Test6: Joker, Lecture, Femme

-- Preferences for Test7 (User with e_id = 7)
INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (7, 3, 1, 1),  -- Test7: Reine, Musique, Homme
    (7, 3, 2, 1),  -- Test7: Reine, Cinéma, Homme
    (7, 3, 4, 1);  -- Test7: Reine, Sport, Homme

-- Preferences for Test8 (User with e_id = 8)
INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (8, 4, 1, 2),  -- Test8: Roi, Musique, Femme
    (8, 4, 2, 2),  -- Test8: Roi, Cinéma, Femme
    (8, 4, 3, 2);  -- Test8: Roi, Voyages, Femme

-- Preferences for Test9 (User with e_id = 9)
INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (9, 1, 2, 1),  -- Test9: Ace, Cinéma, Homme
    (9, 1, 4, 1),  -- Test9: Ace, Sport, Homme
    (9, 1, 5, 1);  -- Test9: Ace, Lecture, Homme

-- Preferences for Test10 (User with e_id = 10)
INSERT INTO preference (utilisateur_id, card_id, like_id, sexualite_id)
VALUES
    (10, 2, 1, 2),  -- Test10: Joker, Musique, Femme
    (10, 2, 4, 2),  -- Test10: Joker, Sport, Femme
    (10, 2, 6, 2);  -- Test10: Joker, Cuisine, Femme


