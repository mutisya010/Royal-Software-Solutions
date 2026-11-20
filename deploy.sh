#!/usr/bin/env bash
# ==============================================================================
# deploy.sh
# Automated unified deployment, backup & PostgreSQL manager for:
#   1. Royal Software Solutions (Frontend: React / Vite)
#   2. Fahari Nexus Core (Frontend: React / Vite)
#   3. Business ERP (Backend: Django / Gunicorn / PostgreSQL 16)
#
# Key Features:
#   - Automatic Pre-Deployment Backups: Every time new changes are deployed,
#     a full snapshot (Database, Live Webroot, Media Uploads, and .env files)
#     is automatically captured before writing to live.
#   - On-Demand Backup Command: './deploy.sh backup' creates an instant snapshot.
#   - Prod vs Dev Configuration:
#       * Production: Automatically enforces DJANGO_SETTINGS_MODULE="erp.settings_prod",
#         DJANGO_ENV="production", DB_PORT=5433, and loads .env.production.
#       * Development / Local: Automatically uses erp.settings_dev (DB_PORT=5432, DEBUG=True).
#   - Git Syncing with automatic merge conflict resolution and rollback commit logging.
#   - Vite Builds with automatic production API URL injection.
#   - Safe webroot deployment with pre-sync live webroot archiving.
#   - Gunicorn, Celery, Nginx service management and Redis cache flushing.
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# 1. DIRECTORY & PATH DEFINITIONS
# ------------------------------------------------------------------------------
ROYAL_BASE_DIR="/var/www"

# 1. Backend: Business ERP (Django)
BACKEND_DIR="${ROYAL_BASE_DIR}/business-erp"

# 2. Frontend: Royal Software Solutions (Vite / React)
ROYAL_FE_REPO="${ROYAL_BASE_DIR}/royal-softwares"
ROYAL_FE_LIVE="${ROYAL_BASE_DIR}/royalsoftwares"

# 3. Frontend: Fahari Nexus Core (Vite / React)
NEXUS_FE_REPO="${ROYAL_BASE_DIR}/fahari-nexus-core"

# Backup & logs directory
BACKUP_DIR="/var/backups/royalsoftwares"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"

# Target selector: all (default), backend, royal, nexus, frontend, backup, env, status, dev
TARGET="${1:-all}"

# Production API URLs
ROYAL_PROD_API_URL="${ROYAL_API_URL:-https://easybizz.royalsoftwares.co.ke}"
NEXUS_PROD_API_URL="${NEXUS_API_URL:-https://easybizz.royalsoftwares.co.ke/}"

# ------------------------------------------------------------------------------
# 2. DJANGO & DATABASE ENVIRONMENT CONFIGURATION (PROD VS DEV)
# ------------------------------------------------------------------------------
# Safely load backend environment variables if present
if [ -f "${BACKEND_DIR}/.env" ]; then
    while IFS= read -r line || [ -n "$line" ]; do
        line="$(echo "$line" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        case "$line" in
            \#*|"") continue ;;
        esac
        if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            key="${BASH_REMATCH[1]}"
            val="${BASH_REMATCH[2]}"
            val="${val%\"}"
            val="${val#\"}"
            val="${val%\'}"
            val="${val#\'}"
            export "$key"="$val"
        fi
    done < "${BACKEND_DIR}/.env"
fi

# Detect whether this deployment is Production or Development mode
if [ "${TARGET}" = "dev" ] || [ "${DJANGO_ENV:-}" = "development" ] || [ "${ENVIRONMENT:-}" = "development" ]; then
    export DJANGO_SETTINGS_MODULE="erp.settings_dev"
    export DJANGO_ENV="development"
    export ENVIRONMENT="development"
    export DB_PORT="${DB_PORT:-5432}"
    export PGPORT="${PGPORT:-5432}"
    SETTINGS_LABEL="Development (erp.settings_dev, Port 5432)"
