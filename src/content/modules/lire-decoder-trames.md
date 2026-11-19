---
title: "Lire et décoder des trames CAN"
parcours: "reseaux-auto"
order: 4
access: "gratuit"
summary: "Du fichier DBC à la valeur physique : ordre des octets, facteur, signaux, pièges courants et temps de bit."
---

**Durée :** environ 18 minutes. **Prérequis :** les trois modules précédents (CAN, LIN, CAN FD).

<iframe src="../../../slides/lire-decoder-trames.html" title="Diaporama : lire et décoder des trames CAN" allowfullscreen style="width:100%;aspect-ratio:16/10;border:1px solid var(--line);border-radius:6px"></iframe>

<p><a href="../../../slides/lire-decoder-trames.html">Ouvrir le diaporama en plein écran</a></p>

**À la fin de ce module, vous saurez :**

- passer d’octets bruts à des valeurs physiques ;
- lire un fichier DBC ;
- distinguer les ordres d’octets Intel et Motorola ;
- repérer les erreurs de décodage les plus fréquentes ;
- comprendre comment se règle le débit d’un contrôleur CAN (temps de bit).

Tous les exemples de ce module sont **fictifs**.

## 1. De l’octet à la valeur physique

Une trame CAN ne contient qu’un identifiant et des octets. Rien n’indique que les deux premiers octets représentent une vitesse. Ce sens est défini par un **fichier de description** (le plus souvent au format **DBC**), qui précise pour chaque message ses signaux, et pour chaque signal comment extraire sa valeur.

Le chemin est toujours le même : **trame brute → extraction du signal (bits) → valeur brute → valeur physique**.

## 2. Anatomie d’un fichier DBC

Voici un extrait fictif :

```
BU_: ECU_A ECU_B

BO_ 672 VehicleSpeed: 2 ECU_A
 SG_ Speed : 0|16@1+ (0.1,0) [0|250] "km/h" ECU_B

BO_ 448 EngineData: 2 ECU_A
 SG_ CoolantTemp : 0|8@1+ (1,-40) [-40|215] "degC" ECU_B
 SG_ Gear : 12|4@1+ (1,0) [0|15] "" ECU_B

VAL_ 448 Gear 0 "Neutre" 1 "Premiere" 2 "Deuxieme" 3 "Troisieme" 15 "Invalide" ;
```

| Élément | Signification |
|---|---|
| `BU_` | Liste des nœuds (calculateurs) du réseau. |
| `BO_ 672 VehicleSpeed: 2 ECU_A` | Un message : identifiant **672** (`0x2A0`), nom, **DLC** de 2 octets, émis par `ECU_A`. |
| `SG_ Speed : 0\|16@1+ ...` | Un signal : **bit de départ** 0, **longueur** 16 bits, **ordre des octets** (`@1` = Intel, `@0` = Motorola), **signe** (`+` non signé, `-` signé). |
| `(0.1,0)` | **Facteur** 0,1 et **décalage** 0. |
| `[0\|250]` | Valeurs physiques minimale et maximale. |
| `"km/h"` | Unité. |
| `ECU_B` | Nœud récepteur. |
| `VAL_` | Table de valeurs : correspondance entre une valeur brute et un état. |

La valeur physique se calcule avec la formule :

```
valeur physique = valeur brute × facteur + décalage
```

## 3. L’ordre des octets : Intel ou Motorola

Quand un signal dépasse un octet, il faut savoir dans quel ordre les octets sont rangés.

| | Intel (`@1`, little-endian) | Motorola (`@0`, big-endian) |
|---|---|---|
| Octet 0 | poids **faible** | poids **fort** |
| Octet 1 | poids **fort** | poids **faible** |
| Valeur 1000 (`0x03E8`) sur 16 bits | `E8 03` | `03 E8` |
| Bit de départ | bit de poids **faible** du signal | bit de poids **fort** du signal |

Dans notre exemple, `Speed` est en Intel, bit de départ 0. La trame `0x2A0`, `E8 03` donne la valeur brute `0x03E8` = 1000, soit **100,0 km/h**.

Le même signal en Motorola serait déclaré `SG_ Speed : 7|16@0+ ...`, avec un bit de départ 7 (le bit de poids fort de l’octet 0), et la trame contiendrait `03 E8`. **Se tromper d’ordre est l’une des erreurs de décodage les plus fréquentes** : les octets `12 34` donnent 13 330 en Intel et 4 660 en Motorola.

## 4. Facteur, décalage et signe

- Le **facteur** et le **décalage** permettent de représenter une grandeur physique avec peu de bits. Par exemple `CoolantTemp` : brut 123 × 1 + (−40) = **83 °C**. Le décalage évite de gaspiller des bits pour les températures négatives.
- Un signal **signé** (`-`) est codé en complément à deux : sur 8 bits, `0xFE` vaut −2.
- Beaucoup de spécifications réservent des valeurs brutes pour signaler un signal **invalide** ou **non disponible** (souvent la valeur maximale, comme `0xFF`). Ce n’est pas une règle du CAN : c’est une convention du constructeur, à lire dans la spécification.

