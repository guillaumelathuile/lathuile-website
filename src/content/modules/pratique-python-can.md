---
title: "Pratique : décoder des trames avec Python"
parcours: "reseaux-auto"
order: 5
access: "gratuit"
summary: "Lire un fichier DBC, encoder et décoder des messages, simuler un bus et rejouer un enregistrement, sans aucun matériel."
---

**Durée :** environ 25 minutes. **Prérequis :** le module précédent (lire et décoder des trames CAN) et des notions de base en Python. **Aucun matériel nécessaire.**

<iframe src="../../../slides/pratique-python-can.html" title="Diaporama : décoder des trames avec Python" allowfullscreen style="width:100%;aspect-ratio:16/10;border:1px solid var(--line);border-radius:6px"></iframe>

<p><a href="../../../slides/pratique-python-can.html">Ouvrir le diaporama en plein écran</a></p>

**À la fin de ce module, vous saurez :**

- installer et utiliser `cantools` et `python-can` ;
- décoder et encoder des messages à partir d’un fichier DBC ;
- simuler un bus CAN virtuel entre un émetteur et un récepteur ;
- rejouer un enregistrement de trames ;
- vérifier vous-même l’écart entre les ordres d’octets Intel et Motorola.

Les fichiers DBC et les trames de ce module sont **fictifs**. Les résultats affichés ont été obtenus avec Python 3, `python-can` 4.6.1 et `cantools` 45.2.0.

## 1. Installation

Dans un terminal, créez un dossier de travail et un environnement virtuel, puis installez les deux bibliothèques :

```
mkdir pratique-can && cd pratique-can
python3 -m venv venv
source venv/bin/activate
pip install python-can cantools
```

Sous Windows, l’activation se fait avec `venv\Scripts\activate`.

- **`cantools`** lit les fichiers DBC, et encode et décode les messages.
- **`python-can`** envoie et reçoit des trames, sur un vrai bus ou sur un bus virtuel.

## 2. Le fichier DBC fictif

Créez un fichier `exemple.dbc` avec le contenu suivant (il reprend celui du module précédent, avec un message supplémentaire en Motorola) :

```
VERSION ""

NS_ :

BS_:

BU_: ECU_A ECU_B

BO_ 672 VehicleSpeed: 2 ECU_A
 SG_ Speed : 0|16@1+ (0.1,0) [0|250] "km/h" ECU_B

BO_ 448 EngineData: 2 ECU_A
 SG_ CoolantTemp : 0|8@1+ (1,-40) [-40|215] "degC" ECU_B
 SG_ Gear : 12|4@1+ (1,0) [0|15] "" ECU_B

BO_ 1024 SpeedMotorola: 2 ECU_A
 SG_ SpeedM : 7|16@0+ (0.1,0) [0|250] "km/h" ECU_B

VAL_ 448 Gear 0 "Neutre" 1 "Premiere" 2 "Deuxieme" 3 "Troisieme" 15 "Invalide" ;
```

Les premières lignes (`VERSION`, `NS_`, `BS_`) sont l’en-tête obligatoire d’un fichier DBC. Les identifiants sont écrits en décimal : 672 = `0x2A0`, 448 = `0x1C0`, 1024 = `0x400`.

## 3. Décoder et encoder à la main

Créez `decode.py` :

```python
import cantools

db = cantools.database.load_file("exemple.dbc")

# Décoder : identifiant + octets -> signaux
print(db.decode_message(0x2A0, bytes([0xE8, 0x03])))
print(db.decode_message(0x1C0, bytes([0x7B, 0x30])))
print(db.decode_message(0x1C0, bytes([0x7B, 0x30]), decode_choices=False))

# Encoder : signaux -> octets
data = db.encode_message("VehicleSpeed", {"Speed": 100.0})
print(data.hex(" "))

# Intel contre Motorola : même valeur, octets différents
print(db.encode_message("VehicleSpeed", {"Speed": 100.0}).hex(" "))
print(db.encode_message("SpeedMotorola", {"SpeedM": 100.0}).hex(" "))
```