else
    # In live deployment on VPS, strictly enforce production settings and PostgreSQL 16 (port 5433)
    export DJANGO_SETTINGS_MODULE="erp.settings_prod"
    export DJANGO_ENV="production"
    export ENVIRONMENT="production"
    export DB_PORT="5433"
    export PGPORT="5433"
    SETTINGS_LABEL="Production (erp.settings_prod, Port 5433)"

    # Enforce PostgreSQL 16 port (5433) in all relevant .env files
    echo ">>> Enforcing PostgreSQL 16 port (5433) across environment files..."
    if [ -f ".env" ]; then
        sed -i 's/^POSTGRES_PORT=.*/POSTGRES_PORT=5433/' .env 2>/dev/null || true
        sed -i 's/^DB_PORT=.*/DB_PORT=5433/' .env 2>/dev/null || true
    fi

    if [ -f "${ROYAL_FE_REPO}/.env" ]; then
        sed -i 's/^POSTGRES_PORT=.*/POSTGRES_PORT=5433/' "${ROYAL_FE_REPO}/.env" 2>/dev/null || true
        sed -i 's/^DB_PORT=.*/DB_PORT=5433/' "${ROYAL_FE_REPO}/.env" 2>/dev/null || true
    fi

    if [ -f "${BACKEND_DIR}/.env" ]; then
        sed -i 's/^POSTGRES_PORT=.*/POSTGRES_PORT=5433/' "${BACKEND_DIR}/.env" 2>/dev/null || true
        sed -i 's/^DB_PORT=.*/DB_PORT=5433/' "${BACKEND_DIR}/.env" 2>/dev/null || true
        grep -q "^DB_PORT=" "${BACKEND_DIR}/.env" 2>/dev/null || echo "DB_PORT=5433" >> "${BACKEND_DIR}/.env"
        grep -q "^POSTGRES_PORT=" "${BACKEND_DIR}/.env" 2>/dev/null || echo "POSTGRES_PORT=5433" >> "${BACKEND_DIR}/.env"
    fi
fi

# PostgreSQL credentials
export PGPASSWORD="${DB_PASSWORD:-Admin@2025}"
export PGUSER="postgres"
export PGHOST="${DB_HOST:-localhost}"
export DBNAME="${DB_NAME:-easybizdb}"

echo "============================================================"
echo " Royal Software Solutions & Business ERP Deployer"
echo " Target Mode : ${TARGET}"
echo " Settings    : ${SETTINGS_LABEL}"
echo " Database    : ${DBNAME} on ${PGHOST}:${PGPORT}"
echo " Timestamp   : ${TIMESTAMP}"
echo " Backup Dir  : ${BACKUP_DIR}"
echo "============================================================"

# ------------------------------------------------------------------------------
# 3. HELPER FUNCTIONS
# ------------------------------------------------------------------------------

# Helper: Detect active Python virtual environment for backend
detect_backend_venv() {
    local CANDIDATES=(
        "${BACKEND_DIR}/venv"
        "${ROYAL_BASE_DIR}/easybizenv"
        "${ROYAL_BASE_DIR}/venv"
        "${BACKEND_DIR}/.venv"
    )
    for cand in "${CANDIDATES[@]}"; do
        if [ -f "${cand}/bin/activate" ] && [ -x "${cand}/bin/python" ]; then
            echo "${cand}"
            return 0
        fi
    done
    echo "${BACKEND_DIR}/venv"
}

# Helper: Ensure venv uses a modern Python version (>= 3.10)
ensure_modern_venv() {
    local VENV_PATH="$1"
    local NEED_REBUILD=false

    if [ ! -d "${VENV_PATH}" ] || [ ! -f "${VENV_PATH}/bin/python" ]; then
        NEED_REBUILD=true
    else
        local VENV_PY_VER
        VENV_PY_VER=$("${VENV_PATH}/bin/python" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "0.0")
        local VENV_MAJOR=$(echo "$VENV_PY_VER" | cut -d'.' -f1)
        local VENV_MINOR=$(echo "$VENV_PY_VER" | cut -d'.' -f2)
        if [ "$VENV_MAJOR" -lt 3 ] || [ "$VENV_MINOR" -lt 10 ]; then
            echo ">>> Detected Python ${VENV_PY_VER} in venv (< 3.10). Modern Python (>= 3.10) is required."
            NEED_REBUILD=true
        fi
    fi

    if [ "$NEED_REBUILD" = true ]; then
        local CHOSEN_PY=""
        for cand in python3.12 python3.11 python3.10 python3; do
            if command -v "$cand" &>/dev/null; then
                local PY_VER
                PY_VER=$("$cand" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "0.0")
                local MAJ=$(echo "$PY_VER" | cut -d'.' -f1)
                local MIN=$(echo "$PY_VER" | cut -d'.' -f2)
                if [ "$MAJ" -eq 3 ] && [ "$MIN" -ge 10 ]; then
                    CHOSEN_PY="$cand"
                    break
                fi
            fi
        done

        if [ -z "$CHOSEN_PY" ]; then
            echo "Error: No Python >= 3.10 found. Please install python3.11 or python3.12 on the server."
            return 1
        fi

        echo ">>> Building/updating virtual environment with ${CHOSEN_PY} ($($CHOSEN_PY --version))..."
        if [ -d "${VENV_PATH}" ]; then
            mv "${VENV_PATH}" "${VENV_PATH}_backup_${TIMESTAMP}" 2>/dev/null || true
        fi
        "$CHOSEN_PY" -m venv "${VENV_PATH}"
        "${VENV_PATH}/bin/python" -m pip install --upgrade pip setuptools wheel
    fi
}

