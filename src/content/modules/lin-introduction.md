---
title: "Le bus LIN"
parcours: "reseaux-auto"
order: 2
access: "gratuit"
summary: "Architecture maître/esclave, trame, identifiants, table d’ordonnancement et comparaison avec le CAN."
---

**Durée :** environ 15 minutes. **Prérequis :** le module précédent (introduction au bus CAN).

<iframe src="../../../slides/lin-introduction.html" title="Diaporama : le bus LIN" allowfullscreen style="width:100%;aspect-ratio:16/10;border:1px solid var(--line);border-radius:6px"></iframe>

<p><a href="../../../slides/lin-introduction.html">Ouvrir le diaporama en plein écran</a></p>

**À la fin de ce module, vous saurez :**

- expliquer à quoi sert le LIN et pourquoi il complète le CAN ;
- décrire son architecture maître/esclave ;
- lire la structure d’une trame et calculer un identifiant protégé ;
- comprendre le rôle de la table d’ordonnancement ;
- comparer le LIN et le CAN.

## 1. Pourquoi le LIN existe

Le CAN est robuste, mais il a un coût : un contrôleur, un transceiver, une paire de fils et, pour chaque nœud, une horloge précise. Pour des fonctions simples (commander un rétroviseur, lire un capteur de pluie, orienter un volet de climatisation, piloter un lève-vitre), c’est disproportionné.

Le **LIN (Local Interconnect Network)** a été défini par un consortium de constructeurs et d’équipementiers, puis normalisé (spécifications LIN 2.x, puis **ISO 17987**). Son objectif : un réseau **le moins cher possible** pour les sous-systèmes à faible débit, en complément du CAN.

## 2. Architecture : un maître, des esclaves

- Un **maître** et plusieurs **esclaves** (16 nœuds au plus : 1 maître + 15 esclaves).
- Les esclaves **ne parlent jamais de leur propre initiative** : c’est le maître qui interroge.
- Le maître est en général un calculateur qui est aussi **nœud d’un bus CAN**. Il joue le rôle de passerelle entre le réseau principal et le sous-réseau LIN.

<div style="overflow-x:auto">
<svg viewBox="0 0 600 200" width="100%" role="img" aria-label="Un bus CAN, un calculateur maître LIN, et trois esclaves sur un bus LIN" style="max-width:600px;height:auto" fill="none" stroke="currentColor" stroke-width="2" font-size="13" font-family="inherit">
<line x1="60" y1="25" x2="560" y2="25" stroke="var(--accent)" stroke-width="3"/>
<line x1="300" y1="25" x2="300" y2="62"/>
<rect x="215" y="62" width="170" height="38" rx="4"/>
<line x1="300" y1="100" x2="300" y2="135"/>
<line x1="90" y1="135" x2="510" y2="135"/>
<line x1="130" y1="135" x2="130" y2="160"/><line x1="300" y1="135" x2="300" y2="160"/><line x1="470" y1="135" x2="470" y2="160"/>
<rect x="85" y="160" width="90" height="30" rx="4"/><rect x="255" y="160" width="90" height="30" rx="4"/><rect x="425" y="160" width="90" height="30" rx="4"/>
<g fill="currentColor" stroke="none"><text x="8" y="29">Bus CAN</text><text x="300" y="85" text-anchor="middle">Maître LIN</text><text x="515" y="128">Bus LIN</text>
<text x="130" y="180" text-anchor="middle">Esclave</text><text x="300" y="180" text-anchor="middle">Esclave</text><text x="470" y="180" text-anchor="middle">Esclave</text></g>
</svg>
</div>

## 3. La couche physique

- **Un seul fil**, référencé à la tension batterie (nominalement 12 V) et à la masse du véhicule.
- **Récessif :** niveau haut, proche de la tension batterie. **Dominant :** niveau bas, proche de la masse.
- **Débit :** jusqu’à **20 kbit/s** (valeurs courantes : 9,6 et 19,2 kbit/s). Longueur maximale du bus : environ 40 m.
- **Terminaison :** une résistance de rappel côté maître (de l’ordre de 1 kΩ, avec une diode) et une plus forte côté esclave (de l’ordre de 30 kΩ).
- Les esclaves peuvent se **resynchroniser sur chaque trame** grâce à l’octet de synchronisation : ils n’ont donc pas besoin d’un quartz précis, ce qui réduit leur coût.

## 4. La trame

Une trame LIN se compose d’un **en-tête**, toujours émis par le maître, et d’une **réponse**, émise par le maître ou par un esclave.

