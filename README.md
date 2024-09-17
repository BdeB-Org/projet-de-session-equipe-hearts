# Pour deployer notre application 
1. Ouvrir CMD(terminal) et entrez cette ligne de commande : docker run -d -p 3306:3306 --name heart-server -e MYSQL_ROOT_PASSWORD=oracle -e MYSQL_DATABASE=scott -e MYSQL_USER=scott -e MYSQL_PASSWORD=oracle mysql/mysql-server:latest
   et
2.  docker run --name mongo -d -p 27017:27017 mongodb/mongodb-community-server:latest
3. Ouvrir Desktop Docker et partez les deux conteneurs.
4. Cliquez sur les 3 petits points et allez dans le terminal du conteneur gym-server.
5. Entrez la commande dans la terminal du gym-server: mysql -u root -p et entrez le mot de passe : oracle 
6. Exécutez la ligne de commande en dessous dans Docker Desktop du gym-server ** OUVRIR LE README POUR COPY PASTE (NE PAS UTILISER LE PREVIEW) **
7. Ouvrir le fichier github dans visual studio code et aller dans le répertoire \git_web\Hearts\hearts\Projet_etudiant1>
8. Connectez a Mongo en utilsant l'extension MongoDB (feuille d'arbre) dans visual studio code
9. Exécuter le server avec : node server.js
10. Ouvrez http://localhost:4000/ dans votre navigateur web.
11. Pour tester la page admin, connectez a cette compte:
    Courriel: peaklabs1@gmail.com
    Mot de Passe: a
12. Pour tester des paiements, utiliser la carte 4242 4242 4242 4242 date : (12 / 30) CVC : (300) Code Postal : H4L 2N3

CREATE DATABASE myhearts;

USE myhearts;


GRANT ALL PRIVILEGES ON *.* TO 'scott'@'%';
ALTER USER 'scott'@'%' IDENTIFIED WITH mysql_native_password BY 'oracle';
FLUSH PRIVILEGES;

