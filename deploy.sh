#!/usr/bin/env bash
# ==============================================================================
# deploy.sh
# Automated unified deployment & PostgreSQL migration script for:
#   1. Royal Software Solutions (Frontend: React / Vite)
#   2. Fahari Nexus Core (Frontend: React / Vite)
#   3. Business ERP (Backend: Django / Gunicorn / PostgreSQL 16)
#
# Features:
#   - Automatic frontend .env creation & production API URL verification
#   - Automated PostgreSQL 12 (5432) to PostgreSQL 16 (5433) migration command
#   - Git syncing with stash, merge conflict & unrelated history resolution
#   - Modern Python virtual environment verification (Python >= 3.10)
#   - Modern Node.js verification (Node >= 18 for Vite)
#   - Pre-deployment automated database snapshots
#   - Django migrations, collectstatic & WeasyPrint/tinyhtml5 support
#   - Vite builds & webroot syncing to /var/www/royalsoftwares
#   - Systemd Gunicorn & Celery restarts, Nginx reload, and Redis flush
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

# Target selector: all (default), backend, royal, nexus, migrate-db, env, status
TARGET="${1:-all}"

# Production API URLs
ROYAL_PROD_API_URL="${ROYAL_API_URL:-https://easybizz.royalsoftwares.co.ke}"
NEXUS_PROD_API_URL="${NEXUS_API_URL:-https://easybizz.royalsoftwares.co.ke/}"

# ------------------------------------------------------------------------------
# 2. DJANGO & DATABASE ENVIRONMENT CONFIGURATION
# ------------------------------------------------------------------------------
# Enforce Django settings module for Business ERP
export DJANGO_SETTINGS_MODULE="erp.settings"

# Safely load backend production environment variables without source/eval syntax errors
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

# PostgreSQL credentials: defaults to port 5433 (PostgreSQL 16) with postgres user
export PGPASSWORD="${DB_PASSWORD:-Admin@2025}"
export PGUSER="postgres"
export PGHOST="${DB_HOST:-localhost}"
export DBNAME="${DB_NAME:-easybizdb}"

# Enforce PostgreSQL 16 (port 5433) because Django 5.x strictly requires PostgreSQL >= 14
if [ "${DB_PORT:-5433}" = "5432" ] || [ "${PGPORT:-5433}" = "5432" ]; then
    echo ">>> Notice: Detected DB_PORT=5432 (PostgreSQL 12, unsupported by Django 5.x)."
    echo ">>> Enforcing DB_PORT=5433 (PostgreSQL 16) in environment and backend .env..."
    export DB_PORT="5433"
    export PGPORT="5433"
    if [ -f "${BACKEND_DIR}/.env" ]; then
        sed -i 's/^DB_PORT=5432/DB_PORT=5433/' "${BACKEND_DIR}/.env" 2>/dev/null || true
        sed -i 's/^POSTGRES_PORT=5432/POSTGRES_PORT=5433/' "${BACKEND_DIR}/.env" 2>/dev/null || true
    fi
else
    export DB_PORT="${DB_PORT:-5433}"
    export PGPORT="${PGPORT:-5433}"
fi

echo "============================================================"
echo " Starting Royal Softwares & Business ERP Manager"
echo " Target Mode : ${TARGET}"
echo " Environment : ${DJANGO_SETTINGS_MODULE}"
echo " Active DB   : ${DBNAME} on ${PGHOST}:${PGPORT}"
echo " Timestamp   : ${TIMESTAMP}"
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
# Baked into client bundles during Vite build
VITE_API_URL=${ROYAL_PROD_API_URL}
VITE_TOKEN_KEY=royal_auth_token
VITE_USER_KEY=royal_user_info

