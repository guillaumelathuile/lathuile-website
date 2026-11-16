---
title: "Introduction au bus CAN"
parcours: "reseaux-auto"
order: 1
access: "gratuit"
summary: "Principes, couche physique, trame, arbitrage et gestion des erreurs du bus CAN."
---

**Durée :** environ 20 minutes. **Prérequis :** numération binaire et hexadécimale, notion de signal différentiel.

**À la fin de ce module, vous saurez :**

- expliquer pourquoi et comment plusieurs calculateurs partagent un même bus ;
- décrire la couche physique d’un bus CAN haute vitesse (niveaux, terminaison) ;
- lire la structure d’une trame et comprendre l’arbitrage par identifiant ;
- décrire comment le CAN détecte et confine les erreurs ;
- décoder un signal à partir d’une trame brute.

## 1. Pourquoi le CAN existe

Avant le CAN, chaque échange entre deux fonctions d’un véhicule passait par un câble dédié. Avec l’augmentation du nombre de calculateurs (ECU), les faisceaux devenaient lourds, chers et difficiles à fiabiliser.

Le **CAN (Controller Area Network)** a été conçu par Bosch et présenté en 1986. Il a été normalisé par l’ISO (série ISO 11898) et s’est imposé dans l’automobile à partir du début des années 1990. Son idée : **un seul bus, partagé par tous les calculateurs**, robuste face aux perturbations électromagnétiques, avec une gestion des erreurs intégrée.

## 2. Les principes à retenir

- **Multi-maître :** tout nœud peut émettre dès que le bus est libre.
- **Diffusion (broadcast) :** une trame est reçue par tous les nœuds. Chacun décide de la garder ou non selon son identifiant.
- **Orienté message :** l’identifiant décrit le *contenu* du message (par exemple « vitesse véhicule »), pas un destinataire.
- **Priorité par l’identifiant :** plus l’identifiant est petit, plus le message est prioritaire.
- **Détection d’erreurs intégrée :** plusieurs mécanismes complémentaires, et une retransmission automatique.

## 3. La couche physique (ISO 11898-2, haute vitesse)

Le bus est une **paire torsadée différentielle** : deux fils, CAN_H et CAN_L. L’information est portée par la *différence* de tension entre les deux fils, ce qui rend le bus peu sensible aux parasites qui touchent les deux fils de la même manière.

<div style="overflow-x:auto">
<svg viewBox="0 0 700 170" width="100%" role="img" aria-label="Topologie d’un bus CAN : une ligne avec une résistance de 120 ohms à chaque extrémité et trois calculateurs raccordés par de courts embranchements" style="max-width:700px;height:auto" font-family="inherit" font-size="13">
<line x1="60" y1="40" x2="640" y2="40" stroke="currentColor" stroke-width="2"/>
<line x1="60" y1="64" x2="640" y2="64" stroke="currentColor" stroke-width="2"/>
<text x="8" y="44" fill="currentColor">CAN_H</text>
<text x="8" y="68" fill="currentColor">CAN_L</text>
<rect x="640" y="44" width="14" height="16" fill="none" stroke="var(--accent)" stroke-width="2"/>
<text x="618" y="86" fill="currentColor">120 Ω</text>
<rect x="46" y="44" width="14" height="16" fill="none" stroke="var(--accent)" stroke-width="2"/>
<text x="38" y="86" fill="currentColor">120 Ω</text>
<line x1="180" y1="64" x2="180" y2="112" stroke="currentColor" stroke-width="2"/>
<line x1="350" y1="64" x2="350" y2="112" stroke="currentColor" stroke-width="2"/>
<line x1="520" y1="64" x2="520" y2="112" stroke="currentColor" stroke-width="2"/>
<rect x="130" y="112" width="100" height="40" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="300" y="112" width="100" height="40" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="470" y="112" width="100" height="40" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>
<text x="180" y="137" text-anchor="middle" fill="currentColor">ECU A</text>
<text x="350" y="137" text-anchor="middle" fill="currentColor">ECU B</text>
<text x="520" y="137" text-anchor="middle" fill="currentColor">ECU C</text>
</svg>
</div>

### Deux niveaux logiques

| État | Bit | CAN_H | CAN_L | Différence |
|---|---|---|---|---|
| **Récessif** | 1 | ≈ 2,5 V | ≈ 2,5 V | ≈ 0 V |
| **Dominant** | 0 | ≈ 3,5 V | ≈ 1,5 V | ≈ 2 V |

