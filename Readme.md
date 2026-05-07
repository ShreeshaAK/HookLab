# HookLab 🎬

A creator analytics studio for managing YouTube video ideas and A/B testing hook variants.

## Tech Stack
- **Backend:** Django, Django REST Framework, JWT Authentication
- **Frontend:** React, Tailwind CSS, Chart.js
- **Database:** MySQL

## Features
- JWT Authentication (Login & Signup)
- Video idea pipeline with status tracking
- Hook variant A/B testing
- Performance analytics chart
- Full CRUD for videos and hooks

## Setup

### Backend
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
npm install
npm run dev
```