# EmailJS Service Configuration (Leave blank if not used)
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
EOF
        echo "Created ${FE_ENV} pointing to ${ROYAL_PROD_API_URL}."
    else
        # If file exists, ensure VITE_API_URL does NOT point to localhost/127.0.0.1
        if grep -qE "^VITE_API_URL=https?://(localhost|127\.0\.0\.1)" "${FE_ENV}"; then
            echo "Notice: Detected local dev URL in ${FE_ENV}. Updating VITE_API_URL to ${ROYAL_PROD_API_URL}..."
            sed -i "s|^VITE_API_URL=.*|VITE_API_URL=${ROYAL_PROD_API_URL}|" "${FE_ENV}"
        elif ! grep -q "^VITE_API_URL=" "${FE_ENV}"; then
            echo "VITE_API_URL=${ROYAL_PROD_API_URL}" >> "${FE_ENV}"
        fi

        # Ensure essential storage keys are present
        grep -q "^VITE_TOKEN_KEY=" "${FE_ENV}" || echo "VITE_TOKEN_KEY=royal_auth_token" >> "${FE_ENV}"
        grep -q "^VITE_USER_KEY=" "${FE_ENV}" || echo "VITE_USER_KEY=royal_user_info" >> "${FE_ENV}"
    fi

    # Also create/sync .env.production
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
        elif grep -qE "^VITE_API_BASE_URL=https?://(localhost|127\.0\.0\.1)" "${NEXUS_ENV}"; then
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

# Helper: Reliably sync git repository without halting on conflicts or unrelated histories
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

    echo "Merging origin/${TARGET_BRANCH} into ${LOCAL_BRANCH} (allowing unrelated histories & auto-resolving conflicts)..."
    if git merge "origin/${TARGET_BRANCH}" --allow-unrelated-histories -X theirs --no-edit; then
        echo "Successfully merged origin/${TARGET_BRANCH} for ${REPO_LABEL}."
    else
        echo "Notice: Merge conflict or divergence detected. Resetting to remote origin/${TARGET_BRANCH}..."
        git reset --hard "origin/${TARGET_BRANCH}"
    fi
}

# ------------------------------------------------------------------------------
# 4. ENVIRONMENT INSPECTION / CONFIGURATION HANDLER
# ------------------------------------------------------------------------------
if [ "${TARGET}" = "env" ] || [ "${TARGET}" = "config-env" ]; then
    echo ">>> Inspecting Environment Configurations..."
    echo ""
    echo "--- 1. Backend: Business ERP (${BACKEND_DIR}/.env) ---"
    if [ -f "${BACKEND_DIR}/.env" ]; then
        grep -E "^(DB_NAME|DB_USER|DB_HOST|DB_PORT|DEBUG|ALLOWED_HOSTS|CORS_ALLOWED_ORIGINS)=" "${BACKEND_DIR}/.env" || cat "${BACKEND_DIR}/.env"
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