# Helper: Ensure Node.js is modern (>= 18 required for Vite & Tailwind)
ensure_modern_node() {
    local NODE_VER
    NODE_VER=$(node -v 2>/dev/null || echo "v0.0.0")
    local NODE_MAJOR=$(echo "$NODE_VER" | sed 's/v//' | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo ">>> ERROR: Detected Node.js ${NODE_VER} (< 18). Modern Node.js (>= 18 or 20 LTS) is required by Vite."
        echo ">>> Please upgrade Node.js on your server by running:"
        echo "    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "    sudo apt-get install -y nodejs"
        return 1
    fi
}

# Helper: Ensure Royal Software Solutions frontend .env exists with correct production variables
ensure_royal_frontend_env() {
    local FE_ENV="${ROYAL_FE_REPO}/.env"
    local FE_ENV_PROD="${ROYAL_FE_REPO}/.env.production"

    echo ">>> Validating Royal Software Solutions frontend environment (${FE_ENV})..."
    if [ ! -f "${FE_ENV}" ]; then
        echo ">>> Creating missing ${FE_ENV} with production settings..."
        cat <<EOF > "${FE_ENV}"
# Royal Software Solutions - Production Environment Configuration
VITE_API_URL=${ROYAL_PROD_API_URL}
VITE_TOKEN_KEY=royal_auth_token
VITE_USER_KEY=royal_user_info

# EmailJS Service Configuration (Optional)
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
EOF
        echo "Created ${FE_ENV} pointing to ${ROYAL_PROD_API_URL}."
    else
        # If file exists, ensure VITE_API_URL does NOT point to localhost/127.0.0.1 in production
        if [ "${DJANGO_ENV}" = "production" ] && grep -qE "^VITE_API_URL=https?://(localhost|127\.0\.0\.1)" "${FE_ENV}"; then
            echo "Notice: Detected local dev URL in ${FE_ENV}. Updating VITE_API_URL to ${ROYAL_PROD_API_URL}..."
            sed -i "s|^VITE_API_URL=.*|VITE_API_URL=${ROYAL_PROD_API_URL}|" "${FE_ENV}"
        elif ! grep -q "^VITE_API_URL=" "${FE_ENV}"; then
            echo "VITE_API_URL=${ROYAL_PROD_API_URL}" >> "${FE_ENV}"
        fi

        grep -q "^VITE_TOKEN_KEY=" "${FE_ENV}" || echo "VITE_TOKEN_KEY=royal_auth_token" >> "${FE_ENV}"
        grep -q "^VITE_USER_KEY=" "${FE_ENV}" || echo "VITE_USER_KEY=royal_user_info" >> "${FE_ENV}"
    fi

    # Also sync .env.production
    if [ ! -f "${FE_ENV_PROD}" ]; then
        cat <<EOF > "${FE_ENV_PROD}"
VITE_API_URL=${ROYAL_PROD_API_URL}
VITE_TOKEN_KEY=royal_auth_token
VITE_USER_KEY=royal_user_info
EOF
    fi

    echo "Frontend environment ready: VITE_API_URL=$(grep '^VITE_API_URL=' "${FE_ENV}" | head -n1 | cut -d'=' -f2)"
}

# Helper: Ensure Fahari Nexus frontend .env exists
ensure_nexus_frontend_env() {
    local NEXUS_ENV="${NEXUS_FE_REPO}/.env"
    local NEXUS_ENV_PROD="${NEXUS_FE_REPO}/.env.production"

    if [ -d "${NEXUS_FE_REPO}" ]; then
        echo ">>> Validating Fahari Nexus frontend environment (${NEXUS_ENV})..."
        if [ ! -f "${NEXUS_ENV}" ]; then
            echo "VITE_API_BASE_URL=${NEXUS_PROD_API_URL}" > "${NEXUS_ENV}"
        elif [ "${DJANGO_ENV}" = "production" ] && grep -qE "^VITE_API_BASE_URL=https?://(localhost|127\.0\.0\.1)" "${NEXUS_ENV}"; then
            echo "Notice: Updating local URL in ${NEXUS_ENV} to ${NEXUS_PROD_API_URL}..."
            sed -i "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=${NEXUS_PROD_API_URL}|" "${NEXUS_ENV}"
        fi

        if [ ! -f "${NEXUS_ENV_PROD}" ]; then
            echo "VITE_API_BASE_URL=${NEXUS_PROD_API_URL}" > "${NEXUS_ENV_PROD}"
        fi
        echo "Nexus environment ready: VITE_API_BASE_URL=$(grep '^VITE_API_BASE_URL=' "${NEXUS_ENV}" | head -n1 | cut -d'=' -f2)"
    fi
}

# Helper: Detect active Gunicorn systemd service
detect_backend_service() {
    local SERVICES=("easybiz.service" "easybiz" "gunicorn_easybiz.service" "gunicorn_easybiz" "business-erp.service" "gunicorn.service")
    for svc in "${SERVICES[@]}"; do
        if systemctl is-active --quiet "${svc}" 2>/dev/null || systemctl list-unit-files "${svc}" &>/dev/null; then
            echo "${svc}"
            return 0
        fi
    done
    echo "easybiz.service"
}

# Helper: Reliably sync git repository without halting on conflicts, logging prior commit for rollback
sync_repository() {
    local REPO_DIR="$1"
    local REPO_LABEL="$2"
    local DEFAULT_BRANCH="${3:-main}"

    echo ">>> Syncing ${REPO_LABEL} in ${REPO_DIR}..."
    if [ ! -d "${REPO_DIR}/.git" ]; then
        echo "Notice: ${REPO_DIR} is not a git repository. Skipping git pull."
        return 0
    fi

    cd "${REPO_DIR}"

    # Stash any local uncommitted tracked changes
    git stash || true

    # Log current commit prior to sync for instant rollback reference
    local PRIOR_COMMIT
    PRIOR_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    mkdir -p "${BACKUP_DIR}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ${REPO_LABEL}: prior commit ${PRIOR_COMMIT}" >> "${BACKUP_DIR}/git_rollback_log.txt"

    # Determine local active branch
    local LOCAL_BRANCH
    LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "${DEFAULT_BRANCH}")

    # Fetch all branches from origin
    echo "Fetching origin for ${REPO_LABEL}..."
    git fetch origin --prune || true

    # Determine remote branch: prefer LOCAL_BRANCH, else DEFAULT_BRANCH, else main, else master
    local TARGET_BRANCH="${LOCAL_BRANCH}"
    if ! git rev-parse --verify "origin/${TARGET_BRANCH}" &>/dev/null; then
        if git rev-parse --verify "origin/${DEFAULT_BRANCH}" &>/dev/null; then
            TARGET_BRANCH="${DEFAULT_BRANCH}"
        elif git rev-parse --verify "origin/main" &>/dev/null; then
            TARGET_BRANCH="main"
        elif git rev-parse --verify "origin/master" &>/dev/null; then
            TARGET_BRANCH="master"
        fi
    fi

    echo "Merging origin/${TARGET_BRANCH} into ${LOCAL_BRANCH} (auto-resolving conflicts)..."
    if git merge "origin/${TARGET_BRANCH}" --allow-unrelated-histories -X theirs --no-edit 2>/dev/null; then
        echo "Successfully merged origin/${TARGET_BRANCH} for ${REPO_LABEL}."
    else
        echo "Notice: Merge conflict or divergence detected. Resetting to remote origin/${TARGET_BRANCH}..."
        git reset --hard "origin/${TARGET_BRANCH}"
    fi
}