Lancez-le avec `python decode.py`. Vous obtenez :

```
{'Speed': 100.0}
{'CoolantTemp': 83, 'Gear': 'Troisieme'}
{'CoolantTemp': 83, 'Gear': 3}
e8 03
e8 03
03 e8
```

On retrouve tout ce que nous avons calculé à la main au module précédent :

- `E8 03` en Intel donne **100,0 km/h** ;
- `7B 30` donne **83 °C** et le rapport **Troisieme** (ou la valeur brute 3 avec `decode_choices=False`) ;
- la même vitesse de 100 km/h s’encode `e8 03` en Intel et `03 e8` en Motorola.

## 4. Un bus virtuel

`python-can` propose une interface **virtuelle** : deux accès au même canal échangent des trames, sans matériel. C’est idéal pour s’exercer. Créez `bus_virtuel.py` :

```python
import can
import cantools

db = cantools.database.load_file("exemple.dbc")

# Deux accès au même bus virtuel : un émetteur, un récepteur
emetteur = can.Bus(interface="virtual", channel="demo")
recepteur = can.Bus(interface="virtual", channel="demo")

for vitesse, temp in [(100.0, 83), (120.5, 85), (30.0, 20)]:
    data = db.encode_message("VehicleSpeed", {"Speed": vitesse})
    emetteur.send(can.Message(arbitration_id=0x2A0, data=data, is_extended_id=False))
    data = db.encode_message("EngineData", {"CoolantTemp": temp, "Gear": 3})
    emetteur.send(can.Message(arbitration_id=0x1C0, data=data, is_extended_id=False))

while (msg := recepteur.recv(timeout=0.5)) is not None:
    signaux = db.decode_message(msg.arbitration_id, msg.data)
    print(f"0x{msg.arbitration_id:03X} {msg.data.hex(' ')} -> {signaux}")

emetteur.shutdown()
recepteur.shutdown()
```

Résultat :

```
0x2A0 e8 03 -> {'Speed': 100.0}
0x1C0 7b 30 -> {'CoolantTemp': 83, 'Gear': 'Troisieme'}
0x2A0 b5 04 -> {'Speed': 120.5}
0x1C0 7d 30 -> {'CoolantTemp': 85, 'Gear': 'Troisieme'}
0x2A0 2c 01 -> {'Speed': 30.0}
0x1C0 3c 30 -> {'CoolantTemp': 20, 'Gear': 'Troisieme'}
```

Vérifions une trame à la main : 120,5 km/h correspond à la valeur brute 120,5 / 0,1 = 1205 = `0x04B5`, rangée en Intel : `b5 04`. C’est bien ce que le bus transporte.

Si vous utilisez une version plus ancienne de `python-can`, le paramètre `interface` peut s’appeler `bustype` : consultez la documentation de votre version.

## 5. Rejouer un enregistrement

Les outils d’analyse enregistrent les trames dans des fichiers. `python-can` sait lire plusieurs formats, dont celui de l’outil `candump` de Linux. Créez `trace.log` :

```
(1700000000.000000) vcan0 2A0#E803
(1700000000.010000) vcan0 1C0#7B30
(1700000000.100000) vcan0 2A0#D007
(1700000000.110000) vcan0 1C0#3C10
```

Chaque ligne contient l’horodatage, l’interface, puis `identifiant#données`. Créez `rejouer.py` :

```python
import can
import cantools

db = cantools.database.load_file("exemple.dbc")

for msg in can.LogReader("trace.log"):
    signaux = db.decode_message(msg.arbitration_id, msg.data)
    print(f"{msg.timestamp:.2f} 0x{msg.arbitration_id:03X} -> {signaux}")
```

Résultat :

```
1700000000.00 0x2A0 -> {'Speed': 100.0}
1700000000.01 0x1C0 -> {'CoolantTemp': 83, 'Gear': 'Troisieme'}
1700000000.10 0x2A0 -> {'Speed': 200.0}
1700000000.11 0x1C0 -> {'CoolantTemp': 20, 'Gear': 'Premiere'}
```