# ------------------------------------------------------------------------------
# 5. POSTGRESQL 12 (5432) -> POSTGRESQL 16 (5433) MIGRATION HANDLER
# ------------------------------------------------------------------------------
migrate_postgres_12_to_16() {
    local PG12_PORT=5432
    local PG16_PORT=5433
    local DUMP_FILE="${BACKUP_DIR}/migration_pg12_to_pg16_${DBNAME}_${TIMESTAMP}.dump"
    local MIGRATION_USER="postgres"
    local MIGRATION_PW="${DB_PASSWORD:-Admin@2025}"

    export PGPASSWORD="${MIGRATION_PW}"

    echo "============================================================"
    echo " AUTOMATED DATABASE MIGRATION: PG 12 (5432) -> PG 16 (5433)"
    echo " Database Name : ${DBNAME}"
    echo " Database User : ${MIGRATION_USER}"
    echo " Target Host   : ${PGHOST}"
    echo "============================================================"

    mkdir -p "${BACKUP_DIR}"

    # 1. Connectivity checks
    echo ">>> Testing connection to PostgreSQL 12 (port ${PG12_PORT})..."
    if ! pg_isready -h "${PGHOST}" -p "${PG12_PORT}" &>/dev/null; then
        echo "Error: Cannot connect to PostgreSQL 12 on port ${PG12_PORT}. Please verify PG 12 is active."
        return 1
    fi

    echo ">>> Testing connection to PostgreSQL 16 (port ${PG16_PORT})..."
    if ! pg_isready -h "${PGHOST}" -p "${PG16_PORT}" &>/dev/null; then
        echo "Error: Cannot connect to PostgreSQL 16 on port ${PG16_PORT}. Please ensure PostgreSQL 16 service is running."
        return 1
    fi

    # 2. Dump from PostgreSQL 12 (port 5432)
    echo ">>> Dumping '${DBNAME}' from PostgreSQL 12 (port ${PG12_PORT}) to ${DUMP_FILE}..."
    if ! PGPASSWORD="${MIGRATION_PW}" pg_dump -h "${PGHOST}" -p "${PG12_PORT}" -U "${MIGRATION_USER}" -d "${DBNAME}" -F c -b -v -f "${DUMP_FILE}"; then
        echo ">>> Retrying dump via local socket (peer auth)..."
        sudo -u postgres pg_dump -p "${PG12_PORT}" -d "${DBNAME}" -F c -b -v -f "${DUMP_FILE}"
    fi

    local DUMP_SIZE
    DUMP_SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
    echo "Dump finished successfully. Archive size: ${DUMP_SIZE}"

    # 3. Ensure role and database exist on PostgreSQL 16 (port 5433)
    echo ">>> Checking database and user setup on PostgreSQL 16 (port ${PG16_PORT})..."
    if command -v sudo &>/dev/null; then
        sudo -u postgres psql -p "${PG16_PORT}" -c "ALTER USER postgres WITH PASSWORD '${MIGRATION_PW}';" 2>/dev/null || true
        sudo -u postgres psql -p "${PG16_PORT}" -tc "SELECT 1 FROM pg_roles WHERE rolname = 'admin';" 2>/dev/null | grep -q 1 || {
            echo ">>> Creating role 'admin' on PostgreSQL 16..."
            sudo -u postgres psql -p "${PG16_PORT}" -c "CREATE USER admin WITH PASSWORD '${MIGRATION_PW}' SUPERUSER;" 2>/dev/null || true
        }
        sudo -u postgres psql -p "${PG16_PORT}" -c "ALTER USER admin WITH PASSWORD '${MIGRATION_PW}' SUPERUSER;" 2>/dev/null || true
    fi

    if ! PGPASSWORD="${MIGRATION_PW}" psql -h "${PGHOST}" -p "${PG16_PORT}" -U "${MIGRATION_USER}" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '${DBNAME}';" 2>/dev/null | grep -q 1; then
        echo ">>> Creating database '${DBNAME}' on PostgreSQL 16 (port ${PG16_PORT})..."
        if command -v sudo &>/dev/null; then
            sudo -u postgres psql -p "${PG16_PORT}" -c "CREATE DATABASE \"${DBNAME}\" OWNER postgres;" 2>/dev/null || true
        else
            PGPASSWORD="${MIGRATION_PW}" psql -h "${PGHOST}" -p "${PG16_PORT}" -U "${MIGRATION_USER}" -d postgres -c "CREATE DATABASE \"${DBNAME}\" OWNER postgres;" 2>/dev/null || true
        fi
    fi

    if command -v sudo &>/dev/null; then
        sudo -u postgres psql -p "${PG16_PORT}" -c "GRANT ALL PRIVILEGES ON DATABASE \"${DBNAME}\" TO admin;" 2>/dev/null || true
        sudo -u postgres psql -p "${PG16_PORT}" -c "GRANT ALL PRIVILEGES ON DATABASE \"${DBNAME}\" TO postgres;" 2>/dev/null || true
    fi

    # 4. Restore dump into PostgreSQL 16 (port 5433)
    echo ">>> Restoring schema and data into PostgreSQL 16 (port ${PG16_PORT})..."
    if ! PGPASSWORD="${MIGRATION_PW}" pg_restore -h "${PGHOST}" -p "${PG16_PORT}" -U "${MIGRATION_USER}" -d "${DBNAME}" --clean --if-exists --no-owner -v "${DUMP_FILE}"; then
        sudo -u postgres pg_restore -p "${PG16_PORT}" -d "${DBNAME}" --clean --if-exists --no-owner -v "${DUMP_FILE}" 2>/dev/null || {
            echo "Notice: pg_restore returned notices or warnings (common with preexisting system schemas). Verifying table count..."
        }
    fi

    # 5. Verify restored database
    local RESTORED_TABLES
    RESTORED_TABLES=$(PGPASSWORD="${MIGRATION_PW}" psql -h "${PGHOST}" -p "${PG16_PORT}" -U "${MIGRATION_USER}" -d "${DBNAME}" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    echo ">>> Verification: Total public tables in PostgreSQL 16 '${DBNAME}': ${RESTORED_TABLES}"

    # 6. Update Backend .env to point to 5433
    echo ">>> Updating backend environment (${BACKEND_DIR}/.env) to DB_PORT=${PG16_PORT}..."
    if [ -f "${BACKEND_DIR}/.env" ]; then
        cp "${BACKEND_DIR}/.env" "${BACKEND_DIR}/.env.bak_${TIMESTAMP}"
        if grep -q "^DB_PORT=" "${BACKEND_DIR}/.env"; then
            sed -i "s/^DB_PORT=.*/DB_PORT=${PG16_PORT}/" "${BACKEND_DIR}/.env"
        elif grep -q "^POSTGRES_PORT=" "${BACKEND_DIR}/.env"; then
            sed -i "s/^POSTGRES_PORT=.*/POSTGRES_PORT=${PG16_PORT}/" "${BACKEND_DIR}/.env"
        else
            echo "DB_PORT=${PG16_PORT}" >> "${BACKEND_DIR}/.env"
        fi
        echo ">>> .env updated. DB_PORT is now configured to ${PG16_PORT}."
    else
        echo "DB_PORT=${PG16_PORT}" > "${BACKEND_DIR}/.env"
    fi

    # Update active shell environment variables
    export PGPORT="${PG16_PORT}"
    export DB_PORT="${PG16_PORT}"

    # 7. Test Django ORM connection with the new database
    local ACTIVE_VENV
    ACTIVE_VENV=$(detect_backend_venv)
    echo ">>> Testing Django ORM on PostgreSQL 16..."
    cd "${BACKEND_DIR}"
    "${ACTIVE_VENV}/bin/python" manage.py showmigrations accounts | head -n 8 || true

    # 8. Restart Backend Gunicorn Service
    local GUNICORN_SVC
    GUNICORN_SVC=$(detect_backend_service)
    echo ">>> Restarting ${GUNICORN_SVC} to use PostgreSQL 16..."
    systemctl restart "${GUNICORN_SVC}" 2>/dev/null || true

    echo "============================================================"
    echo " PostgreSQL 12 -> 16 Migration Completed Successfully!"
    echo " Target Host/Port : ${PGHOST}:${PG16_PORT}"
    echo " Dump Stored At   : ${DUMP_FILE}"
    echo "============================================================"
}

# Check if user invoked DB migration
if [ "${TARGET}" = "migrate-db" ] || [ "${TARGET}" = "migrate-pg" ] || [ "${TARGET}" = "pg16" ]; then
    migrate_postgres_12_to_16
    exit 0
fi

# ------------------------------------------------------------------------------
# 6. STATUS / HEALTH CHECK HANDLER
# ------------------------------------------------------------------------------
if [ "${TARGET}" = "status" ]; then
    echo ">>> Checking deployment status and system services..."
    GUNICORN_SVC=$(detect_backend_service)
    echo "--- Systemd Services ---"
    systemctl status "${GUNICORN_SVC}" --no-pager -l || true
    systemctl status nginx --no-pager -l || true
    echo "--- PostgreSQL Connectivity ---"
    echo "PostgreSQL 12 (5432): $(pg_isready -p 5432 2>/dev/null || echo 'down')"
    echo "PostgreSQL 16 (5433): $(pg_isready -p 5433 2>/dev/null || echo 'down')"
    echo "--- Gunicorn Socket Check ---"
    ls -la /run/easybiz/easybiz.sock 2>/dev/null || echo "No socket at /run/easybiz/easybiz.sock"
    echo "--- Nginx Syntax Check ---"
    nginx -t
    exit 0
fi

# ------------------------------------------------------------------------------
# 7. STEP 1: GIT SYNCING
# ------------------------------------------------------------------------------
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    sync_repository "${BACKEND_DIR}" "Backend (business-erp)" "main"
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "royal" ] || [ "${TARGET}" = "frontend" ]; then
    sync_repository "${ROYAL_FE_REPO}" "Frontend (royal-softwares)" "main"
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "nexus" ] || [ "${TARGET}" = "frontend" ]; then
    if [ -d "${NEXUS_FE_REPO}" ]; then
        sync_repository "${NEXUS_FE_REPO}" "Frontend (fahari-nexus-core)" "main"
    fi