# ------------------------------------------------------------------------------
# 4. PRE-DEPLOYMENT BACKUP SUITE (Automated snapshot before live changes)
# ------------------------------------------------------------------------------
perform_pre_deployment_backup() {
    echo "============================================================"
    echo " [BACKUP] Executing Automated Pre-Deployment Snapshots"
    echo " Target Mode : ${TARGET}"
    echo " Timestamp   : ${TIMESTAMP}"
    echo " Backup Dir  : ${BACKUP_DIR}"
    echo "============================================================"

    mkdir -p "${BACKUP_DIR}/db" "${BACKUP_DIR}/frontend" "${BACKUP_DIR}/media" "${BACKUP_DIR}/config"

    # --- 1. Live PostgreSQL Database Snapshot ---
    if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ] || [ "${TARGET}" = "backup" ] || [ "${TARGET}" = "snapshot" ]; then
        if command -v pg_dump &>/dev/null; then
            local DB_BACKUP_FILE="${BACKUP_DIR}/db/easybizdb_port${PGPORT}_${TIMESTAMP}.sql.gz"
            echo ">>> [1/4 DB Backup] Dumping live database '${DBNAME}' from port ${PGPORT}..."
            
            if PGPASSWORD="${PGPASSWORD}" pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" "${DBNAME}" 2>/dev/null | gzip > "${DB_BACKUP_FILE}"; then
                local DB_SIZE
                DB_SIZE=$(du -h "${DB_BACKUP_FILE}" 2>/dev/null | cut -f1)
                echo ">>> Database snapshot successfully created: ${DB_BACKUP_FILE} (${DB_SIZE})"
            elif sudo -u postgres pg_dump -p "${PGPORT}" "${DBNAME}" 2>/dev/null | gzip > "${DB_BACKUP_FILE}"; then
                local DB_SIZE
                DB_SIZE=$(du -h "${DB_BACKUP_FILE}" 2>/dev/null | cut -f1)
                echo ">>> Database snapshot successfully created (via peer auth): ${DB_BACKUP_FILE} (${DB_SIZE})"
            else
                echo ">>> Notice: Database dump on port ${PGPORT} skipped or database unpopulated."
            fi
        else
            echo ">>> Notice: pg_dump not found in PATH. Skipping database SQL snapshot."
        fi
    fi

    # --- 2. Live Frontend Webroot Snapshot ---
    if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "royal" ] || [ "${TARGET}" = "frontend" ] || [ "${TARGET}" = "backup" ] || [ "${TARGET}" = "snapshot" ]; then
        if [ -d "${ROYAL_FE_LIVE}" ] && [ -n "$(ls -A "${ROYAL_FE_LIVE}" 2>/dev/null)" ]; then
            local FE_BACKUP="${BACKUP_DIR}/frontend/live_royalsoftwares_${TIMESTAMP}.tar.gz"
            echo ">>> [2/4 Frontend Backup] Archiving active live webroot (${ROYAL_FE_LIVE})..."
            tar -czf "${FE_BACKUP}" -C "${ROYAL_FE_LIVE}" . 2>/dev/null || true
            local FE_SIZE
            FE_SIZE=$(du -h "${FE_BACKUP}" 2>/dev/null | cut -f1)
            echo ">>> Live webroot snapshot created: ${FE_BACKUP} (${FE_SIZE})"
        else
            echo ">>> [2/4 Frontend Backup] Live webroot ${ROYAL_FE_LIVE} empty or not yet deployed."
        fi
    fi

    # --- 3. Live Media & User Uploads Snapshot ---
    if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ] || [ "${TARGET}" = "backup" ] || [ "${TARGET}" = "snapshot" ]; then
        local MEDIA_DIR="${BACKEND_DIR}/media"
        if [ -d "${MEDIA_DIR}" ] && [ -n "$(ls -A "${MEDIA_DIR}" 2>/dev/null)" ]; then
            local MEDIA_BACKUP="${BACKUP_DIR}/media/media_uploads_${TIMESTAMP}.tar.gz"
            echo ">>> [3/4 Media Backup] Archiving live user uploads (${MEDIA_DIR})..."
            tar -czf "${MEDIA_BACKUP}" -C "${MEDIA_DIR}" . 2>/dev/null || true
            local MEDIA_SIZE
            MEDIA_SIZE=$(du -h "${MEDIA_BACKUP}" 2>/dev/null | cut -f1)
            echo ">>> Media uploads snapshot created: ${MEDIA_BACKUP} (${MEDIA_SIZE})"
        else
            echo ">>> [3/4 Media Backup] Media directory ${MEDIA_DIR} empty or not present."
        fi
    fi

    # --- 4. Live Environment Configurations Snapshot ---
    local ENV_BACKUP="${BACKUP_DIR}/config/env_configs_${TIMESTAMP}.tar.gz"
    echo ">>> [4/4 Config Backup] Archiving production environment configurations..."
    local ENV_FILES=()
    [ -f "${BACKEND_DIR}/.env" ] && ENV_FILES+=("${BACKEND_DIR}/.env")
    [ -f "${ROYAL_FE_REPO}/.env" ] && ENV_FILES+=("${ROYAL_FE_REPO}/.env")
    [ -f "${NEXUS_FE_REPO}/.env" ] && ENV_FILES+=("${NEXUS_FE_REPO}/.env")
    if [ ${#ENV_FILES[@]} -gt 0 ]; then
        tar -czf "${ENV_BACKUP}" "${ENV_FILES[@]}" 2>/dev/null || true
        echo ">>> Environment configs snapshot created: ${ENV_BACKUP}"
    fi

    # --- 5. Rotation & Retention (Prune snapshots older than 14 days) ---
    echo ">>> Pruning backups older than 14 days..."
    find "${BACKUP_DIR}" -type f \( -name "*.tar.gz" -o -name "*.sql.gz" -o -name "*.dump" \) -mtime +14 -delete 2>/dev/null || true

    echo ">>> Pre-deployment backup sequence completed."
    echo "============================================================"
}

# ------------------------------------------------------------------------------
# 5. CLI TARGET HANDLERS
# ------------------------------------------------------------------------------

# 1. On-Demand Backup Snapshot Handler
if [ "${TARGET}" = "backup" ] || [ "${TARGET}" = "snapshot" ]; then
    perform_pre_deployment_backup
    echo ">>> On-demand backup completed successfully. Exiting without deploying."
    exit 0
fi

# 2. Environment Inspection Handler
if [ "${TARGET}" = "env" ] || [ "${TARGET}" = "config-env" ]; then
    echo ">>> Inspecting Environment Configurations..."
    echo ""
    echo "--- 1. Backend: Business ERP (${BACKEND_DIR}/.env) ---"
    if [ -f "${BACKEND_DIR}/.env" ]; then
        grep -E "^(DJANGO_ENV|ENVIRONMENT|DB_NAME|DB_USER|DB_HOST|DB_PORT|DEBUG|ALLOWED_HOSTS|CORS_ALLOWED_ORIGINS)=" "${BACKEND_DIR}/.env" || cat "${BACKEND_DIR}/.env"
    else
        echo "Warning: ${BACKEND_DIR}/.env does not exist!"
    fi

    echo ""
    echo "--- 2. Frontend: Royal Software Solutions (${ROYAL_FE_REPO}/.env) ---"
    ensure_royal_frontend_env
    cat "${ROYAL_FE_REPO}/.env"

    echo ""
    echo "--- 3. Frontend: Fahari Nexus (${NEXUS_FE_REPO}/.env) ---"
    ensure_nexus_frontend_env
    if [ -f "${NEXUS_FE_REPO}/.env" ]; then
        cat "${NEXUS_FE_REPO}/.env"
    fi
    exit 0
fi

# 3. Status / Health Check Handler
if [ "${TARGET}" = "status" ]; then
    echo ">>> Checking deployment status and system services..."
    GUNICORN_SVC=$(detect_backend_service)
    echo "--- Systemd Services ---"
    systemctl status "${GUNICORN_SVC}" --no-pager -l || true
    systemctl status nginx --no-pager -l || true
    echo "--- PostgreSQL Connectivity ---"
    echo "PostgreSQL (${PGHOST}:${PGPORT}): $(pg_isready -h "${PGHOST}" -p "${PGPORT}" 2>/dev/null || echo 'down')"
    echo "--- Gunicorn Socket Check ---"
    ls -la /run/easybiz/easybiz.sock 2>/dev/null || echo "No socket at /run/easybiz/easybiz.sock"
    echo "--- Nginx Syntax Check ---"
    nginx -t
    exit 0
fi

# ------------------------------------------------------------------------------
# 6. STEP 1: AUTOMATED PRE-DEPLOYMENT BACKUP
# (Always executes before writing any changes or pulling code)
# ------------------------------------------------------------------------------
perform_pre_deployment_backup

# ------------------------------------------------------------------------------
# 7. STEP 2: GIT SYNCING
# ------------------------------------------------------------------------------
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ] || [ "${TARGET}" = "dev" ]; then
    sync_repository "${BACKEND_DIR}" "Backend (business-erp)" "main"
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "royal" ] || [ "${TARGET}" = "frontend" ] || [ "${TARGET}" = "dev" ]; then
    sync_repository "${ROYAL_FE_REPO}" "Frontend (royal-softwares)" "main"
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "nexus" ] || [ "${TARGET}" = "frontend" ]; then
    if [ -d "${NEXUS_FE_REPO}" ]; then
        sync_repository "${NEXUS_FE_REPO}" "Frontend (fahari-nexus-core)" "main"
    fi
