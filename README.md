# Pour deployer notre application 
1. Ouvrir CMD(terminal) et entrez cette ligne de commande : docker run -d -p 3306:3306 --name heart-server -e MYSQL_ROOT_PASSWORD=oracle -e MYSQL_DATABASE=scott -e MYSQL_USER=scott -e MYSQL_PASSWORD=oracle mysql/mysql-server:latest
   et
2. Ouvrir Desktop Docker et partez le conteneur.
3. Cliquez sur les 3 petits points et allez dans le terminal du conteneur heart-server.
4. Entrez la commande dans la terminal du heart-server: mysql -u root -p et entrez le mot de passe : oracle 
6. Exécutez la ligne de commande en dessous dans Docker Desktop du gym-server ** OUVRIR LE README POUR COPY PASTE (NE PAS UTILISER LE PREVIEW) **
7. Ouvrir le fichier github dans visual studio code et aller dans le répertoire \git_web\Hearts\hearts\Projet_etudiant1>
8. Exécuter le server avec : node server.js
9. Ouvrez http://localhost:4000/ dans votre navigateur web.
10. Ajoutez les modules nodes suivants :

# Installez ces packages dans le terminal :

npm install multer dotenv square nodemailer googleapis node-cron crypto-js passport-facebook passport-twitter passport-apple passport passport-google-oauth20 express-session

# Base de données

CREATE DATABASE myhearts;

USE myhearts;

ALTER TABLE preference DROP FOREIGN KEY preference_ibfk_1; -- Utilisateur_id
ALTER TABLE preference DROP FOREIGN KEY preference_ibfk_2; -- Card_id
ALTER TABLE preference DROP FOREIGN KEY preference_ibfk_3; -- Like_id

ALTER TABLE relation_5 DROP FOREIGN KEY relation_5_ibfk_1; -- Utilisateur_id_utilisateur
ALTER TABLE relation_5 DROP FOREIGN KEY relation_5_ibfk_2; -- Lieu_id_lieu

DROP TABLE IF EXISTS e_utilisateur;
DROP TABLE IF EXISTS e_abonnement;
DROP TABLE IF EXISTS lieu;
DROP TABLE IF EXISTS preference;
DROP TABLE IF EXISTS relation_5;
DROP TABLE IF EXISTS e_card;
DROP TABLE IF EXISTS e_likes;

CREATE TABLE e_utilisateur (
    e_id INT AUTO_INCREMENT NOT NULL,
    e_nom VARCHAR(100) NOT NULL,
    e_prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    e_courriel VARCHAR(100) NOT NULL,
    e_photo VARCHAR(255) NULL,
    e_location TEXT NOT NULL,
    e_number TEXT NOT NULL,
    e_password VARCHAR(255),
    abonnement_id VARCHAR(255),
    swipe_count INT DEFAULT 0,
    last_swipe_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    genre VARCHAR(10) NOT NULL,
    PRIMARY KEY (e_id)
);
ALTER TABLE e_utilisateur 
ADD COLUMN facebookId VARCHAR(255) UNIQUE,
ADD COLUMN twitterId VARCHAR(255) UNIQUE,
ADD COLUMN appleId VARCHAR(255) UNIQUE;
ADD COMLUM googleId VARCHAR(255) UNIQUE; 

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


CREATE TABLE preference (
    id_preference INT AUTO_INCREMENT NOT NULL,
    utilisateur_id INT,
    card_id INT,
    like_id INT,
    PRIMARY KEY (id_preference),
    FOREIGN KEY (utilisateur_id) REFERENCES e_utilisateur(e_id),
    FOREIGN KEY (card_id) REFERENCES e_card(id_card),
    FOREIGN KEY (like_id) REFERENCES e_likes(id_like)
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

