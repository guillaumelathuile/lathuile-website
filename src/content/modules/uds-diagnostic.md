---
title: "Le diagnostic UDS"
parcours: "architecture-diagnostic"
order: 1
access: "gratuit"
summary: "Le protocole de diagnostic des calculateurs : modèle client/serveur, services, sessions, accès sécurisé et codes de réponse."
---

**Durée :** environ 20 minutes. **Prérequis :** les modules du parcours Réseaux automobiles.

<iframe src="../../../slides/uds-diagnostic.html" title="Diaporama : le diagnostic UDS" allowfullscreen style="width:100%;aspect-ratio:16/10;border:1px solid var(--line);border-radius:6px"></iframe>

<p><a href="../../../slides/uds-diagnostic.html">Ouvrir le diaporama en plein écran</a></p>

**À la fin de ce module, vous saurez :**

- expliquer à quoi sert le diagnostic et situer l’UDS parmi les normes ;
- décrire le modèle client/serveur et la structure d’un message UDS ;
- lire une requête, une réponse positive et une réponse négative ;
- citer les services principaux et leur rôle ;
- expliquer le rôle des sessions et du principe seed/key.

Tous les exemples de ce module sont **fictifs**, mais construits avec les valeurs normalisées.

## 1. À quoi sert le diagnostic

Un calculateur ne sert pas seulement à commander une fonction : il doit aussi pouvoir être **interrogé, configuré et mis à jour**. Le diagnostic intervient :

- **en atelier :** lire les codes défaut, effacer une panne, réinitialiser un calculateur ;
- **en production :** écrire des identifiants et des configurations, vérifier un calculateur en fin de ligne ;
- **en développement et en validation :** lire des variables internes, déclencher des routines de test ;
- **pour la mise à jour logicielle :** reprogrammer la mémoire d’un calculateur.

Trois sigles reviennent souvent :

- **OBD-II :** le diagnostic embarqué réglementaire, lié aux émissions polluantes. Il fait l’objet du prochain module.
- **UDS** (*Unified Diagnostic Services*, norme **ISO 14229**) : un protocole de diagnostic bien plus large, utilisé par les constructeurs et leurs fournisseurs.
- **ISO-TP** (norme ISO 15765-2) : la couche qui transporte les messages de diagnostic sur un bus CAN. Elle fait aussi l’objet du module suivant.

## 2. Le modèle client/serveur

L’UDS fonctionne sur le principe **requête/réponse** :

- le **client** est le **testeur** (un outil de diagnostic ou un logiciel) ;
- le **serveur** est le **calculateur** interrogé.

<div style="overflow-x:auto">
<svg viewBox="0 0 640 140" width="100%" role="img" aria-label="Un testeur envoie une requête à un calculateur, qui renvoie une réponse" style="max-width:640px;height:auto" fill="none" stroke="currentColor" stroke-width="2" font-size="13" font-family="inherit">
<rect x="20" y="30" width="150" height="80" rx="4"/><rect x="470" y="30" width="150" height="80" rx="4" stroke="var(--accent)" stroke-width="3"/>
<path d="M176 55 H464 M456 49 L464 55 L456 61"/><path d="M464 90 H176 M184 84 L176 90 L184 96"/>
<g fill="currentColor" stroke="none" text-anchor="middle"><text x="95" y="65">Testeur</text><text x="95" y="85" font-size="11">(client)</text><text x="545" y="65">Calculateur</text><text x="545" y="85" font-size="11">(serveur)</text>
<text x="320" y="46">Requête</text><text x="320" y="116">Réponse</text></g>
</svg>
</div>

Le serveur ne parle jamais de sa propre initiative : il répond à ce que le client demande.

## 3. Structure d’un message

Un message UDS commence par un **identifiant de service** (SID), sur un octet. Selon le service, il est suivi d’une **sous-fonction** et de **données**.

| Message | Format |
|---|---|
| **Requête** | `SID` · (sous-fonction) · données |
| **Réponse positive** | `SID + 0x40` · (sous-fonction) · données |
| **Réponse négative** | `0x7F` · `SID` · `NRC` (code de réponse négative) |