Ce sont exactement les réponses de l’exercice du module précédent (200,0 km/h, 20 °C et le rapport Premiere).

## 6. Et avec du vrai matériel ?

Pour se connecter à un vrai bus, `python-can` prend en charge de nombreuses interfaces (adaptateurs USB-CAN, SocketCAN sous Linux, interfaces de fabricants). On remplace simplement `interface="virtual"` par celle de son matériel. Sous Linux, un bus virtuel existe aussi au niveau du système (`vcan`).

Quelques précautions importantes :

- **Écoutez avant d’émettre.** Sur un vrai véhicule ou un vrai calculateur, n’envoyez jamais de trames sans savoir précisément ce qu’elles provoquent.
- **Ne branchez rien sur un véhicule roulant**, ni sur un système lié à la sécurité.
- **Entraînez-vous sur un banc d’essai** ou sur un bus virtuel, et respectez les règles de votre entreprise ou de votre école.

## 7. À retenir

1. `cantools` encode et décode à partir d’un fichier **DBC** ; `python-can` envoie et reçoit des trames.
2. Le bus **virtuel** permet de s’exercer sans matériel.
3. `decode_message` renvoie les signaux physiques, et `encode_message` produit les octets.
4. Un même signal donne des octets différents en **Intel** et en **Motorola**.
5. Un fichier d’enregistrement se **rejoue** avec `LogReader`, et se décode de la même façon.
6. Sur du vrai matériel : écouter d’abord, n’émettre que sur un banc.

## 8. Exercices

<details>
<summary>Exercice 1 : ajoutez au DBC un message `EngineSpeed` (identifiant 688, DLC 2) avec un signal `Rpm` de 16 bits en Intel, facteur 0,25. Quels octets pour 3 000 tr/min ?</summary>

À ajouter à la fin du DBC :

```
BO_ 688 EngineSpeed: 2 ECU_A
 SG_ Rpm : 0|16@1+ (0.25,0) [0|8000] "rpm" ECU_B
```

Valeur brute : 3000 / 0,25 = 12 000 = `0x2EE0`. En Intel : `e0 2e`. C’est aussi ce que renvoie `db.encode_message("EngineSpeed", {"Rpm": 3000}).hex(" ")`.
</details>

<details>
<summary>Exercice 2 : que donne le décodage de `E8 03` avec le message `SpeedMotorola` ? et celui de `03 E8` ?</summary>

Le signal est en Motorola : `E8 03` donne `0xE803` = 59 395, soit **5 939,5 km/h**, une valeur absurde. `03 E8` donne `0x03E8` = 1000, soit **100,0 km/h**. Avec le mauvais ordre d’octets, on obtient une valeur « plausible » pour le programme, mais fausse.
</details>

<details>
<summary>Exercice 3 : que se passe-t-il si l’on encode une vitesse de 300 km/h avec le DBC ci-dessus ?</summary>

`cantools` lève une erreur d’encodage, car 300 dépasse le maximum de 250 déclaré dans le DBC (`[0|250]`) : « Expected signal "Speed" value smaller than or equal to 250 ». Les bornes du DBC servent donc aussi de garde-fou à l’encodage. Notez qu’elles ne sont **pas** vérifiées au décodage, comme le montre l’exercice 2.
</details>

<details>
<summary>Exercice 4 : écrivez un script qui lit `trace.log` et affiche uniquement les trames d’identifiant `0x2A0`.</summary>

```python
import can
import cantools

db = cantools.database.load_file("exemple.dbc")

for msg in can.LogReader("trace.log"):
    if msg.arbitration_id == 0x2A0:
        print(db.decode_message(msg.arbitration_id, msg.data))
```
</details>

## Pour aller plus loin

- La documentation de **python-can** et de **cantools**, dans la page Ressources.
- Prochaine étape dans la progression : le parcours **architecture et diagnostic** (UDS, AUTOSAR, ISO 26262).