<div style="overflow-x:auto">
<svg viewBox="0 0 640 110" width="100%" role="img" aria-label="Structure d’une trame LIN : Break, Sync, PID, données, somme de contrôle" style="max-width:640px;height:auto" fill="none" stroke="currentColor" stroke-width="2" font-size="12" font-family="inherit">
<rect x="10" y="40" width="130" height="36"/><rect x="140" y="40" width="90" height="36"/><rect x="230" y="40" width="90" height="36"/><rect x="320" y="40" width="170" height="36" stroke="var(--accent)" stroke-width="3"/><rect x="490" y="40" width="140" height="36"/>
<line x1="10" y1="30" x2="320" y2="30"/><line x1="320" y1="30" x2="630" y2="30"/>
<g fill="currentColor" stroke="none" text-anchor="middle"><text x="165" y="22">En-tête (maître)</text><text x="475" y="22">Réponse (maître ou esclave)</text>
<text x="75" y="62">Break</text><text x="185" y="62">Sync</text><text x="275" y="62">PID</text><text x="405" y="62">Données</text><text x="560" y="62">Checksum</text>
<text x="75" y="95">13 + 1 bits</text><text x="185" y="95">0x55</text><text x="275" y="95">ID + parité</text><text x="405" y="95">1 à 8 octets</text><text x="560" y="95">1 octet</text></g>
</svg>
</div>

| Champ | Rôle |
|---|---|
| **Break** | Au moins 13 bits dominants (suivis d’un délimiteur récessif) : signale le début d’une trame, et ne peut pas être confondu avec un octet normal. |
| **Sync** | Octet `0x55` (alternance de 0 et de 1) : les esclaves s’en servent pour régler leur débit. |
| **PID** (identifiant protégé) | L’identifiant sur 6 bits, plus 2 bits de parité. Il désigne la trame, et donc **qui** doit répondre et avec quelles données. |
| **Données** | 1 à 8 octets. |
| **Checksum** | Somme de contrôle sur 8 bits. |

Chaque octet est envoyé au format **UART** : 1 bit de départ, 8 bits de données (poids faible en premier), 1 bit d’arrêt. C’est ce qui permet d’utiliser un simple UART comme contrôleur LIN.

### Le calcul du PID

Les bits de parité se calculent à partir des bits ID0 à ID5 de l’identifiant :

```
P0 = ID0 ⊕ ID1 ⊕ ID2 ⊕ ID4
P1 = NON (ID1 ⊕ ID3 ⊕ ID4 ⊕ ID5)
PID = P1 P0 ID5 ID4 ID3 ID2 ID1 ID0
```

Exemple pour l’identifiant `0x10` (ID4 = 1, les autres bits à 0) : P0 = 1, P1 = NON(1) = 0. Le PID vaut donc `0101 0000` = **`0x50`**.

## 5. Identifiants et types de trames

| Identifiant | Usage |
|---|---|
| `0x00` à `0x3B` (0 à 59) | Trames portant des signaux |
| `0x3C` (60) | Diagnostic : requête du maître |
| `0x3D` (61) | Diagnostic : réponse d’un esclave |
| `0x3E` et `0x3F` (62 et 63) | Définition utilisateur et réservé |

Les principaux types de trames :

- **Inconditionnelle :** envoyée à chaque fois qu’elle apparaît dans la table d’ordonnancement. C’est le cas le plus courant.
- **Sur événement :** le maître interroge, avec un seul identifiant, plusieurs esclaves qui ne répondent que s’ils ont une information à signaler. Si deux répondent en même temps, il y a collision, et le maître la résout en passant à une table dédiée.
- **Sporadique :** émise par le maître uniquement quand il a quelque chose à envoyer, dans un créneau réservé.
- **Diagnostic :** trames `0x3C` et `0x3D`, qui servent à la configuration et au diagnostic des esclaves.

## 6. La table d’ordonnancement

Le maître suit une **table d’ordonnancement** (schedule table) : une liste de trames, chacune avec la durée de son créneau.

<div style="overflow-x:auto">
<svg viewBox="0 0 640 120" width="100%" role="img" aria-label="Table d’ordonnancement : trois créneaux successifs répétés en boucle" style="max-width:640px;height:auto" fill="none" stroke="currentColor" stroke-width="2" font-size="13" font-family="inherit">
<rect x="20" y="25" width="180" height="40"/><rect x="200" y="25" width="180" height="40"/><rect x="380" y="25" width="180" height="40"/>
<path d="M560 45 H600 V95 H20 V70" stroke="var(--accent)" stroke-width="2.5"/>
<path d="M14 76 L20 66 L26 76" stroke="var(--accent)" stroke-width="2.5"/>
<g fill="currentColor" stroke="none" text-anchor="middle"><text x="110" y="50">Trame 0x10 · 10 ms</text><text x="290" y="50">Trame 0x11 · 10 ms</text><text x="470" y="50">Trame 0x12 · 10 ms</text><text x="310" y="112">Le cycle se répète</text></g>
</svg>
</div>

Conséquences importantes :

- **Pas d’arbitrage et pas de collision** : un seul nœud émet la réponse associée à un identifiant.
- **Comportement déterministe** : on connaît à l’avance la période de chaque trame.
- Le **créneau** d’une trame doit être plus long que sa durée nominale. La spécification prévoit une durée nominale de **34 bits d’en-tête + 10 × (N + 1) bits de réponse** (N octets de données), et autorise jusqu’à **1,4 fois** cette durée.

Exemple : une trame de 8 octets à 19,2 kbit/s dure 34 + 90 = **124 bits**, soit ≈ **6,46 ms**. Le créneau doit donc faire au moins **9,04 ms** (1,4 × 6,46 ms).

