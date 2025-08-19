# 📧 LEM - Luxembourg Email Manager

Script simple pour extraire les contacts professionnels et générer les patterns d'emails.

## 🚀 Installation

```bash
# Installer les dépendances Python
pip install -r requirements.txt
```

## 📊 Utilisation

### 1. Test rapide
```bash
python test_extraction.py
```

### 2. Extraction complète
```bash
python extract_contacts.py
```

## 📁 Fichiers générés

- `contacts_professionnels_luxembourg.xlsx` - Fichier Excel avec tous les contacts
- `email_patterns.json` - Patterns d'emails par entreprise

## 📧 Patterns d'emails générés

Le script génère automatiquement les patterns suivants :

1. **prenom.nom@domaine.com** (le plus courant)
2. **prenom_nom@domaine.com**
3. **prenomnom@domaine.com**
4. **nom.prenom@domaine.com**
5. **prenom[0].nom@domaine.com** (initiales)
6. **nom[0].prenom@domaine.com**

## 📈 Exemples d'emails générés

- **Stéphane Demeure** (ING Luxembourg) → `stephane.demeure@ingjobs.lu`
- **Philippe Mathieu** (ArcelorMittal) → `philippe.mathieu@arcelormittal.com`
- **François Barret** (SOGELIFE) → `francois.barret@sogelife.com`

## 🔧 Personnalisation

Vous pouvez modifier le fichier `extract_contacts.py` pour :
- Ajouter de nouveaux contacts
- Modifier les patterns d'emails
- Changer les règles de normalisation

## 📊 Statistiques

Le script affiche automatiquement :
- Nombre total de contacts
- Nombre d'emails générés avec succès
- Patterns les plus utilisés
- Domaines uniques trouvés

## 🎯 Prochaines étapes

1. **Validation des emails** - Vérifier que les emails générés sont valides
2. **Enrichissement** - Ajouter plus de contacts et entreprises
3. **Intégration** - Connecter à un CRM ou base de données 