## 5. Signaux non alignés et tables de valeurs

Un signal n’occupe pas forcément un octet entier. Le signal `Gear` fait **4 bits**, avec un bit de départ 12, soit les bits 4 à 7 de l’octet 1.

<div style="overflow-x:auto">
<svg viewBox="0 0 520 110" width="100%" role="img" aria-label="Octet 1 de la trame 0x1C0 : 0x30, dont les bits 7 à 4 forment le signal Gear" style="max-width:520px;height:auto" fill="none" stroke="currentColor" stroke-width="2" font-size="14" font-family="inherit">
<rect x="20" y="40" width="240" height="40" stroke="var(--accent)" stroke-width="3"/>
<rect x="260" y="40" width="240" height="40"/>
<g stroke-width="1.5"><line x1="80" y1="40" x2="80" y2="80"/><line x1="140" y1="40" x2="140" y2="80"/><line x1="200" y1="40" x2="200" y2="80"/><line x1="320" y1="40" x2="320" y2="80"/><line x1="380" y1="40" x2="380" y2="80"/><line x1="440" y1="40" x2="440" y2="80"/></g>
<g fill="currentColor" stroke="none" text-anchor="middle"><text x="50" y="30">7</text><text x="110" y="30">6</text><text x="170" y="30">5</text><text x="230" y="30">4</text><text x="290" y="30">3</text><text x="350" y="30">2</text><text x="410" y="30">1</text><text x="470" y="30">0</text>
<text x="50" y="66">0</text><text x="110" y="66">0</text><text x="170" y="66">1</text><text x="230" y="66">1</text><text x="290" y="66">0</text><text x="350" y="66">0</text><text x="410" y="66">0</text><text x="470" y="66">0</text>
<text x="140" y="102">Gear = 0011 = 3</text><text x="380" y="102">non utilisé</text></g>
</svg>
</div>

Pour extraire le signal, on décale l’octet de 4 bits vers la droite puis on masque : `(octet1 >> 4) & 0xF`. L’octet `0x30` donne `0011` = 3. La table `VAL_` associe ensuite 3 à « Troisieme ».

**Exemple fictif.** La trame `0x1C0`, DLC 2, données `7B 30` :

1. `CoolantTemp` : octet 0 = `0x7B` = 123, 123 − 40 = **83 °C**.
2. `Gear` : `(0x30 >> 4) & 0xF` = 3, soit **Troisieme**.

## 6. Au-delà du CRC : compteurs et sommes de contrôle

Le CRC du CAN détecte les erreurs de transmission, mais il ne détecte pas un calculateur qui se fige et répète le même message. Les constructeurs ajoutent donc souvent, **dans les données**, un **compteur cyclique** (qui s’incrémente à chaque message) et une **somme de contrôle applicative**. L’algorithme est propre au constructeur, ou normalisé (par exemple la protection « E2E » d’AUTOSAR).

Un message est aussi défini par sa **période d’émission** (cycle time), que l’on contrôle pour détecter un message manquant (timeout).

## 7. Les pièges courants

1. **Mauvais ordre des octets** : valeurs absurdes, mais « plausibles ».
2. **Signe oublié** : une température de −2 °C lue comme 254.
3. **Mauvais facteur ou décalage.**
4. **Identifiants étendus :** dans un DBC, l’identifiant d’une trame étendue (29 bits) est signalé en positionnant le **bit 31**. Un identifiant `0x1C0` en trame étendue apparaît donc comme `0x800001C0` = 2 147 484 096.
5. **DLC plus court que prévu :** le DBC décrit plus de bits que la trame n’en contient.
6. **Signaux multiplexés :** un signal « multiplexeur » indique quels autres signaux sont présents dans le message.

## 8. Le temps de bit

Un contrôleur CAN doit être réglé pour produire le bon débit, et pour **échantillonner** chaque bit au bon moment. Le bit est découpé en petites unités appelées **quanta de temps** (tq) :

<div style="overflow-x:auto">
<svg viewBox="0 0 520 110" width="100%" role="img" aria-label="Un bit de 16 quanta de temps : Sync 1, Prop 7, Phase 1 de 5, Phase 2 de 3, avec le point d’échantillonnage entre les phases 1 et 2" style="max-width:520px;height:auto" fill="none" stroke="currentColor" stroke-width="2" font-size="12" font-family="inherit">
<rect x="20" y="40" width="30" height="36"/><rect x="50" y="40" width="210" height="36"/><rect x="260" y="40" width="150" height="36"/><rect x="410" y="40" width="90" height="36"/>
<line x1="410" y1="26" x2="410" y2="90" stroke="var(--accent)" stroke-width="3" stroke-dasharray="5 3"/>
<g fill="currentColor" stroke="none" text-anchor="middle"><text x="35" y="62" font-size="11">Sync</text><text x="155" y="62">Prop_Seg</text><text x="335" y="62">Phase_Seg1</text><text x="455" y="62">Phase_Seg2</text>
<text x="35" y="96">1</text><text x="155" y="96">7</text><text x="335" y="96">5</text><text x="455" y="96">3</text><text x="410" y="18">point d’échantillonnage</text></g>
</svg>
</div>

