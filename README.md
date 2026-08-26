# Full-Stack CI/CD Pipeline Project — Task Manager

A Task Manager app (Node.js/Express + MongoDB backend, plain HTML/CSS/JS frontend)
with a complete CI/CD pipeline: Docker → GitHub Actions → Docker Hub → AWS EC2 → Nginx → rollback.

## Folder Structure

```
fullstack-cicd-project/
├── frontend/            # Static HTML/CSS/JS, served by Nginx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── style.css
│   └── script.js
├── backend/             # Express API + Mongoose models
│   ├── Dockerfile
│   ├── server.js
│   ├── routes/tasks.js
│   └── models/Task.js
├── .github/workflows/cicd.yml   # CI/CD pipeline
├── docker-compose.yml           # LOCAL dev (builds from source)
├── docker-compose.prod.yml      # PRODUCTION on EC2 (pulls from Docker Hub)
├── nginx.conf                   # Reference copy of the reverse proxy config
├── rollback.sh                  # Manual rollback script
└── README.md
```

## 1. Run locally

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api/tasks
- MongoDB: localhost:27017

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: full-stack CI/CD project"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## 3. Configure GitHub Secrets

Images are pushed to **GitHub Container Registry (ghcr.io)**, not Docker Hub — GitHub
Actions authenticates to it automatically using the built-in `GITHUB_TOKEN`, so you
only need to add the EC2 secrets yourself.

In your repo: **Settings → Secrets and variables → Actions**, add:

| Secret name    | Value                                    |
|----------------|-------------------------------------------|
| `EC2_HOST`     | Your EC2 instance's public IP/DNS         |
| `EC2_USERNAME` | `ubuntu` (for Ubuntu AMI)                 |
| `EC2_SSH_KEY`  | Contents of your EC2 `.pem` private key   |

### Make the GHCR packages public (one-time, after first push)

After your first successful pipeline run, go to your GitHub profile → **Packages** tab
→ open `taskmanager-backend` → **Package settings** → **Change visibility** → **Public**.
Repeat for `taskmanager-frontend`. This lets your EC2 server pull the images without
needing to authenticate to GHCR at all. (If you'd rather keep them private, EC2 would
need its own `docker login ghcr.io` with a personal access token — public is simpler
for a portfolio project.)

## 4. Prepare the EC2 server (one-time setup)

SSH into your instance, then:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
mkdir ~/fullstack-cicd-project
```

Copy `docker-compose.prod.yml` and `rollback.sh` into `~/fullstack-cicd-project` on the
server (e.g. via `scp`), and open ports 80 (HTTP) and 22 (SSH) in the EC2 security group.

Create a `.env` file next to `docker-compose.prod.yml` on the server with:

```
GHCR_OWNER=your-github-username-lowercase
```

## 5. Trigger the pipeline

Push any commit to `main`. GitHub Actions will:
1. Install dependencies and run tests
2. Build Docker images for frontend and backend
3. Tag images with the short commit SHA and `latest`
4. Push images to Docker Hub
5. SSH into EC2 and redeploy via `docker-compose.prod.yml`

## 6. Roll back if something breaks

On the EC2 instance:

```bash
chmod +x rollback.sh
./rollback.sh <previous-commit-sha>
```

You can find previous SHA tags in your Docker Hub repo or in `last_successful_tag.txt`
on the server (written automatically by the pipeline after each successful deploy).

## Interview talking points

- Images are tagged by commit SHA (not just `latest`) so any previous build can be
  redeployed deterministically — this is what makes rollback reliable.
- Local (`docker-compose.yml`) and production (`docker-compose.prod.yml`) configs are
  kept separate: local builds from source, production pulls immutable pre-built images.
- Nginx acts as the single entry point (port 80), reverse-proxying `/api/*` to the
  backend container so the frontend never needs to know the backend's internal address.