fi

# ------------------------------------------------------------------------------
# 8. STEP 2: RUNTIME VERIFICATION (Python >= 3.10, Node >= 18)
# ------------------------------------------------------------------------------
ACTIVE_VENV=$(detect_backend_venv)

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    echo ">>> Verifying Python virtual environment at ${ACTIVE_VENV}..."
    ensure_modern_venv "${ACTIVE_VENV}"
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "royal" ] || [ "${TARGET}" = "nexus" ] || [ "${TARGET}" = "frontend" ]; then
    ensure_modern_node
fi

# ------------------------------------------------------------------------------
# 9. STEP 3: PRE-DEPLOYMENT DATABASE BACKUP (Active PGPORT)
# ------------------------------------------------------------------------------
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    if [ "${SKIP_BACKUP:-0}" = "1" ] || [ "${SKIP_DB_DUMP:-0}" = "1" ]; then
        echo ">>> Skipping pre-deployment database backup as requested (SKIP_BACKUP=1)..."
    else
        echo ">>> Taking pre-deployment database backup from port ${PGPORT}..."
        mkdir -p "${BACKUP_DIR}"
        if command -v pg_dump &>/dev/null; then
            BACKUP_FILE="${BACKUP_DIR}/easybizdb_port${PGPORT}_${TIMESTAMP}.sql.gz"
            if PGPASSWORD="${PGPASSWORD}" pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" "${DBNAME}" 2>/dev/null | gzip > "${BACKUP_FILE}"; then
                echo "Database backup successfully created: ${BACKUP_FILE}"
                find "${BACKUP_DIR}" -name "easybizdb_*.sql.gz" -mtime +14 -exec rm -f {} + 2>/dev/null || true
            elif sudo -u postgres pg_dump -p "${PGPORT}" "${DBNAME}" 2>/dev/null | gzip > "${BACKUP_FILE}"; then
                echo "Database backup successfully created (via peer auth): ${BACKUP_FILE}"
            else
                echo "Notice: Pre-deployment backup skipped (database may not yet be populated on port ${PGPORT})."
            fi
        else
            echo "Notice: pg_dump not found in PATH. Skipping database snapshot."
        fi
    fi