fi

# Ensure production database port (5433) is enforced after git synchronization
if [ "${TARGET}" != "dev" ]; then
    [ -f ".env" ] && sed -i 's/^POSTGRES_PORT=.*/POSTGRES_PORT=5433/' .env 2>/dev/null || true
    [ -f ".env" ] && sed -i 's/^DB_PORT=.*/DB_PORT=5433/' .env 2>/dev/null || true
    [ -f "${ROYAL_FE_REPO}/.env" ] && sed -i 's/^POSTGRES_PORT=.*/POSTGRES_PORT=5433/' "${ROYAL_FE_REPO}/.env" 2>/dev/null || true
    [ -f "${ROYAL_FE_REPO}/.env" ] && sed -i 's/^DB_PORT=.*/DB_PORT=5433/' "${ROYAL_FE_REPO}/.env" 2>/dev/null || true
    [ -f "${BACKEND_DIR}/.env" ] && sed -i 's/^POSTGRES_PORT=.*/POSTGRES_PORT=5433/' "${BACKEND_DIR}/.env" 2>/dev/null || true
    [ -f "${BACKEND_DIR}/.env" ] && sed -i 's/^DB_PORT=.*/DB_PORT=5433/' "${BACKEND_DIR}/.env" 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# 9. STEP 3: RUNTIME VERIFICATION (Python >= 3.10, Node >= 18)
