# Gemini CLI dans Docker


Une façon pratique et isolée d'exécuter le [Gemini CLI](https://github.com/google-gemini/gemini-cli) sans avoir à installer Node.js ou ses dépendances sur votre système local. Ce dépôt fournit des images Docker mises à jour automatiquement.

![GitHub](https://img.shields.io/github/license/pi-2r/gemini-cli-docker-plus)
![Docker Stars](https://img.shields.io/docker/stars/ptherrode/gemini-cli)
![Docker Pulls](https://img.shields.io/docker/pulls/ptherrode/gemini-cli)
![GitHub Release Date](https://img.shields.io/github/release-date/pi-2r/gemini-cli-docker-plus)

_[Read this in English](README.en.md)_

## Prérequis

* [Docker](https://docs.docker.com/get-docker/) doit être installé et en cours d'exécution sur votre système.

## Utilisation

### Configuration Recommandée

La méthode recommandée pour utiliser cette image est de créer une fonction shell qui gère tous les points de montage et les permissions nécessaires. Ajoutez la fonction suivante à votre `~/.bash_aliases`, `~/.zshrc` ou équivalent :

```bash
function gemini {
    local tty_args=""
    if [ -t 0 ]; then
        tty_args="--tty"
    fi

    docker run -i ${tty_args} --rm \
        -v "$(pwd):/home/gemini/workspace" \
        -v "$HOME/.gemini:/home/gemini/.gemini" \
        -e DEFAULT_UID=$(id -u) \
        -e DEFAULT_GID=$(id -g) \
        ptherrode/gemini-cli "$@"
}
```

Cette configuration :
- Monte votre répertoire courant en tant que `/home/gemini/workspace` dans le conteneur.
- Monte `~/.gemini` pour préserver la configuration du CLI Gemini entre les exécutions.
- Correspond aux permissions de l'utilisateur du conteneur avec votre utilisateur local pour éviter les problèmes de propriété de fichiers.
- Gère correctement le TTY pour l'utilisation interactive.

#### Notes Spécifiques par Plateforme

**Linux :**
- Fonctionne immédiatement avec la configuration ci-dessus.
- Les permissions de fichiers sont gérées automatiquement via le mapping UID/GID.

**macOS :**
- La configuration fonctionne de la même manière.
- Les permissions de fichiers peuvent se comporter différemment en raison de la gestion des montages par Docker Desktop sur macOS.
- Si vous rencontrez des problèmes de permission, vous devrez peut-être ajouter `:delegated` aux montages de volume pour de meilleures performances.

**Problème `adduser: unknown group gemini`** :
- **L'explication** : Sur macOS, votre identifiant de groupe (GID) est souvent 20 (le groupe "staff"). Le script à l'intérieur du conteneur Docker (qui tourne sous Linux) essaie de créer un groupe nommé gemini avec cet ID 20. Or, dans Linux, l'ID 20 est souvent déjà pris par un groupe système (comme dialout). Le script échoue donc car il ne peut pas créer le groupe.
- **La solution** : Sur macOS, grâce à la façon dont Docker gère les fichiers, nous n'avons pas vraiment besoin que l'ID corresponde exactement. Nous allons "mentir" au conteneur en lui donnant un ID standard (1000) pour qu'il soit content.
    - Modifiez votre fonction dans `.bashrc` ou `.zshrc` : Remplacez la ligne `-e DEFAULT_GID=$(id -g)` par `-e DEFAULT_GID=1000`.

**Windows (PowerShell) :**
Ajoutez cette fonction à votre profil PowerShell (généralement `$PROFILE`) :

```powershell
function gemini {
    $ttyArgs = ""
    if ([System.Console]::IsInputRedirected -eq $false) {
        $ttyArgs = "--tty"
    }

    $workDir = Get-Location
    docker run -i $ttyArgs --rm `
        -v "${workDir}:/home/gemini/workspace" `
        -v "${HOME}/.gemini:/home/gemini/.gemini" `
        ptherrode/gemini-cli $args
}
```

### Utilisation Docker Basique

Bien que non recommandé, vous pouvez toujours exécuter le conteneur directement avec les commandes Docker :

```bash
docker run --rm -it \
    -v "$(pwd):/home/gemini/workspace" \
    -v "$HOME/.gemini:/home/gemini/.gemini" \
    -e DEFAULT_UID=$(id -u) \
    -e DEFAULT_GID=$(id -g) \
    ptherrode/gemini-cli [commande]
```

### Exemples

**En utilisant la fonction shell (recommandé) :**
```bash
# Obtenir de l'aide
gemini --help

# Traiter un fichier local
gemini votre-fichier-prompt.txt

# Passer un fichier comme contexte via pipe
cat doc.md | gemini -p "Corrige la grammaire"

# Utiliser le mode interactif
gemini
```

## Tags Supportés

Les tags suivants sont disponibles sur [Docker Hub](https://hub.docker.com/r/ptherrode/gemini-cli):

*   [`latest`](https://hub.docker.com/repository/docker/ptherrode/gemini-cli/tags) : La version la plus récente et stable du CLI Gemini.

## Sécurité

Les images sont automatiquement scannées pour les vulnérabilités. Vous pouvez consulter le dernier rapport de sécurité [ici](https://github.com/pi-2r/gemini-cli-docker-plus/security/advisories).

### Recommandations de sécurité au runtime (ANSSI)

Pour renforcer la sécurité lors de l'exécution, vous pouvez utiliser les options suivantes :
*   `--read-only` : Monte le système de fichiers du conteneur en lecture seule.
*   `--cap-drop=ALL` : Supprime toutes les capacités Linux (le conteneur n'en a pas besoin).
*   `--security-opt=no-new-privileges` : Empêche l'escalade de privilèges.

Exemple sécurisé :
```bash
docker run --rm -it --read-only --cap-drop=ALL --security-opt=no-new-privileges \
    -v "$(pwd):/home/gemini/workspace" \
    -v "$HOME/.gemini:/home/gemini/.gemini" \
    -e DEFAULT_UID=$(id -u) \
    -e DEFAULT_GID=$(id -g) \
    --tmpfs /tmp --tmpfs /run --tmpfs /home/gemini \
    pi-2r/gemini-cli
```

## Tailles d'image
![Docker Image Size](https://img.shields.io/docker/image-size/ptherrode/gemini-cli?arch=amd64&label=ptherrode%2Fgemini-cli%20(amd64))
![Docker Image Size](https://img.shields.io/docker/image-size/ptherrode/gemini-cli?arch=arm64&label=ptherrode%2Fgemini-cli%20(arm64))
![Docker Image Size](https://img.shields.io/docker/image-size/ptherrode/gemini-cli?arch=arm&label=ptherrode%2Fgemini-cli%20(arm))

## Images
Vous pouvez récupérer l'image docker depuis :
* [ptherrode/gemini-cli](https://hub.docker.com/r/ptherrode/gemini-cli)
