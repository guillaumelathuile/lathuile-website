---
title: "Le CAN FD"
parcours: "reseaux-auto"
order: 3
access: "gratuit"
summary: "Plus de données par trame et un débit plus élevé : ce que le CAN FD change par rapport au CAN classique."
---

**Durée :** environ 12 minutes. **Prérequis :** le module d’introduction au bus CAN.

<iframe src="../../../slides/can-fd.html" title="Diaporama : le CAN FD" allowfullscreen style="width:100%;aspect-ratio:16/10;border:1px solid var(--line);border-radius:6px"></iframe>

<p><a href="../../../slides/can-fd.html">Ouvrir le diaporama en plein écran</a></p>

**À la fin de ce module, vous saurez :**

- expliquer pourquoi le CAN classique atteint ses limites ;
- décrire les deux nouveautés du CAN FD : plus de données et deux débits ;
- lire la structure d’une trame FD et décoder son DLC ;
- dire dans quels cas un nœud CAN classique peut cohabiter avec le CAN FD.

## 1. Les limites du CAN classique

Le CAN classique est robuste, mais il a deux limites que les besoins actuels rendent gênantes :

- **8 octets de données par trame au maximum.** Pour envoyer plus, il faut découper l’information en plusieurs trames, et chacune traîne son propre en-tête et son CRC.
- **1 Mbit/s au maximum**, et en pratique souvent 500 kbit/s en véhicule.

Or les volumes de données augmentent : mises à jour logicielles des calculateurs, capteurs plus riches, passerelles qui relaient beaucoup de messages. Le **CAN FD** (Flexible Data-rate) a été présenté par Bosch en 2012 et repris dans la norme **ISO 11898-1:2015**. Il garde le principe du CAN (arbitrage par identifiant, détection d’erreurs) et corrige ces deux limites.

## 2. Les deux idées clés

1. **Jusqu’à 64 octets de données par trame**, au lieu de 8.
2. **Un débit plus élevé pendant la phase de données** : la trame passe à une vitesse supérieure, puis revient au débit initial.

## 3. Le format de trame

La trame FD ressemble à la trame classique, avec quelques bits en plus (ou en moins) dans les champs d’arbitrage et de contrôle :

<div style="overflow-x:auto">
<svg viewBox="0 0 690 130" width="100%" role="img" aria-label="Trame CAN FD : arbitrage au débit nominal, phase de données au débit élevé, fin de trame au débit nominal" style="max-width:690px;height:auto" fill="none" stroke="currentColor" stroke-width="2" font-size="12" font-family="inherit">
<rect x="10" y="50" width="150" height="40"/><rect x="160" y="50" width="100" height="40" stroke="var(--accent)" stroke-width="3"/><rect x="260" y="50" width="80" height="40"/><rect x="340" y="50" width="160" height="40"/><rect x="500" y="50" width="80" height="40"/><rect x="580" y="50" width="100" height="40"/>
<line x1="10" y1="38" x2="260" y2="38"/><line x1="260" y1="38" x2="580" y2="38" stroke="var(--accent)" stroke-width="3"/><line x1="580" y1="38" x2="680" y2="38"/>
<g fill="currentColor" stroke="none" text-anchor="middle"><text x="135" y="30">Débit nominal</text><text x="420" y="30">Phase de données (débit élevé)</text><text x="630" y="30">Nominal</text>
<text x="85" y="75">SOF · ID · RRS · IDE</text><text x="210" y="75">FDF · res · BRS</text><text x="300" y="75">ESI · DLC</text><text x="420" y="75">Données</text><text x="540" y="75">CRC</text><text x="630" y="75">ACK · EOF</text>
<text x="420" y="112">0 à 64 octets</text><text x="540" y="112">17 ou 21 bits</text></g>
</svg>
</div>

| Bit ou champ | Rôle |
|---|---|
| **FDF** (FD Format) | Récessif : la trame est au format FD. Dominant : trame CAN classique. |
| **BRS** (Bit Rate Switch) | Récessif : la phase de données se fait à un débit plus élevé. Dominant : pas de changement de débit. |
| **ESI** (Error State Indicator) | Indique l’état d’erreur de l’émetteur : dominant s’il est *error-active*, récessif s’il est *error-passive*. |
| **RRS** | Remplace le bit RTR : toujours dominant, car **la trame de requête n’existe plus** en CAN FD. |
| **DLC** | Longueur des données, avec un codage étendu (voir ci-dessous). |

### Le codage du DLC

Jusqu’à 8, le DLC est égal au nombre d’octets. Au-delà, les valeurs 9 à 15 désignent des tailles prédéfinies :

| DLC | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|
| Octets | 12 | 16 | 20 | 24 | 32 | 48 | 64 |

Il n’y a pas de taille intermédiaire : pour envoyer 30 octets, on utilise une trame de 32 octets, et l’émetteur complète avec du remplissage.

## 4. Deux débits dans une même trame

- **Phase d’arbitrage (débit nominal).** L’identifiant est envoyé au débit nominal, par exemple 500 kbit/s. Il doit être le même pour tous les nœuds : c’est pendant l’arbitrage que tous les nœuds doivent voir le même bit au même moment.
- **Phase de données (débit élevé).** À partir du bit BRS, si celui-ci est récessif, la trame passe à un débit plus rapide, par exemple 2 Mbit/s. Il n’y a alors qu’un seul émetteur, ce qui permet d’aller plus vite.
- **Retour au débit nominal** à la fin du champ CRC, pour l’acquittement et la fin de trame.