## 7. Somme de contrôle et gestion des erreurs

- **Checksum classique :** calculé sur les octets de données seuls. Il est utilisé par les trames de diagnostic et par les anciens esclaves (LIN 1.x).
- **Checksum amélioré :** calculé sur les données **et** le PID (LIN 2.x). Il permet de détecter une erreur sur l’identifiant.

Le LIN **n’a pas de trame d’erreur** comme le CAN. Les erreurs possibles (erreur de bit, de checksum, de parité de l’identifiant, absence de réponse) sont détectées par les nœuds et signalées par un signal d’état que l’esclave publie dans l’une de ses réponses. C’est un mécanisme plus simple, et moins robuste, que celui du CAN.

## 8. Veille et réveil

Le maître peut commander la mise en veille du sous-réseau par une trame de diagnostic (identifiant `0x3C`, premier octet à `0x00`). Les esclaves s’endorment aussi après une période d’inactivité du bus de l’ordre de quelques secondes. Un nœud peut réveiller le bus en imposant un niveau dominant de 250 µs à 5 ms, après quoi le maître reprend la table d’ordonnancement.

## 9. LIN contre CAN

| | LIN | CAN |
|---|---|---|
| Support | 1 fil | Paire différentielle |
| Débit maximal | 20 kbit/s | 1 Mbit/s (CAN FD plus rapide) |
| Accès au bus | Un maître, des esclaves, table d’ordonnancement | Multi-maître, arbitrage par identifiant |
| Données par trame | 1 à 8 octets | 0 à 8 octets (64 en CAN FD) |
| Détection d’erreurs | Parité, checksum | CRC, ACK, surveillance des bits, confinement |
| Coût par nœud | Faible | Plus élevé |
| Usages typiques | Confort, carrosserie, capteurs simples | Motopropulseur, châssis, diagnostic |

Le LIN **ne remplace pas** le CAN : il en est le complément pour les fonctions peu critiques et peu gourmandes en débit.

## 10. À retenir

1. Le LIN est un réseau **bas coût**, à **un fil**, pour les fonctions simples.
2. Architecture **maître/esclaves** : les esclaves ne parlent que lorsque le maître les interroge.
3. Une trame = **en-tête** (Break, Sync `0x55`, PID) émis par le maître + **réponse** (1 à 8 octets, checksum).
4. Le **PID** protège l’identifiant par deux bits de parité.
5. La **table d’ordonnancement** rend le bus déterministe, sans arbitrage.
6. Checksum **classique** (données) ou **amélioré** (données et PID).
7. Le LIN complète le CAN : le maître LIN est souvent un nœud CAN qui sert de passerelle.

## 11. Exercices

<details>
<summary>Exercice 1 : combien de temps dure une trame LIN de 2 octets de données à 19,2 kbit/s (durée nominale) ?</summary>

Bits : 34 (en-tête) + 10 × (2 + 1) = 64 bits. Durée d’un bit : 1 / 19 200 ≈ 52,1 µs. Durée nominale : 64 × 52,1 µs ≈ **3,33 ms**. Le créneau doit faire au moins 1,4 × 3,33 ms ≈ 4,67 ms.
</details>

<details>
<summary>Exercice 2 : calculez le PID de l’identifiant 0x3C.</summary>

`0x3C` = `11 1100` : ID5 = 1, ID4 = 1, ID3 = 1, ID2 = 1, ID1 = 0, ID0 = 0. P0 = ID0 ⊕ ID1 ⊕ ID2 ⊕ ID4 = 0 ⊕ 0 ⊕ 1 ⊕ 1 = 0. P1 = NON(ID1 ⊕ ID3 ⊕ ID4 ⊕ ID5) = NON(0 ⊕ 1 ⊕ 1 ⊕ 1) = NON(1) = 0. PID = `0011 1100` = **`0x3C`**.
</details>

<details>
<summary>Exercice 3 : pourquoi n’y a-t-il pas d’arbitrage en LIN ?</summary>

Parce que le maître émet chaque en-tête selon la table d’ordonnancement, et qu’un seul nœud est désigné pour répondre à chaque identifiant. Il n’y a donc jamais deux nœuds qui prennent la parole en même temps, sauf pour les trames sur événement, dont les collisions sont gérées par le maître.
</details>

<details>
<summary>Exercice 4 : un capteur de pluie et un calculateur de freinage doivent communiquer. Quel bus pour chacun ?</summary>

Le capteur de pluie convient très bien au LIN : peu de données, faible débit, fonction peu critique, coût réduit. Le calculateur de freinage relève du CAN (ou CAN FD) : échanges rapides, déterminisme par priorité, détection d’erreurs et confinement robustes, et fonction critique pour la sécurité.
</details>

## Pour aller plus loin

- **ISO 17987** : la norme de référence du LIN (payante), qui reprend les spécifications LIN 2.x.
- Le **fichier LDF** (LIN Description File) décrit un réseau LIN, comme le DBC pour le CAN. Nous le retrouverons dans le parcours consacré aux outils.
- Prochain module : le **CAN FD**.