- **Sync_Seg :** toujours 1 tq, où l’on attend le front de resynchronisation.
- **Prop_Seg :** compense le temps de propagation sur le bus.
- **Phase_Seg1 et Phase_Seg2 :** encadrent le point d’échantillonnage, et peuvent être allongés ou raccourcis pour la resynchronisation (dans la limite du paramètre SJW).
- Le **point d’échantillonnage** se situe entre Phase_Seg1 et Phase_Seg2 : sa position en pourcentage vaut (Sync + Prop + Phase1) / total. On le règle typiquement entre 75 % et 87,5 %.

Le quantum de temps vient de l’horloge du contrôleur :

```
tq = prescaler / fréquence d’horloge
durée d’un bit = nombre de tq × tq
débit = 1 / durée d’un bit
```

**Exemple.** Horloge 80 MHz, prescaler 10 : tq = 125 ns. Avec 16 tq par bit, un bit dure 2 µs, soit **500 kbit/s**. Avec Sync = 1, Prop = 7, Phase1 = 5, Phase2 = 3, le point d’échantillonnage est à (1 + 7 + 5) / 16 = **81,25 %**.

Tous les nœuds d’un bus doivent avoir le même débit et des points d’échantillonnage proches. En CAN FD, le contrôleur reçoit **deux jeux de paramètres** : un pour le débit nominal et un pour la phase de données.

## 9. S’exercer

Avec l’extrait DBC de la section 2, décodez ces trames fictives :

| Identifiant | DLC | Données |
|---|---|---|
| `0x2A0` | 2 | `D0 07` |
| `0x1C0` | 2 | `3C 10` |

<details>
<summary>Voir les réponses</summary>

- `0x2A0`, `D0 07` : Intel, valeur brute `0x07D0` = 2000, soit 2000 × 0,1 = **200,0 km/h**.
- `0x1C0`, `3C 10` : `CoolantTemp` = `0x3C` = 60, soit 60 − 40 = **20 °C**. `Gear` = `(0x10 >> 4) & 0xF` = 1, soit **Premiere**.
</details>

Pour décoder de vraies trames sur votre ordinateur, les bibliothèques Python `cantools` (lecture de fichiers DBC) et `python-can` (accès au bus) sont présentées dans la page Ressources.

## 10. À retenir

1. Une trame ne contient que des octets : c’est le **fichier DBC** qui donne leur sens.
2. Chaque signal est décrit par un **bit de départ**, une **longueur**, un **ordre d’octets**, un **signe**, un **facteur** et un **décalage**.
3. **Intel (`@1`)** et **Motorola (`@0`)** donnent des valeurs différentes pour les mêmes octets.
4. Valeur physique = valeur brute × facteur + décalage.
5. Les identifiants étendus sont signalés par le **bit 31** dans un DBC.
6. Le **temps de bit** combine prescaler, nombre de quanta et point d’échantillonnage (typiquement 75 à 87,5 %).

## 11. Exercices

<details>
<summary>Exercice 1 : un signal de température sur 8 bits (facteur 1, décalage −40) vaut `5A`. Quelle température ?</summary>

`0x5A` = 90. Température = 90 × 1 − 40 = **50 °C**.
</details>

<details>
<summary>Exercice 2 : décodez les octets `12 34` sur 16 bits en Intel, puis en Motorola.</summary>

Intel : l’octet de poids faible vient en premier, donc `0x3412` = **13 330**. Motorola : l’octet de poids fort vient en premier, donc `0x1234` = **4 660**.
</details>

<details>
<summary>Exercice 3 : horloge 40 MHz, prescaler 5, 32 quanta de temps par bit. Quel débit ?</summary>

tq = 5 / 40 MHz = 125 ns. Durée d’un bit = 32 × 125 ns = 4 µs. Débit = 1 / 4 µs = **250 kbit/s**.
</details>

<details>
<summary>Exercice 4 : un DBC contient un message d’identifiant 2 147 484 096. De quelle trame s’agit-il ?</summary>

2 147 484 096 = `0x800001C0`. Le bit 31 est positionné : c’est une trame **étendue** (29 bits), et son identifiant réel est `0x1C0`.
</details>

## Pour aller plus loin

- La page **Ressources** : tutoriels CSS Electronics et Kvaser, `cantools` et `python-can`.
- Parcours suivant dans la progression : **architecture et diagnostic** (UDS, AUTOSAR, ISO 26262).