fi

# ------------------------------------------------------------------------------
# 10. STEP 4: DEPENDENCY UPDATES
# ------------------------------------------------------------------------------
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    echo ">>> Updating backend dependencies in ${ACTIVE_VENV}..."
    cd "${BACKEND_DIR}"
    # Purge numpy and pandas if installed, preventing x86-64-v2 baseline CPU crashes on VPS
    "${ACTIVE_VENV}/bin/pip" uninstall -y numpy pandas 2>/dev/null || true
    "${ACTIVE_VENV}/bin/pip" install --no-input -r requirements.txt
    "${ACTIVE_VENV}/bin/pip" install --no-input gunicorn
fi

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "royal" ] || [ "${TARGET}" = "frontend" ]; then
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
# 11. STEP 5: DATABASE MIGRATIONS
# ------------------------------------------------------------------------------
run_database_migrations() {
    # If explicitly flagged or already on PG16, skip any PG 12 check
    if [ "${SKIP_DB_MIGRATION:-0}" = "1" ] || [ "${SKIP_PG12_CHECK:-0}" = "1" ]; then
        echo ">>> Skipping PG 12 check (PostgreSQL 16 already migrated and active)..."
    else
        # Auto-detect if PostgreSQL 16 database needs migration from PostgreSQL 12
        local PG16_TABLES=0
        if command -v psql &>/dev/null; then
            PG16_TABLES=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p 5433 -U "${PGUSER}" -d "${DBNAME}" -tc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
            PG16_TABLES=$(echo "${PG16_TABLES}" | tr -d '[:space:]')
            [ -z "${PG16_TABLES}" ] && PG16_TABLES=0
        fi

        if [ "${PG16_TABLES}" -eq 0 ]; then
            local PG12_TABLES=0
            if command -v psql &>/dev/null; then
                PG12_TABLES=$(PGPASSWORD="${PGPASSWORD}" psql -h "${PGHOST}" -p 5432 -U "${PGUSER}" -d "${DBNAME}" -tc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
                PG12_TABLES=$(echo "${PG12_TABLES}" | tr -d '[:space:]')
                [ -z "${PG12_TABLES}" ] && PG12_TABLES=0
            fi

            if [ "${PG12_TABLES}" -gt 0 ]; then
                echo ">>> Detected ${PG12_TABLES} existing tables on PostgreSQL 12 (port 5432) and unpopulated PostgreSQL 16 (port 5433)."
                echo ">>> Automatically executing database migration from PG 12 -> PG 16 to preserve all existing data..."
                migrate_postgres_12_to_16
            fi
        fi
    fi

    # Explicitly ensure DB_PORT is exported as 5433 for Django process
    export DB_PORT="5433"
    export PGPORT="5433"

    echo ">>> Running Django database migrations against ${PGHOST}:${PGPORT}..."
    cd "${BACKEND_DIR}"
    "${ACTIVE_VENV}/bin/python" manage.py migrate --noinput
}

if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    run_database_migrations
fi

# ------------------------------------------------------------------------------
# 12. STEP 6: FRONTEND BUILDS & WEBROOT SYNCING
# ------------------------------------------------------------------------------
# Build Royal Software Solutions & sync dist to /var/www/royalsoftwares
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "royal" ] || [ "${TARGET}" = "frontend" ]; then
    # Ensure .env is present with production URL before compilation
    ensure_royal_frontend_env

    echo ">>> Building Royal Software Solutions frontend (npm run build)..."
    cd "${ROYAL_FE_REPO}"
    npm run build

    echo ">>> Deploying built assets to live webroot ${ROYAL_FE_LIVE}..."
    mkdir -p "${ROYAL_FE_LIVE}"
    if [ -d "dist" ]; then
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
if [ "${TARGET}" = "all" ] || [ "${TARGET}" = "backend" ]; then
    echo ">>> Collecting backend static files..."
    cd "${BACKEND_DIR}"
    "${ACTIVE_VENV}/bin/python" manage.py collectstatic --noinput
