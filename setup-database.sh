#!/bin/bash

echo "🗄️ Configuration de la base de données pour BLOCK..."

# Vérifier si les variables d'environnement sont définies
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_HOST" ]; then
    echo "⚠️  Variables d'environnement de base de données non trouvées"
    echo "📋 Veuillez configurer :"
    echo "   - DATABASE_URL ou"
    echo "   - POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB"
    echo ""
    echo "🔧 Ou exécuter manuellement le fichier database_schema.sql dans votre base"
    exit 1
fi

# Si DATABASE_URL est définie, l'utiliser
if [ ! -z "$DATABASE_URL" ]; then
    echo "📡 Utilisation de DATABASE_URL..."
    psql "$DATABASE_URL" -f database_schema.sql
else
    # Sinon utiliser les variables individuelles
    echo "📡 Utilisation des variables individuelles..."
    psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f database_schema.sql
fi

if [ $? -eq 0 ]; then
    echo "✅ Base de données configurée avec succès !"
    echo ""
    echo "📋 Prochaines étapes :"
    echo "1. Redémarrer l'application : npm run dev"
    echo "2. Tester le redimensionnement des images"
    echo "3. Vérifier les logs console pour les messages de dimensions"
else
    echo "❌ Erreur lors de la configuration de la base de données"
    echo "📋 Vérifiez :"
    echo "   - La connexion à la base de données"
    echo "   - Les permissions utilisateur"
    echo "   - L'existence de la base de données"
fi