Valeurs nominales. Le point essentiel : **si un nœud impose un bit dominant et un autre un bit récessif en même temps, c’est le dominant qui apparaît sur le bus.** Cette propriété (un « ET câblé ») est ce qui rend l’arbitrage possible.

### Terminaison et topologie

- Une **résistance de 120 Ω** à chacune des deux extrémités du bus, entre CAN_H et CAN_L, pour éviter les réflexions du signal.
- Topologie **linéaire**, avec des dérivations (stubs) les plus courtes possible.
- **Mesure pratique :** bus éteint, on doit lire environ **60 Ω** entre CAN_H et CAN_L (deux résistances de 120 Ω en parallèle).

### Débit et longueur

Le débit maximal du CAN classique est de **1 Mbit/s**. Plus le débit augmente, plus la longueur maximale du bus diminue, car le signal doit se propager et se stabiliser dans la durée d’un bit.

| Débit | Longueur maximale (ordre de grandeur) |
|---|---|
| 1 Mbit/s | ≈ 40 m |
| 500 kbit/s | ≈ 100 m |
| 250 kbit/s | ≈ 250 m |
| 125 kbit/s | ≈ 500 m |

Dans les véhicules, on rencontre surtout **500 kbit/s** (groupe motopropulseur, châssis, diagnostic) et **125 kbit/s** (confort, carrosserie). Tous les nœuds d’un même bus doivent utiliser le même débit.

## 4. La trame de données

Il n’y a pas d’horloge dédiée : les nœuds se resynchronisent sur les fronts du signal. Pour que ces fronts existent régulièrement, le CAN applique le **bit stuffing** : après **5 bits identiques consécutifs**, l’émetteur insère un bit de valeur opposée, que le récepteur retire.

Voici la structure d’une trame de données au **format standard** (identifiant sur 11 bits) :

<div style="overflow-x:auto">
<svg viewBox="0 0 700 100" width="100%" role="img" aria-label="Structure d’une trame CAN : SOF, arbitrage, contrôle, données, CRC, ACK, EOF" style="max-width:700px;height:auto" font-family="inherit" font-size="12">
<rect x="45" y="30" width="50" height="40" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="95" y="30" width="110" height="40" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="205" y="30" width="90" height="40" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="295" y="30" width="140" height="40" fill="none" stroke="var(--accent)" stroke-width="3"/>
<rect x="435" y="30" width="90" height="40" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="525" y="30" width="60" height="40" fill="none" stroke="currentColor" stroke-width="2"/>
<rect x="585" y="30" width="70" height="40" fill="none" stroke="currentColor" stroke-width="2"/>
<g text-anchor="middle" fill="currentColor">
<text x="70" y="55">SOF</text>
<text x="150" y="55">Arbitrage</text>
<text x="250" y="55">Contrôle</text>
<text x="365" y="55">Données</text>
<text x="480" y="55">CRC</text>
<text x="555" y="55">ACK</text>
<text x="620" y="55">EOF</text>
<text x="70" y="88">1 bit</text>
<text x="150" y="88">12 bits</text>
<text x="250" y="88">6 bits</text>
<text x="365" y="88">0 à 64 bits</text>
<text x="480" y="88">16 bits</text>
<text x="555" y="88">2 bits</text>
<text x="620" y="88">7 bits</text>
</g>
</svg>
</div>

| Champ | Taille | Rôle |
|---|---|---|
| **SOF** (Start Of Frame) | 1 bit dominant | Marque le début de la trame et synchronise les nœuds. |
| **Arbitrage** | 11 bits d’identifiant + RTR | L’identifiant donne la priorité du message. Le bit RTR vaut 0 pour une trame de données. |
| **Contrôle** | 6 bits : IDE, bit réservé, **DLC** (4 bits) | Le DLC indique le nombre d’octets de données (0 à 8). |
| **Données** | 0 à 8 octets | Le contenu utile du message. |
| **CRC** | 15 bits + 1 délimiteur | Somme de contrôle pour détecter les erreurs de transmission. |
| **ACK** | 2 bits : créneau + délimiteur | Les récepteurs ayant reçu une trame correcte forcent le créneau à dominant. |
| **EOF** | 7 bits récessifs | Fin de trame. Suivi d’un espace inter-trame de 3 bits. |

Quelques précisions utiles :

- **Format étendu (CAN 2.0B) :** l’identifiant fait 29 bits (11 + 18) au lieu de 11. Il est signalé par le bit IDE. On le retrouve par exemple dans les véhicules lourds (SAE J1939).
- **DLC :** dans le CAN classique, les valeurs 9 à 15 sont acceptées et désignent 8 octets de données.
- **Durée d’une trame :** une trame standard de 8 octets compte 108 bits sans bit stuffing (hors espace inter-trame). À 500 kbit/s, un bit dure 2 µs, soit environ **216 µs**, et un peu plus avec le bit stuffing.
- **Trame de requête (remote frame) :** elle existe dans le CAN classique mais s’utilise très peu, et elle n’existe plus en CAN FD.

