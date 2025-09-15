# Google Cloud Platform Setup Guide

Complete guide to setting up a new GCP account and authentication for deploying Next Fractals.

## 📚 Related Documentation
- **[⬅️ Back to Main Project](../README.md)** - Next Fractals overview
- **[🚀 Terraform Deployment](../terraform/README.md)** - Infrastructure deployment
- **[🐳 TF-DevOps Container](../tf-devops/README.md)** - Deployment toolkit

---

## Step 1: Create Google Cloud Account

### 1.1 Sign Up for GCP

1. **Visit Google Cloud**: Go to [cloud.google.com](https://cloud.google.com)
2. **Click "Get started for free"**
3. **Sign in with Google account** (or create one if needed)
4. **Accept terms** and provide your information
5. **Add payment method** (required, but you get $300 free credits)

> **💡 Free Tier**: New accounts get $300 in credits valid for 90 days, plus Always Free tier resources.

### 1.2 Verify Your Account

1. **Phone verification** may be required
2. **Credit card verification** (no charges during free trial)
3. **Wait for account activation** (usually instant)

---

## Step 2: Create a New Project

### 2.1 Create Project via Console

1. **Go to [console.cloud.google.com](https://console.cloud.google.com)**
2. **Click the project selector** (top left, next to "Google Cloud")
3. **Click "NEW PROJECT"**
4. **Configure your project**:
   - **Project name**: `next-fractals` (or your preference)
   - **Project ID**: Will be auto-generated (note this down!)
   - **Organization**: Leave as "No organization" for personal projects
5. **Click "CREATE"**

### 2.2 Note Your Project ID

Your project ID will look like: `next-fractals-123456`

**Important**: Save this Project ID - you'll need it for deployment!

```bash
# You'll use this later
export GCP_PROJECT="your-project-id-here"
```

---

## Step 3: Enable Billing

### 3.1 Link Billing Account

1. **Go to [Billing](https://console.cloud.google.com/billing)**
2. **Select your project**
3. **Link a billing account** (uses your free credits first)
4. **Verify billing is enabled** for your project

> **💰 Cost Estimate**: Next Fractals typically costs $1-5/month with minimal traffic due to Cloud Run's scale-to-zero pricing.

---

## Step 4: Enable Required APIs

### 4.1 Enable APIs Manually (Optional)

The Terraform deployment will enable these automatically, but you can do it manually:

1. **Go to [APIs & Services](https://console.cloud.google.com/apis)**
2. **Click "ENABLE APIS AND SERVICES"**
3. **Search and enable**:
   - Cloud Run API
   - Artifact Registry API  
   - Cloud Build API (if using CI/CD)
   - Container Registry API

### 4.2 Or Let Terraform Handle It

The tf-devops container will automatically enable required APIs when you run `terraform apply`.

---

## Step 5: Set Up Authentication

Choose one of these authentication methods:

### Method 1: Interactive Login (Recommended for Development)

**Easiest for getting started:**

```bash
# Install Google Cloud CLI (if not using tf-devops container)
# MacOS:
brew install --cask google-cloud-sdk

# Or use our container which includes gcloud:
./deploy.sh auth
```

This opens a browser for Google OAuth login.

### Method 2: Service Account (Recommended for Production/CI)

**Better for automation and CI/CD:**

#### 2.1 Create Service Account

1. **Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)**
2. **Click "CREATE SERVICE ACCOUNT"**
3. **Configure account**:
   - **Name**: `next-fractals-deploy`
   - **Description**: `Service account for deploying Next Fractals`
4. **Click "CREATE AND CONTINUE"**

#### 2.2 Grant Permissions

Add these roles to your service account:

**Required roles:**
- Cloud Run Admin
- Artifact Registry Administrator  
- Service Account User
- Storage Admin (for Terraform state, if using GCS backend)

**Optional (for CI/CD):**
- Cloud Build Editor
- Source Repository Administrator

1. **In the roles section, click "ADD ANOTHER ROLE"**
2. **Add each role listed above**
3. **Click "CONTINUE" then "DONE"**

#### 2.3 Create and Download Key

1. **Click on your new service account**
2. **Go to "KEYS" tab**
3. **Click "ADD KEY" > "Create new key"**
4. **Choose "JSON" format**
5. **Click "CREATE"**
6. **Save the downloaded JSON file securely**

#### 2.4 Use Service Account Key

```bash
# Option A: Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"

# Option B: Pass key content directly (for CI/CD)
export GOOGLE_CREDENTIALS='{"type":"service_account",...}'

# Then deploy
./deploy.sh build
./deploy.sh deploy
```

---

## Step 6: Configure Your Project

### 6.1 Set Environment Variables

```bash
# Required: Your project ID (from Step 2)
export GCP_PROJECT="your-project-id-here"

# Optional: Choose your region (default: us-central1)
export GCP_REGION="us-central1"  # or us-east1, europe-west1, etc.
```

### 6.2 Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# Required
project_id = "your-project-id-here"
region     = "us-central1"

# Optional customizations
app_name           = "next-fractals"
cpu_limit          = "1"
memory_limit       = "512Mi"
min_instances      = 0
max_instances      = 10
allow_unauthenticated = true
```

---

## Step 7: Test Your Setup

### 7.1 Verify Authentication

```bash
# Using tf-devops container
./deploy.sh run gcloud auth list

# Should show your authenticated account
```

### 7.2 Verify Project Access

```bash
# Check project info
./deploy.sh run gcloud projects describe $GCP_PROJECT

# List enabled services
./deploy.sh run gcloud services list --enabled
```

### 7.3 Deploy Next Fractals

```bash
# Build deployment container
./deploy.sh build

# Deploy everything (this will take 5-10 minutes)
./deploy.sh deploy

# Get the URL of your deployed app
./deploy.sh output service_url
```

---

## Troubleshooting

### Common Issues

#### "Project not found" Error
- Verify your project ID is correct
- Ensure billing is enabled
- Check you're authenticated with the right account

#### "Permission denied" Error  
- Verify your account has the required IAM roles
- For service accounts, ensure the key file is valid
- Check that APIs are enabled

#### "Billing account required" Error
- Link a billing account to your project
- Verify billing is enabled in the console

#### "Quota exceeded" Error
- New accounts have lower quotas initially
- Request quota increases if needed
- Try a different region

### Getting Help

1. **Check logs**: `./deploy.sh run gcloud logging read`
2. **Verify setup**: Use the test commands in Step 7
3. **GCP Status**: Check [status.cloud.google.com](https://status.cloud.google.com)
4. **Documentation**: [cloud.google.com/docs](https://cloud.google.com/docs)

### Cost Management

1. **Set up billing alerts**: [console.cloud.google.com/billing/budgets](https://console.cloud.google.com/billing/budgets)
2. **Monitor usage**: [console.cloud.google.com/monitoring](https://console.cloud.google.com/monitoring)
3. **Clean up resources**: `./deploy.sh destroy` when done testing

---

## Security Best Practices

### For Development
- Use interactive login (`gcloud auth login`)
- Regularly rotate credentials
- Use least-privilege IAM roles

### For Production
- Use service accounts with minimal permissions
- Store keys securely (never in code repositories)
- Enable audit logging
- Use Cloud KMS for additional secrets

### For CI/CD
- Store service account keys in secure CI variables
- Use workload identity when possible
- Rotate keys regularly
- Monitor service account usage

---

## Next Steps

Once your GCP setup is complete:

1. **Deploy the application**: Follow the [deployment guide](../terraform/README.md)
2. **Customize settings**: Edit Terraform variables for your needs
3. **Set up monitoring**: Configure Cloud Monitoring and Logging
4. **Domain setup**: Add a custom domain if desired
5. **CI/CD**: Set up automated deployments with GitHub Actions

**🎉 You're ready to deploy Next Fractals to Google Cloud!**