Quelques remarques :

- La réponse positive reprend le SID de la requête **augmenté de `0x40`** : `0x22` devient `0x62`, `0x10` devient `0x50`.
- Le **bit 7 de la sous-fonction** a un rôle particulier : à 1, il demande au serveur de **ne pas envoyer de réponse positive**. Par exemple, `3E 00` et `3E 80` sont deux requêtes `TesterPresent` : la seconde n’attend aucune réponse.
- En cas d’échec, le serveur répond `7F`, rappelle le service refusé, puis donne la **raison** (le NRC).

### Exemple : lire le numéro de châssis

Le service `0x22` (*ReadDataByIdentifier*) lit une donnée désignée par un identifiant sur deux octets. L’identifiant `0xF190` est défini par la norme pour le numéro de châssis (VIN).

| Sens | Message | Lecture |
|---|---|---|
| Requête | `22 F1 90` | Lire la donnée `0xF190`. |
| Réponse positive | `62 F1 90 41 42 43 44 45 46 47 48 31 32 33 34 35 36 37 38 39` | `0x62` = `0x22` + `0x40`, l’identifiant rappelé, puis 17 octets ASCII : « ABCDEFGH123456789 » (numéro fictif). |
| Si la donnée n’existe pas (`22 F1 91`) | `7F 22 31` | Service `0x22` refusé, NRC `0x31` : requête hors plage. |

La réponse positive compte 20 octets : elle ne tient pas dans une trame CAN de 8 octets. C’est le rôle d’**ISO-TP**, prochain module, de la découper.

## 4. Les services principaux

| SID | Service | Rôle |
|---|---|---|
| `0x10` | DiagnosticSessionControl | Changer de session de diagnostic. |
| `0x11` | ECUReset | Réinitialiser le calculateur (par exemple `11 01`, réinitialisation matérielle). |
| `0x14` | ClearDiagnosticInformation | Effacer les codes défaut. |
| `0x19` | ReadDTCInformation | Lire les codes défaut. |
| `0x22` | ReadDataByIdentifier | Lire une donnée. |
| `0x27` | SecurityAccess | Débloquer des fonctions protégées. |
| `0x28` | CommunicationControl | Activer ou couper des communications du calculateur. |
| `0x2E` | WriteDataByIdentifier | Écrire une donnée. |
| `0x31` | RoutineControl | Démarrer, arrêter ou consulter une routine. |
| `0x34` `0x36` `0x37` | RequestDownload, TransferData, RequestTransferExit | Transférer un logiciel vers le calculateur (reprogrammation). |
| `0x3E` | TesterPresent | Signaler que le testeur est toujours là. |
| `0x85` | ControlDTCSetting | Activer ou suspendre l’enregistrement des codes défaut. |

Tous les services ne sont pas disponibles dans toutes les situations : un calculateur n’implémente que ceux qui lui sont utiles, et certains exigent une session ou un déblocage particulier.

## 5. Les sessions de diagnostic

Un calculateur se trouve toujours dans une **session** qui détermine les services autorisés. Le service `0x10` permet d’en changer :

| Sous-fonction | Session | Usage |
|---|---|---|
| `0x01` | Par défaut | État initial : services de base (lecture de données, par exemple). |
| `0x02` | Programmation | Reprogrammation du logiciel. |
| `0x03` | Étendue | Services avancés de diagnostic et de configuration. |

<div style="overflow-x:auto">
<svg viewBox="0 0 640 150" width="100%" role="img" aria-label="Sessions de diagnostic : par défaut, étendue, programmation, et retour à la session par défaut après expiration du minuteur" style="max-width:640px;height:auto" fill="none" stroke="currentColor" stroke-width="2" font-size="13" font-family="inherit">
<rect x="20" y="30" width="150" height="50" rx="4"/><rect x="245" y="30" width="150" height="50" rx="4" stroke="var(--accent)" stroke-width="3"/><rect x="470" y="30" width="150" height="50" rx="4"/>
<path d="M174 50 H241 M233 44 L241 50 L233 56"/><path d="M399 50 H466 M458 44 L466 50 L458 56"/>
<path d="M545 84 V120 H95 V84"/><path d="M89 92 L95 84 L101 92"/>
<g fill="currentColor" stroke="none" text-anchor="middle"><text x="95" y="60">Par défaut</text><text x="320" y="60">Étendue</text><text x="545" y="60">Programmation</text>
<text x="207" y="40" font-size="12">10 03</text><text x="432" y="40" font-size="12">10 02</text><text x="320" y="140" font-size="12">minuteur S3 expiré, ou 10 01</text></g>
</svg>
</div>

