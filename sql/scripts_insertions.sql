-- Généré par Oracle SQL Developer Data Modeler 23.1.0.087.0806
--   à :        2024-08-27 11:36:16 HAE
--   site :      Oracle Database 11g
--   type :      Oracle Database 11g



-- predefined type, no DDL - MDSYS.SDO_GEOMETRY

-- predefined type, no DDL - XMLTYPE

CREATE TABLE abonnement (
    id_abonnement              NUMBER NOT NULL,
    nom                        VARCHAR2(100) NOT NULL,
    prix                       NUMBER NOT NULL,
    duree                      NUMBER NOT NULL,
    date_creation              DATE NOT NULL,
    utilisateur_id_utilisateur NUMBER NOT NULL
);

ALTER TABLE abonnement ADD CONSTRAINT abonnement_pk PRIMARY KEY ( id_abonnement );

CREATE TABLE lieu (
    id_lieu   NUMBER NOT NULL,
    nom       VARCHAR2(100) NOT NULL,
    type_lieu VARCHAR2(100),
    adresse   VARCHAR2(100)
);

ALTER TABLE lieu ADD CONSTRAINT lieu_pk PRIMARY KEY ( id_lieu );

CREATE TABLE preference (
    id_preference              NUMBER NOT NULL,
    utilisateur_id_utilisateur NUMBER,
    type_pref                  VARCHAR2(100) NOT NULL
);

ALTER TABLE preference ADD CONSTRAINT preference_pk PRIMARY KEY ( id_preference );

CREATE TABLE relation_5 (
    utilisateur_id_utilisateur NUMBER NOT NULL,
    lieu_id_lieu               NUMBER NOT NULL
);

ALTER TABLE relation_5 ADD CONSTRAINT relation_5_pk PRIMARY KEY ( utilisateur_id_utilisateur,
                                                                  lieu_id_lieu );

CREATE TABLE utilisateur (
    id_utilisateur NUMBER NOT NULL,
    nom            VARCHAR2(100) NOT NULL,
    prenom         VARCHAR2(100) NOT NULL,
    date_naissance DATE NOT NULL,
    courriel       VARCHAR2(100) NOT NULL,
    photo          BLOB NOT NULL
);

ALTER TABLE utilisateur ADD CONSTRAINT utilisateur_pk PRIMARY KEY ( id_utilisateur );

ALTER TABLE abonnement
    ADD CONSTRAINT abonnement_utilisateur_fk FOREIGN KEY ( utilisateur_id_utilisateur )
        REFERENCES utilisateur ( id_utilisateur );

ALTER TABLE preference
    ADD CONSTRAINT preference_utilisateur_fk FOREIGN KEY ( utilisateur_id_utilisateur )
        REFERENCES utilisateur ( id_utilisateur );

ALTER TABLE relation_5
    ADD CONSTRAINT relation_5_lieu_fk FOREIGN KEY ( lieu_id_lieu )
        REFERENCES lieu ( id_lieu );

ALTER TABLE relation_5
    ADD CONSTRAINT relation_5_utilisateur_fk FOREIGN KEY ( utilisateur_id_utilisateur )
        REFERENCES utilisateur ( id_utilisateur );



-- Rapport récapitulatif d'Oracle SQL Developer Data Modeler : 
-- 
-- CREATE TABLE                             5
-- CREATE INDEX                             0
-- ALTER TABLE                              9
-- CREATE VIEW                              0
-- ALTER VIEW                               0
-- CREATE PACKAGE                           0
-- CREATE PACKAGE BODY                      0
-- CREATE PROCEDURE                         0
-- CREATE FUNCTION                          0
-- CREATE TRIGGER                           0
-- ALTER TRIGGER                            0
-- CREATE COLLECTION TYPE                   0
-- CREATE STRUCTURED TYPE                   0
-- CREATE STRUCTURED TYPE BODY              0
-- CREATE CLUSTER                           0
-- CREATE CONTEXT                           0
-- CREATE DATABASE                          0
-- CREATE DIMENSION                         0
-- CREATE DIRECTORY                         0
-- CREATE DISK GROUP                        0
-- CREATE ROLE                              0
-- CREATE ROLLBACK SEGMENT                  0
-- CREATE SEQUENCE                          0
-- CREATE MATERIALIZED VIEW                 0
-- CREATE MATERIALIZED VIEW LOG             0
-- CREATE SYNONYM                           0
-- CREATE TABLESPACE                        0
-- CREATE USER                              0
-- 
-- DROP TABLESPACE                          0
-- DROP DATABASE                            0
-- 
-- REDACTION POLICY                         0
-- 
-- ORDS DROP SCHEMA                         0
-- ORDS ENABLE SCHEMA                       0
-- ORDS ENABLE OBJECT                       0
-- 
-- ERRORS                                   0
-- WARNINGS                                 0