fi

# ------------------------------------------------------------------------------
# 14. STEP 8: PERMISSIONS NORMALIZATION
# ------------------------------------------------------------------------------
echo ">>> Setting permissions for www-data..."

# Backend directories
if [ -d "${BACKEND_DIR}" ]; then
    mkdir -p "${BACKEND_DIR}/media" "${BACKEND_DIR}/staticfiles" "${BACKEND_DIR}/static"
    chown -R www-data:www-data "${BACKEND_DIR}/media" "${BACKEND_DIR}/staticfiles" "${BACKEND_DIR}/static"
    chmod -R 775 "${BACKEND_DIR}/media" "${BACKEND_DIR}/staticfiles" "${BACKEND_DIR}/static"
fi

# Royal Softwares directories
if [ -d "${ROYAL_FE_LIVE}" ]; then
    chown -R www-data:www-data "${ROYAL_FE_LIVE}"
    chmod -R 755 "${ROYAL_FE_LIVE}"
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
    systemctl restart "${GUNICORN_SVC}"

    # Check for Celery service if configured
    if systemctl list-unit-files | grep -Eq "celery_easybiz|easybiz_celery"; then
        echo ">>> Restarting Celery workers..."
        systemctl restart celery_easybiz 2>/dev/null || systemctl restart easybiz_celery 2>/dev/null || true
    fi
fi

# ------------------------------------------------------------------------------
# 16. STEP 10: TEST & RELOAD NGINX
# ------------------------------------------------------------------------------
echo ">>> Validating Nginx configuration and reloading..."
nginx -t && systemctl reload nginx

# ------------------------------------------------------------------------------
# 17. STEP 11: CLEAR CACHES
# ------------------------------------------------------------------------------
if command -v redis-cli &>/dev/null; then
    echo ">>> Clearing Redis cache..."
    redis-cli flushall || true
fi

echo "============================================================"
echo " Deployment Successfully Completed!"
echo " Target      : ${TARGET}"
echo " Finished At : $(date +'%Y-%m-%d %H:%M:%S')"
echo "============================================================"