La réponse positive à `10 03` ressemble à `50 03 00 32 01 F4` : `0x50` = `0x10` + `0x40`, la session `0x03`, puis deux délais d’attente du serveur. Ici `0x0032` = 50 ms et `0x01F4` = 500 unités de 10 ms, soit 5 s (ce sont les valeurs usuelles).

Une session non par défaut ne dure pas indéfiniment : si le calculateur ne reçoit aucune requête pendant un certain temps (le minuteur **S3**, typiquement de l’ordre de 5 s), il **retourne à la session par défaut**. Pour la maintenir ouverte, le testeur envoie régulièrement `TesterPresent` (`3E 00`, ou `3E 80` sans réponse attendue).

## 6. L’accès sécurisé

Certaines fonctions sensibles (écriture de configuration, reprogrammation) sont protégées. Le service `0x27` (*SecurityAccess*) fonctionne selon un principe **seed/key** :

<div style="overflow-x:auto">
<svg viewBox="0 0 640 160" width="100%" role="img" aria-label="Le testeur demande une graine, le calculateur la fournit, le testeur renvoie une clé calculée, le calculateur accepte" style="max-width:640px;height:auto" fill="none" stroke="currentColor" stroke-width="2" font-size="12" font-family="inherit">
<line x1="110" y1="30" x2="110" y2="150"/><line x1="530" y1="30" x2="530" y2="150"/>
<path d="M114 55 H526 M518 49 L526 55 L518 61"/><path d="M526 85 H114 M122 79 L114 85 L122 91"/><path d="M114 115 H526 M518 109 L526 115 L518 121"/><path d="M526 140 H114 M122 134 L114 140 L122 146"/>
<g fill="currentColor" stroke="none" text-anchor="middle"><text x="110" y="20" font-size="13">Testeur</text><text x="530" y="20" font-size="13">Calculateur</text>
<text x="320" y="50">27 01 : demande d’une graine (seed)</text><text x="320" y="80">67 01 + graine</text><text x="320" y="110">27 02 + clé calculée à partir de la graine</text><text x="320" y="135">67 02 : accès accordé</text></g>
</svg>
</div>

1. Le testeur demande une **graine** (`27 01`, sous-fonction impaire).
2. Le calculateur répond par une valeur de graine (`67 01` + graine).
3. Le testeur calcule une **clé** à partir de cette graine, avec un algorithme connu seulement du constructeur et du calculateur, et l’envoie (`27 02` + clé, sous-fonction paire).
4. Si la clé est correcte, l’accès est accordé (`67 02`). Sinon, le calculateur refuse (NRC `0x35`) et limite le nombre d’essais.

L’intérêt : la clé change à chaque graine, donc enregistrer et rejouer un échange ne suffit pas. Ce module décrit seulement le principe ; la qualité réelle de cette protection dépend de l’algorithme, de l’aléa des graines et de la gestion des essais, un sujet que nous retrouverons dans le parcours consacré à la cybersécurité.

## 7. Les codes de réponse négative courants