## 5. L’arbitrage : qui parle en premier ?

Plusieurs nœuds peuvent commencer à émettre en même temps. Pendant l’envoi de l’identifiant, chaque nœud **écoute le bus en même temps qu’il émet**. S’il envoie un bit récessif (1) mais lit un bit dominant (0), il sait qu’un message plus prioritaire est en cours : il s’arrête et attend que le bus se libère. Le gagnant poursuit sans perte de temps ni corruption des données : l’arbitrage est **non destructif**.

**Exemple.** Le nœud A émet l’identifiant `0x123` et le nœud B l’identifiant `0x1A0` :

| Bit d’identifiant | 10 | 9 | 8 | **7** | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A : `0x123` | 0 | 0 | 1 | **0** | 0 | 1 | 0 | 0 | 0 | 1 | 1 |
| B : `0x1A0` | 0 | 0 | 1 | **1** | 0 | 1 | 0 | 0 | 0 | 0 | 0 |

Les deux identifiants sont identiques jusqu’au bit 8. Au bit 7, A envoie 0 (dominant) et B envoie 1 (récessif). Le bus est dominant, B constate la différence et se retire. **A gagne : l’identifiant le plus petit est le plus prioritaire.** B réémettra automatiquement dès que le bus sera libre.

Conséquence de conception : on attribue les identifiants **bas** aux messages les plus critiques (par exemple freinage, groupe motopropulseur).

## 6. Détection et gestion des erreurs

Le CAN combine **cinq mécanismes** de détection :

| Mécanisme | Ce qu’il détecte |
|---|---|
| **Surveillance des bits** | L’émetteur lit le bus et constate que le bit lu n’est pas celui qu’il a envoyé (hors arbitrage et ACK). |
| **Contrôle du bit stuffing** | Six bits identiques consécutifs dans une zone où le stuffing s’applique. |
| **Contrôle de forme** | Un champ de format fixe (délimiteurs, EOF) contient une valeur incorrecte. |
| **Contrôle de l’ACK** | L’émetteur ne reçoit aucun bit dominant dans le créneau ACK : personne n’a reçu la trame correctement. |
| **Contrôle du CRC** | La somme de contrôle calculée par le récepteur ne correspond pas à celle reçue. |

Dès qu’un nœud détecte une erreur, il émet une **trame d’erreur** (6 bits dominants, qui violent volontairement la règle du bit stuffing, suivis d’un délimiteur de 8 bits récessifs). Tous les nœuds ignorent alors la trame en cours, et l’émetteur la retransmet automatiquement.

Pour qu’un nœud défaillant ne bloque pas le bus, chaque nœud tient deux **compteurs d’erreurs** (émission et réception) et passe par trois états :

| État | Condition | Comportement |
|---|---|---|
| **Error-active** | Compteurs faibles | Fonctionnement normal, signale les erreurs par une trame d’erreur active. |
| **Error-passive** | Un compteur dépasse 127 | Signale les erreurs de façon passive (6 bits récessifs) et attend plus longtemps avant de réémettre. |
| **Bus-off** | Compteur d’émission supérieur à 255 | Le nœud se déconnecte du bus. Il ne peut revenir qu’après une séquence de récupération (128 occurrences de 11 bits récessifs consécutifs). |

## 7. De la trame brute au signal

Une trame ne contient que des octets. C’est un fichier de description, souvent au format **DBC**, qui précise l’identifiant de chaque message, et pour chaque **signal** : sa position de départ, sa longueur en bits, son ordre des octets, un **facteur** et un **décalage** (offset).

La valeur physique se calcule ainsi :

```
valeur physique = valeur brute × facteur + décalage
```

**Exemple fictif.** On reçoit la trame suivante :

| Identifiant | DLC | Données |
|---|---|---|
| `0x2A0` | 2 | `E8 03` |

Le fichier de description indique que ce message contient le signal « vitesse véhicule » : bit de départ 0, longueur 16 bits, ordre « Intel » (poids faible en premier), facteur 0,1, décalage 0.

1. Avec l’ordre Intel, l’octet de poids faible vient en premier : la valeur brute est `0x03E8`.
2. `0x03E8` = 1000 en décimal.
3. Vitesse = 1000 × 0,1 + 0 = **100,0 km/h**.