Les débits de la phase de données courants dans les véhicules vont de l’ordre de 2 à 5 Mbit/s. La limite théorique de la spécification est plus haute, mais elle dépend de la qualité du signal et des transceivers.

## 5. Le CRC renforcé

Une trame plus longue risque davantage d’être corrompue. Le CAN FD adopte donc un CRC plus long :

- **17 bits** pour 16 octets de données ou moins ;
- **21 bits** pour plus de 16 octets.

Le champ CRC utilise aussi des bits de bourrage *fixes* à des positions déterminées, et il est précédé d’un compteur de bits de bourrage, qui renforce la détection d’erreurs.

## 6. Contraintes physiques

Passer plus vite impose des contraintes sur le câblage et les composants :

- des **transceivers adaptés** aux débits de la phase de données ;
- une **topologie plus soignée** (terminaison, longueur des dérivations), car les réflexions sont plus gênantes à haut débit ;
- une **compensation du délai de l’émetteur**, un mécanisme intégré aux contrôleurs FD pour échantillonner correctement les bits à haut débit. Nous n’entrons pas dans son détail ici.

## 7. Compatibilité et cohabitation

- Un **contrôleur CAN FD** sait envoyer et recevoir des trames FD *et* des trames classiques.
- Un **contrôleur CAN classique** ne comprend pas les trames FD : en les voyant, il signale des erreurs. Certains contrôleurs récents, dits « tolérants au FD » (mode d’exception de protocole), ignorent simplement ces trames.
- Conséquence : **tous les nœuds d’un même bus doivent être FD, ou tolérants au FD**, dès que des trames FD y circulent. Dans un véhicule, on garde donc souvent des bus classiques et des bus FD séparés, reliés par des passerelles.

## 8. Ce que ça change en pratique

**Exemple chiffré** (simplifié, sans bit stuffing, sans espace inter-trame, sans les bits de bourrage fixes du CRC) : transmettre **64 octets** sur un bus au débit nominal de 500 kbit/s.

| | CAN classique | CAN FD (nominal 500 kbit/s, données 2 Mbit/s) |
|---|---|---|
| Trames nécessaires | 8 trames de 8 octets | 1 trame de 64 octets |
| Bits au débit nominal | 8 × 108 = 864 bits | environ 27 bits |
| Bits au débit élevé | aucun | environ 538 bits |
| Durée | 864 × 2 µs ≈ **1,73 ms** | 27 × 2 µs + 538 × 0,5 µs ≈ **0,32 ms** |

Dans cet exemple simplifié, le CAN FD transmet plus de **5 fois plus vite**. Le gain ne vaut pas 4 fois le rapport des débits, parce que l’en-tête et la fin de trame restent au débit nominal.

Usages typiques : **reprogrammation des calculateurs**, **passerelles** qui relaient de gros volumes, échanges de données de capteurs plus riches. Le CAN FD n’est pas le dernier mot : le **CAN XL** vise encore plus de données et de débit, et l’**Ethernet automobile** s’impose pour les très gros volumes.

## 9. À retenir

1. Le CAN FD garde l’**arbitrage et la détection d’erreurs** du CAN, et lève deux limites : la taille des données et le débit.
2. Jusqu’à **64 octets** par trame, avec un DLC étendu (9 à 15 → 12, 16, 20, 24, 32, 48, 64).
3. **Deux débits** : arbitrage au débit nominal, données au débit élevé si **BRS** est récessif.
4. La trame de requête n’existe plus, et le **CRC** passe à 17 ou 21 bits.
5. Un nœud **classique** ne supporte pas les trames FD (sauf contrôleur tolérant) : il faut un bus homogène.
6. Le gain réel dépend de la part de la trame transmise au débit élevé.

## 10. Exercices

<details>
<summary>Exercice 1 : que signifie un DLC de 13 dans une trame CAN FD ?</summary>

13 correspond à **32 octets** de données (9 → 12, 10 → 16, 11 → 20, 12 → 24, 13 → 32, 14 → 48, 15 → 64).
</details>

<details>
<summary>Exercice 2 : combien de trames faut-il pour envoyer 48 octets en CAN classique ? en CAN FD ?</summary>

En CAN classique : 48 / 8 = **6 trames**. En CAN FD : **une seule** trame, avec un DLC de 14 (48 octets).
</details>

<details>
<summary>Exercice 3 : un calculateur CAN classique reste branché sur un bus où circulent maintenant des trames FD. Que se passe-t-il ?</summary>

Il ne sait pas interpréter ces trames et signale des erreurs, ce qui perturbe le bus (sauf s’il s’agit d’un contrôleur tolérant au FD, qui les ignore). Il faut le remplacer par un nœud FD ou tolérant, ou le placer sur un bus classique séparé, relié par une passerelle.
</details>

<details>
<summary>Exercice 4 : pourquoi l’arbitrage se fait-il au débit nominal, et pas au débit élevé ?</summary>

Pendant l’arbitrage, plusieurs nœuds émettent en même temps et doivent tous voir le même bit au même instant pour savoir s’ils ont perdu : il faut un débit assez lent pour tenir compte des délais de propagation. Pendant la phase de données, un seul nœud émet, donc on peut aller plus vite.
</details>

## Pour aller plus loin

- **ISO 11898-1:2015** : la norme qui intègre le CAN FD (payante).
- **Spécification CAN FD de Bosch** : le document d’origine (version 1.0, 2012).
- Prochain module : **lire et décoder des trames** (fichier DBC, débits, temps de bit).