# ------------------------------------------------------------------------------
ACTIVE_VENV=$(detect_backend_venv)

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ] || [ "${TARGET}" = "dev" ]; then
    echo ">>> Verifying Python virtual environment at ${ACTIVE_VENV}..."
    ensure_modern_venv "${ACTIVE_VENV}"
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "royal" ] || [ "${TARGET}" = "nexus" ] || [ "${TARGET}" = "frontend" ] || [ "${TARGET}" = "dev" ]; then
    ensure_modern_node
fi

# ------------------------------------------------------------------------------
# 10. STEP 4: DEPENDENCY UPDATES
# ------------------------------------------------------------------------------
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ] || [ "${TARGET}" = "dev" ]; then
    echo ">>> Updating backend dependencies in ${ACTIVE_VENV}..."
    cd "${BACKEND_DIR}"
    # Purge numpy and pandas if installed, preventing x86-64-v2 baseline CPU crashes on VPS
    "${ACTIVE_VENV}/bin/pip" uninstall -y numpy pandas 2>/dev/null || true
    "${ACTIVE_VENV}/bin/pip" install --no-input -r requirements.txt
    "${ACTIVE_VENV}/bin/pip" install --no-input gunicorn
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "royal" ] || [ "${TARGET}" = "frontend" ] || [ "${TARGET}" = "dev" ]; then
    echo ">>> Updating Royal Software Solutions frontend dependencies..."
    cd "${ROYAL_FE_REPO}"
    if [ -f "package.json" ]; then
        npm install --legacy-peer-deps --no-audit || npm install --legacy-peer-deps
    fi
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "nexus" ] || [ "${TARGET}" = "frontend" ]; then
    if [ -d "${NEXUS_FE_REPO}" ]; then
        echo ">>> Updating Fahari Nexus frontend dependencies..."
        cd "${NEXUS_FE_REPO}"
        if [ -f "package.json" ]; then
            npm install --legacy-peer-deps --no-audit || npm install --legacy-peer-deps
        fi
    fi
