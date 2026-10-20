#!/usr/bin/env bash
# One-time Google Cloud setup for Plinth's live HARERA job (SETUP_FOR_FOUNDER 4.3).
#
# What it creates, all in asia-south1 (Mumbai, so fetches leave from an Indian IP):
#   - a project linked to your billing account, with the APIs the job needs
#   - an Artifact Registry repo for the pipeline container
#   - two service accounts: plinth-deployer (GitHub Actions deploys with it) and
#     plinth-pipelines (the job runs as it)
#   - Workload Identity Federation, so GitHub Actions in gauravmittal1234/plinth
#     can deploy without any JSON key
#   - a monthly budget alert, if your account allows it
# Then it stores the four non-secret IDs as GitHub secrets for this repo.
#
# Run it yourself, once, after:
#   1. a billing account exists (console.cloud.google.com/billing)
#   2. gcloud auth login            (opens your browser)
#   3. gh auth status               (already signed in for this repo)
#
# Usage:
#   bash scripts/gcp/bootstrap.sh <project-id> <billing-account-id> [budget, e.g. 4000INR]
#   (billing account id: gcloud billing accounts list)
#
# Safe to re-run: every step checks before creating. It never prints or stores keys.
set -euo pipefail

PROJECT="${1:?usage: bootstrap.sh <project-id> <billing-account-id> [budget]}"
BILLING="${2:?usage: bootstrap.sh <project-id> <billing-account-id> [budget]}"
BUDGET="${3:-4000INR}"
REGION="asia-south1"
GH_REPO="gauravmittal1234/plinth"
AR_REPO="plinth"
DEPLOYER="plinth-deployer"
RUNTIME="plinth-pipelines"
POOL="github"
PROVIDER="plinth-repo"

step() { printf '\n== %s\n' "$*"; }

step "Project $PROJECT"
gcloud projects describe "$PROJECT" >/dev/null 2>&1 || gcloud projects create "$PROJECT" --name="Plinth"
gcloud billing projects link "$PROJECT" --billing-account="$BILLING" >/dev/null
gcloud config set project "$PROJECT" >/dev/null
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"

step "APIs"
gcloud services enable \
  run.googleapis.com cloudscheduler.googleapis.com artifactregistry.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  secretmanager.googleapis.com billingbudgets.googleapis.com

step "Artifact Registry ($REGION/$AR_REPO)"
gcloud artifacts repositories describe "$AR_REPO" --location="$REGION" >/dev/null 2>&1 ||
  gcloud artifacts repositories create "$AR_REPO" --repository-format=docker \
    --location="$REGION" --description="Plinth containers"

step "Service accounts"
for sa in "$DEPLOYER" "$RUNTIME"; do
  gcloud iam service-accounts describe "$sa@$PROJECT.iam.gserviceaccount.com" >/dev/null 2>&1 ||
    gcloud iam service-accounts create "$sa" --display-name="$sa"
done
DEPLOYER_EMAIL="$DEPLOYER@$PROJECT.iam.gserviceaccount.com"
RUNTIME_EMAIL="$RUNTIME@$PROJECT.iam.gserviceaccount.com"

step "Roles"
bind() { gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$1" --role="$2" --condition=None >/dev/null; }
bind "$DEPLOYER_EMAIL" roles/run.admin
bind "$DEPLOYER_EMAIL" roles/artifactregistry.writer
bind "$DEPLOYER_EMAIL" roles/cloudscheduler.admin
bind "$RUNTIME_EMAIL" roles/secretmanager.secretAccessor
bind "$RUNTIME_EMAIL" roles/run.invoker
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_EMAIL" \
  --member="serviceAccount:$DEPLOYER_EMAIL" --role=roles/iam.serviceAccountUser >/dev/null

step "Workload Identity Federation (GitHub Actions, $GH_REPO only)"
gcloud iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1 ||
  gcloud iam workload-identity-pools create "$POOL" --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers describe "$PROVIDER" --location=global \
  --workload-identity-pool="$POOL" >/dev/null 2>&1 ||
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --location=global \
    --workload-identity-pool="$POOL" --display-name="plinth repo" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
    --attribute-condition="assertion.repository=='$GH_REPO'"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_EMAIL" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository/$GH_REPO" >/dev/null
WIF_PROVIDER="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/providers/$PROVIDER"

step "Budget alert ($BUDGET a month; alerts at 50%, 90%, 100%)"
if gcloud billing budgets list --billing-account="$BILLING" --format='value(displayName)' 2>/dev/null | grep -qx "Plinth $PROJECT"; then
  echo "already set"
elif ! gcloud billing budgets create --billing-account="$BILLING" --display-name="Plinth $PROJECT" \
  --budget-amount="$BUDGET" --filter-projects="projects/$PROJECT" \
  --threshold-rule=percent=0.5 --threshold-rule=percent=0.9 --threshold-rule=percent=1.0 >/dev/null; then
  echo "Skipped: set a budget by hand at console.cloud.google.com/billing/budgets (the amount must be in your billing account's currency)."
fi

step "GitHub secrets for $GH_REPO (IDs only, nothing secret)"
gh secret set GCP_PROJECT_ID --repo "$GH_REPO" --body "$PROJECT"
gh secret set GCP_REGION --repo "$GH_REPO" --body "$REGION"
gh secret set GCP_WIF_PROVIDER --repo "$GH_REPO" --body "$WIF_PROVIDER"
gh secret set GCP_SERVICE_ACCOUNT --repo "$GH_REPO" --body "$DEPLOYER_EMAIL"

cat <<EOF

Done. GitHub now has:
  GCP_PROJECT_ID      = $PROJECT
  GCP_REGION          = $REGION
  GCP_WIF_PROVIDER    = $WIF_PROVIDER
  GCP_SERVICE_ACCOUNT = $DEPLOYER_EMAIL
The job will run as $RUNTIME_EMAIL. Live fetch stays off until you set
HARERA_LIVE_FETCH_APPROVED=yes on the job (SETUP_FOR_FOUNDER 1.4).
EOF
