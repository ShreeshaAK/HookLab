# HookLab 🎬

> A full-stack creator analytics studio for managing YouTube video ideas and A/B testing hook variants to maximize views.

![Python](https://img.shields.io/badge/Python-3.14-blue?logo=python)
![Django](https://img.shields.io/badge/Django-6.0-green?logo=django)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql)
![JWT](https://img.shields.io/badge/Auth-JWT-red)

---

## 📌 What is HookLab?

Content creators live and die by their hooks — the first 3 seconds of a video that decide whether a viewer stays or scrolls. HookLab gives creators a dedicated studio to:

- Organize video ideas through a production pipeline
- Write and store multiple hook variants per video
- Track predicted vs actual view performance
- Identify winning hooks through A/B testing data

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 JWT Authentication | Secure login and signup with token-based auth |
| 📋 Video Pipeline | Track videos from DRAFT → SCRIPTING → READY → PUBLISHED |
| 🪝 Hook Variants | Add multiple hook scripts per video for A/B testing |
| 📊 Performance Chart | Visual bar chart comparing predicted score vs actual views |
| ✏️ Full CRUD | Create, update, delete videos and hooks |
| 👤 Multi-user | Each creator only sees their own videos and data |
| 🛡️ Ownership Checks | Server-side validation prevents users accessing others' data |

---

## 🛠️ Tech Stack

### Backend
- **Django 6.0** — web framework
- **Django REST Framework** — REST API
- **SimpleJWT** — JWT authentication
- **django-cors-headers** — cross-origin request handling
- **MySQL** — production database

### Frontend
- **React 18** — UI framework
- **Axios** — HTTP client
- **Chart.js + react-chartjs-2** — performance charts
- **Tailwind CSS** — styling

---

## 🏗️ Project Structure

```
HookLab/
├── config/                  # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/                    # Main application
│   ├── models.py            # VideoIdea, HookVariant models
│   ├── views.py             # API endpoints
│   ├── urls.py              # URL routing
│   ├── serializers.py       # DRF serializers
│   ├── admin.py             # Django admin config
│   └── tests.py             # Unit tests
├── frontend/                # React application
│   ├── src/
│   │   └── App.jsx          # Main React component
│   └── package.json
├── requirements.txt
└── manage.py
```

---

## 🗄️ Database Schema

```
VideoIdea
├── id              (PK)
├── creator         (FK → User)
├── title           (CharField)
├── description     (TextField)
├── status          (DRAFT | SCRIPTING | READY | PUBLISHED)
└── created_at      (DateTimeField)

HookVariant
├── id              (PK)
├── video           (FK → VideoIdea)
├── hook_text       (CharField)
├── predicted_score (IntegerField, 0-100)
├── actual_views    (IntegerField)
├── is_winner       (BooleanField)
└── created_at      (DateTimeField)
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8.0+

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/hooklab.git
cd hooklab
```

### 2. Set up the backend

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt
```

### 3. Set up MySQL

Open MySQL and run:
```sql
CREATE DATABASE hooklab_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hooklab_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hooklab_db.* TO 'hooklab_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure environment

Update the `DATABASES` block in `config/settings.py` with your MySQL credentials.

### 5. Run migrations and create superuser

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 6. Start the backend server

```bash
python manage.py runserver
# Running at http://127.0.0.1:8000
```

### 7. Set up and start the frontend

```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173
```

### 8. Open the app

Visit `http://localhost:5173` and sign up for an account.

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/token/` | ❌ | Login — returns JWT tokens |
| POST | `/api/signup/` | ❌ | Register new account |
| GET | `/api/dashboard/` | ✅ | Get pipeline + analytics |
| POST | `/api/dashboard/` | ✅ | Create new video idea |
| GET | `/api/video/<id>/performance/` | ✅ | Get hook performance data |
| POST | `/api/video/<id>/add-hook/` | ✅ | Add hook variant to video |
| PATCH | `/api/video/<id>/manage/` | ✅ | Update video status |
| DELETE | `/api/video/<id>/manage/` | ✅ | Delete video |
| PATCH | `/api/hook/<id>/manage/` | ✅ | Update hook views |
| DELETE | `/api/hook/<id>/manage/` | ✅ | Delete hook |

---

## 🧪 Running Tests

```bash
python manage.py test core
```

Tests cover authentication requirements, data ownership isolation, and CRUD operations.

---

## 🔒 Security Features

- All endpoints protected by JWT authentication by default
- Ownership checks on every video and hook — users can only access their own data
- Password hashing handled by Django's built-in `create_user()`
- CORS restricted to trusted frontend origins only

---

## 📸 Screenshots

> Add screenshots of your app here after deployment.
> Tip: Use Windows + Shift + S to take a screenshot, then drag it into this README on GitHub.

---

## 🙋 Author

**Shree** — Built as part of an internship project.

- GitHub: [@yourusername](https://github.com/yourusername)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).