Dans un fichier DBC, l’ordre des octets est noté `@1` pour Intel (little-endian) et `@0` pour Motorola (big-endian). Se tromper d’ordre est l’une des erreurs de décodage les plus fréquentes.

## 8. Le CAN dans le véhicule

- Un véhicule compte **plusieurs bus CAN** (motopropulseur, châssis, carrosserie, multimédia), reliés par une **passerelle** (gateway) qui filtre et transmet les messages d’un bus à l’autre.
- Le **connecteur de diagnostic OBD-II** expose un bus CAN sur les broches **6 (CAN_H)** et **14 (CAN_L)**. Les services de diagnostic (UDS, vus dans le parcours 4) circulent sur CAN.
- Pour les fonctions simples et peu coûteuses (rétroviseurs, capteurs de pluie), on utilise plutôt le **LIN**, vu dans le prochain module.

### Et le CAN FD ?

Le **CAN FD** (Flexible Data-rate, ISO 11898-1:2015) répond au manque de débit du CAN classique :

| | CAN classique | CAN FD |
|---|---|---|
| Données par trame | 0 à 8 octets | 0 à 64 octets |
| Débit | ≤ 1 Mbit/s | Débit d’arbitrage identique, puis phase de données plus rapide (en pratique de l’ordre de 2 à 5 Mbit/s) |
| CRC | 15 bits | Renforcé (17 ou 21 bits) |
| Trame de requête | Oui | Non |

Les deux protocoles cohabitent sur les véhicules actuels, et le CAN FD se généralise progressivement.

### Une limite à connaître

Le CAN ne prévoit **ni authentification ni chiffrement** : n’importe quel nœud branché sur le bus peut émettre n’importe quel identifiant, et tous les nœuds reçoivent tout. C’est un point central en cybersécurité automobile, que nous aborderons dans le parcours 6.

## 9. À retenir

1. Le CAN est un **bus multi-maître en diffusion**, orienté message : l’identifiant décrit le contenu et la priorité.
2. La couche physique repose sur une **paire différentielle** avec **120 Ω à chaque extrémité** (≈ 60 Ω mesurés bus éteint).
3. Le niveau **dominant (0)** l’emporte sur le niveau **récessif (1)**, ce qui permet l’arbitrage.
4. Une trame classique transporte **au plus 8 octets** ; le CAN FD monte à 64.
5. L’**arbitrage est non destructif** : l’identifiant le plus petit gagne.
6. Cinq mécanismes détectent les erreurs, et les compteurs **confinent** un nœud défaillant (error-passive, puis bus-off).
7. Pour interpréter une trame, il faut un **fichier de description** (DBC) : identifiant, position, longueur, ordre des octets, facteur, décalage.

## 10. Exercices

<details>
<summary>Exercice 1 : deux nœuds émettent en même temps les identifiants 0x100 et 0x200. Lequel gagne l’arbitrage ?</summary>

Le nœud qui émet `0x100`, car son identifiant est le plus petit. En binaire sur 11 bits, `0x100` = `001 0000 0000` et `0x200` = `010 0000 0000` : ils diffèrent au bit 9, où `0x100` envoie 0 (dominant) et `0x200` envoie 1 (récessif).
</details>

<details>
<summary>Exercice 2 : un calculateur doit envoyer 12 octets de données. Est-ce possible en une seule trame CAN classique ?</summary>

Non : une trame CAN classique transporte au maximum 8 octets. Il faut soit découper l’information en plusieurs trames, soit utiliser le CAN FD (jusqu’à 64 octets).
</details>

<details>
<summary>Exercice 3 : bus éteint, on mesure 120 Ω entre CAN_H et CAN_L. Que peut-on en conclure ?</summary>

Une seule des deux terminaisons est présente (ou l’autre est déconnectée ou défaillante). Sur un bus correctement terminé, on attend environ 60 Ω.
</details>

<details>
<summary>Exercice 4 : la trame 0x2A0, DLC 2, données 1B 02 contient la vitesse (16 bits, ordre Intel, facteur 0,1). Quelle est la vitesse ?</summary>

Ordre Intel : valeur brute = `0x021B` = 539. Vitesse = 539 × 0,1 = **53,9 km/h**.
</details>

## Pour aller plus loin

- **ISO 11898-1** (couche liaison de données) et **ISO 11898-2** (couche physique haute vitesse) : les normes de référence, payantes.
- **Spécification CAN 2.0 de Bosch** : le document d’origine, de lecture accessible.
- Prochain module : le **bus LIN**.
