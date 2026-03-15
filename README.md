# Delta Security — Système de gestion des services

Plateforme interne luxe noir/or pour la gestion des prises de service, fins de service et calcul automatique des salaires hebdomadaires.

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Vue 3 + Vite + Pinia + Vue Router |
| Style | Tailwind CSS + CSS vars (design system or/noir) |
| Base de données | Supabase (PostgreSQL + Auth + Realtime) |
| Déploiement | Vercel |
| Polices | Cormorant Garamond + Outfit |

---

## 1. Cloner & installer

```bash
git clone https://github.com/VOTRE_USERNAME/delta-security.git
cd delta-security
npm install
```

---

## 2. Configurer Supabase

### 2.1 Créer le projet Supabase

1. Aller sur [supabase.com](https://supabase.com) → New project
2. Choisir un nom, mot de passe DB fort, région proche

### 2.2 Exécuter le schéma SQL

Dans l'éditeur SQL de Supabase (Dashboard → SQL Editor) :

```sql
-- Copier-coller le contenu de supabase/schema.sql
```

Ou via la CLI :
```bash
npx supabase db push --db-url YOUR_DB_URL < supabase/schema.sql
```

### 2.3 Variables d'environnement

```bash
cp .env.example .env
```

Remplir `.env` avec les valeurs de votre projet Supabase (Settings → API) :

```env
VITE_SUPABASE_URL=https://XXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.4 Désactiver la confirmation d'email (optionnel pour dev)

Supabase Dashboard → Authentication → Settings → **Disable email confirmations**

---

## 3. Lancer en développement

```bash
npm run dev
```

Ouvrir http://localhost:5173

---

## 4. Déployer sur Vercel

### Option A — Via GitHub (recommandé)

1. Pusher sur GitHub :
```bash
git add .
git commit -m "feat: initial Delta Security"
git push origin main
```

2. Aller sur [vercel.com](https://vercel.com) → Import Git Repository
3. Sélectionner le repo `delta-security`
4. Framework Preset : **Vite**
5. **Environment Variables** → Ajouter :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy ✓

### Option B — Via CLI

```bash
npm install -g vercel
vercel --prod
```

---

## 5. Fonctionnalités

### Vue Agent
- ✅ Prise de service avec label de mission
- ✅ Fin de service
- ✅ Chronomètre en temps réel
- ✅ Historique de ses propres services
- ✅ Statistiques mensuelles et hebdomadaires

### Vue Patron
- ✅ Prise/fin de service (patron aussi)
- ✅ Vue temps réel de tous les services actifs
- ✅ Historique complet avec filtres
- ✅ Onglet Salaires : calcul automatique hebdomadaire
- ✅ Navigation semaine par semaine
- ✅ Modification du taux horaire par agent
- ✅ Vue équipe avec statut en temps réel

---

## 6. Calcul du salaire

> **Formule : `⌊ minutes ÷ 10 ⌋ × (taux_horaire ÷ 6)`**

- Le salaire est calculé par **tranches de 10 minutes**
- Exemple : 95 minutes travaillées à 15$/h
  - 9 tranches × (15 ÷ 6) = 9 × 2.50$ = **22.50$**
- Les salaires sont **hebdomadaires** (lundi → dimanche)

---

## 7. Rôles

| Rôle | Accès |
|------|-------|
| `agent` | Prise/fin de service · Ses propres données |
| `patron` | Tout voir · Modifier les taux · Voir les salaires |

---

## 8. Structure du projet

```
delta-security/
├── src/
│   ├── views/
│   │   ├── LoginView.vue      # Auth (login + register)
│   │   ├── AgentView.vue      # Dashboard agent
│   │   └── PatronView.vue     # Dashboard patron
│   ├── components/
│   │   ├── NavBar.vue         # Navigation persistante
│   │   ├── ServiceCard.vue    # Carte d'un service
│   │   └── SalaryTable.vue    # Tableau salaires hebdo
│   ├── stores/
│   │   ├── auth.js            # Auth + profil (Pinia)
│   │   └── services.js        # Services + calcul salaires
│   ├── router/index.js        # Routes + guards
│   ├── lib/supabase.js        # Client Supabase
│   ├── style.css              # Design system global
│   └── main.js
├── supabase/
│   └── schema.sql             # Schéma complet DB
├── vercel.json                # Config déploiement
├── .env.example
└── README.md
```

---

## 9. Prochaines fonctionnalités (roadmap)

- [ ] Export PDF des fiches de salaire
- [ ] Notifications push (nouveau service)
- [ ] Gestion des congés / absences
- [ ] Dashboard analytique avec graphiques
- [ ] Application mobile (Capacitor)
