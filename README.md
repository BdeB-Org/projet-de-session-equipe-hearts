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

npm install
npm install multer
npm install
npm install dotenv
npm install square
npm install nodemailer


CREATE DATABASE myhearts;

USE myhearts;

DROP TABLE e_utilisateur;
DROP TABLE e_abonnement;
DROP TABLE lieu;
DROP TABLE preference;
DROP TABLE relation_5;

CREATE TABLE e_utilisateur (
    e_id INT AUTO_INCREMENT NOT NULL,
    e_nom VARCHAR(100) NOT NULL,
    e_prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    e_courriel VARCHAR(100) NOT NULL,
    e_photo LONGBLOB NULL,
    e_location TEXT NOT NULL,
    e_number TEXT NOT NULL,
    e_password VARCHAR(255),
    abonnement_id VARCHAR(255),
    PRIMARY KEY (e_id)
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

CREATE TABLE preference (
    id_preference INT NOT NULL,
    utilisateur_id_utilisateur INT,
    type_pref VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_preference),
    FOREIGN KEY (utilisateur_id_utilisateur) REFERENCES utilisateur(id_utilisateur)
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