| NRC | Nom | Signification |
|---|---|---|
| `0x10` | generalReject | Refus sans autre précision. |
| `0x11` | serviceNotSupported | Service inconnu du calculateur. |
| `0x12` | subFunctionNotSupported | Sous-fonction inconnue. |
| `0x13` | incorrectMessageLengthOrInvalidFormat | Longueur ou format de message incorrect. |
| `0x22` | conditionsNotCorrect | Conditions non remplies (par exemple véhicule en mouvement). |
| `0x24` | requestSequenceError | Requêtes dans le mauvais ordre. |
| `0x31` | requestOutOfRange | Valeur ou identifiant hors plage. |
| `0x33` | securityAccessDenied | Accès sécurisé requis et non obtenu. |
| `0x35` | invalidKey | Clé incorrecte. |
| `0x7E` | subFunctionNotSupportedInActiveSession | Sous-fonction non disponible dans la session en cours. |
| `0x7F` | serviceNotSupportedInActiveSession | Service non disponible dans la session en cours. |
| `0x78` | requestCorrectlyReceived-ResponsePending | Requête reçue, réponse à venir. |

Le code `0x78` mérite une attention particulière : il ne signale pas une erreur. Le calculateur indique qu’il a bien reçu la requête, mais qu’il lui faut plus de temps (par exemple pour effacer une mémoire). Le testeur attend alors, et le calculateur enverra la vraie réponse plus tard.

## 8. Les codes défaut (DTC)

Un **DTC** (*Diagnostic Trouble Code*) est un code qui désigne une panne détectée par le calculateur. En UDS, il occupe **3 octets**, auquel s’ajoute un **octet d’état** qui précise sa situation. Quelques bits de cet octet :

| Bit | Nom | Signification |
|---|---|---|
| 0 | testFailed | Le test est en échec en ce moment. |
| 2 | pendingDTC | Le défaut est apparu sur le cycle en cours ou le précédent. |
| 3 | confirmedDTC | Le défaut est confirmé. |
| 7 | warningIndicatorRequested | Le voyant d’alerte est demandé. |

Le service `0x19` (*ReadDTCInformation*) les lit, par exemple avec la sous-fonction `0x02` (par masque d’état). Le service `0x14` (*ClearDiagnosticInformation*) les efface : `14 FF FF FF` demande l’effacement de tous les codes défaut.

## 9. À retenir

1. L’UDS suit un modèle **client/serveur** : le testeur interroge, le calculateur répond.
2. Un message commence par un **SID** ; la réponse positive vaut **SID + 0x40**, la négative `7F` · SID · NRC.
3. Le **bit 7 de la sous-fonction** permet de supprimer la réponse positive.
4. Les **sessions** (par défaut, étendue, programmation) déterminent les services autorisés ; **TesterPresent** les maintient.
5. L’**accès sécurisé** repose sur un échange graine/clé.
6. Le **NRC `0x78`** signifie « réponse à venir », pas « erreur ».
7. Un **DTC** tient sur 3 octets, avec un octet d’état.

## 10. Exercices

<details>
<summary>Exercice 1 : le calculateur répond `7F 27 35`. Que s’est-il passé ?</summary>

`7F` indique une réponse négative au service `0x27` (accès sécurisé), avec le code `0x35` : **clé incorrecte** (*invalidKey*). Le testeur a envoyé une clé qui ne correspond pas à la graine reçue.
</details>

<details>
<summary>Exercice 2 : quelle est la réponse positive attendue à la requête `10 03` ?</summary>

La réponse commence par `0x50` (soit `0x10` + `0x40`), suivi de la session `0x03`, puis de quatre octets de paramètres de temps : par exemple `50 03 00 32 01 F4`.
</details>

<details>
<summary>Exercice 3 : à quoi sert la requête `3E 80` ?</summary>

C’est un `TesterPresent` (`0x3E`) dont le **bit 7** de la sous-fonction est à 1 : le calculateur ne répond pas. Elle sert à maintenir la session ouverte (elle remet à zéro le minuteur S3) sans charger le bus avec des réponses.
</details>

<details>
<summary>Exercice 4 : un octet d’état de DTC vaut `0x09`. Que signifie-t-il ?</summary>

`0x09` = `0000 1001` : les bits 0 et 3 sont à 1. Le test est **en échec** (*testFailed*) et le défaut est **confirmé** (*confirmedDTC*).
</details>

## Pour aller plus loin

- **ISO 14229-1** : la norme qui définit les services UDS (payante).
- Prochain module : le **transport ISO-TP** et l’adressage sur CAN, qui explique comment un message comme celui de la lecture du numéro de châssis traverse le bus.