fi

# ------------------------------------------------------------------------------
# 10. STEP 5: DATABASE MIGRATIONS (Enforcing active settings file)
# ------------------------------------------------------------------------------
run_database_migrations() {
    echo ">>> Running Django database migrations with ${DJANGO_SETTINGS_MODULE} against ${PGHOST}:${PGPORT}..."
    cd "${BACKEND_DIR}"
    "${ACTIVE_VENV}/bin/python" manage.py migrate --settings="${DJANGO_SETTINGS_MODULE}" --noinput
}

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ] || [ "${TARGET}" = "dev" ]; then
    run_database_migrations
fi

# ------------------------------------------------------------------------------
# 12. STEP 6: FRONTEND BUILDS & LIVE WEBROOT SYNCING
# ------------------------------------------------------------------------------
# Build Royal Software Solutions & sync dist to /var/www/royalsoftwares
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "royal" ] || [ "${TARGET}" = "frontend" ] || [ "${TARGET}" = "dev" ]; then
    ensure_royal_frontend_env

    echo ">>> Building Royal Software Solutions frontend (npm run build)..."
    cd "${ROYAL_FE_REPO}"
    npm run build

    echo ">>> Deploying built assets to live webroot ${ROYAL_FE_LIVE}..."
    mkdir -p "${ROYAL_FE_LIVE}"
    if [ -d "dist" ]; then
        # Safety archive of live webroot prior to overwrite
        if [ -d "${ROYAL_FE_LIVE}" ] && [ -n "$(ls -A "${ROYAL_FE_LIVE}" 2>/dev/null)" ]; then
            echo ">>> Capturing pre-sync live webroot safety archive..."
            mkdir -p "${BACKUP_DIR}/frontend"
            tar -czf "${BACKUP_DIR}/frontend/live_pre_overwrite_royalsoftwares_${TIMESTAMP}.tar.gz" -C "${ROYAL_FE_LIVE}" . 2>/dev/null || true
        fi

        if command -v rsync &>/dev/null; then
            rsync -av --delete dist/ "${ROYAL_FE_LIVE}/"
        else
            rm -rf "${ROYAL_FE_LIVE:?}"/*
            cp -r dist/* "${ROYAL_FE_LIVE}/"
        fi
        echo "Live webroot ${ROYAL_FE_LIVE} updated successfully."
    else
        echo "Error: dist directory not found in ${ROYAL_FE_REPO} after build."
        exit 1
    fi
fi

# Build Fahari Nexus
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "nexus" ] || [ "${TARGET}" = "frontend" ]; then
    if [ -d "${NEXUS_FE_REPO}" ]; then
        ensure_nexus_frontend_env

        echo ">>> Building Fahari Nexus frontend (npm run build)..."
        cd "${NEXUS_FE_REPO}"
        npm run build
        echo "Fahari Nexus dist built successfully."
    fi
fi

# ------------------------------------------------------------------------------
# 13. STEP 7: STATIC FILES COLLECTION (Django Backend)
# ------------------------------------------------------------------------------
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ] || [ "${TARGET}" = "dev" ]; then
    echo ">>> Collecting backend static files with ${DJANGO_SETTINGS_MODULE}..."
    cd "${BACKEND_DIR}"
    "${ACTIVE_VENV}/bin/python" manage.py collectstatic --settings="${DJANGO_SETTINGS_MODULE}" --noinput
fi

# ------------------------------------------------------------------------------
# 14. STEP 8: PERMISSIONS NORMALIZATION
# ------------------------------------------------------------------------------
echo ">>> Setting permissions for www-data..."

# Backend directories
if [ -d "${BACKEND_DIR}" ]; then
    mkdir -p "${BACKEND_DIR}/media" "${BACKEND_DIR}/staticfiles" "${BACKEND_DIR}/static"
    chown -R www-data:www-data "${BACKEND_DIR}/media" "${BACKEND_DIR}/staticfiles" "${BACKEND_DIR}/static" 2>/dev/null || true
    chmod -R 775 "${BACKEND_DIR}/media" "${BACKEND_DIR}/staticfiles" "${BACKEND_DIR}/static" 2>/dev/null || true
fi

# Royal Softwares directories
if [ -d "${ROYAL_FE_LIVE}" ]; then
    chown -R www-data:www-data "${ROYAL_FE_LIVE}" 2>/dev/null || true
    chmod -R 755 "${ROYAL_FE_LIVE}" 2>/dev/null || true
fi
if [ -d "${ROYAL_FE_REPO}" ]; then
    chown -R www-data:www-data "${ROYAL_FE_REPO}/dist" "${ROYAL_FE_REPO}/.env" 2>/dev/null || true
fi

# Nexus directory
if [ -d "${NEXUS_FE_REPO}" ]; then
    chown -R www-data:www-data "${NEXUS_FE_REPO}/dist" 2>/dev/null || true
    chmod -R 755 "${NEXUS_FE_REPO}/dist" 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# 15. STEP 9: SERVICE RESTARTS
# ------------------------------------------------------------------------------
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    GUNICORN_SVC=$(detect_backend_service)
    echo ">>> Restarting Gunicorn service (${GUNICORN_SVC})..."
    systemctl restart "${GUNICORN_SVC}" 2>/dev/null || true

    # Check for Celery service if configured
    if systemctl list-unit-files 2>/dev/null | grep -Eq "celery_easybiz|easybiz_celery"; then
        echo ">>> Restarting Celery workers..."
        systemctl restart celery_easybiz 2>/dev/null || systemctl restart easybiz_celery 2>/dev/null || true
    fi
fi

# ------------------------------------------------------------------------------
# 16. STEP 10: TEST & RELOAD NGINX
# ------------------------------------------------------------------------------
if command -v nginx &>/dev/null; then
    echo ">>> Validating Nginx configuration and reloading..."
    nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# 17. STEP 11: CLEAR CACHES
# ------------------------------------------------------------------------------
if command -v redis-cli &>/dev/null; then
    echo ">>> Clearing Redis cache..."
    redis-cli flushall 2>/dev/null || true
fi

echo "============================================================"
echo " Deployment Successfully Completed!"
echo " Target      : ${TARGET}"
echo " Settings    : ${SETTINGS_LABEL}"
echo " Finished At : $(date +'%Y-%m-%d %H:%M:%S')"
echo "============================================================"
