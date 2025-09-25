# Local Development Guide

Complete guide for developing and testing Next Fractals locally using various approaches.

## Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- Docker (for containerized development)
- Git

---

## Option 1: Native Node.js Development

### 1.1 Install Dependencies

```bash
# Navigate to project root
cd nextjs-tf-gcp-demo

# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

### 1.2 Development Server

```bash
# Start development server with hot reload
npm run dev

# Access the application
open http://localhost:3000
```

The development server includes:
- **Hot reload** - Changes appear instantly
- **Error overlay** - Compilation errors shown in browser
- **Fast refresh** - React state preserved during edits

### 1.3 Build and Test Production Build

```bash
# Create production build
npm run build

# Start production server
npm run start

# Access production build
open http://localhost:3000
```

### 1.4 Code Quality Checks

```bash
# Run ESLint
npm run lint

# Fix auto-fixable ESLint issues
npm run lint -- --fix

# Run TypeScript type checking
npx tsc --noEmit

# Format code with Prettier
npm run format
```

### 1.5 Development Workflow

```bash
# 1. Start development server
npm run dev

# 2. Make code changes in your editor
# 3. View changes at http://localhost:3000
# 4. Run quality checks before committing
npm run lint && npx tsc --noEmit

# 5. Build and test production version
npm run build && npm run start
```

---

## Option 2: Containerized Application Development

### 2.1 Build Application Docker Image

```bash
# Build the Next.js application container
docker build -t next-fractals:dev .

# Verify image was created
docker images | grep next-fractals
```

### 2.2 Run Application Container

```bash
# Run container on port 3000
docker run -p 3000:3000 next-fractals:dev

# Run in background (detached mode)
docker run -d -p 3000:3000 --name next-fractals-container next-fractals:dev

# Access the application
open http://localhost:3000
```

### 2.3 Container Development Workflow

```bash
# 1. Make code changes
# 2. Rebuild image
docker build -t next-fractals:dev .

# 3. Stop existing container
docker stop next-fractals-container
docker rm next-fractals-container

# 4. Run new container
docker run -d -p 3000:3000 --name next-fractals-container next-fractals:dev

# 5. Test changes
open http://localhost:3000
```

### 2.4 Container Management

```bash
# View running containers
docker ps

# View container logs
docker logs next-fractals-container

# Follow logs in real-time
docker logs -f next-fractals-container

# Stop container
docker stop next-fractals-container

# Remove container
docker rm next-fractals-container

# Remove image
docker rmi next-fractals:dev
```

---

## Option 3: TF-DevOps Container Development

### 3.1 Build TF-DevOps Container

```bash
# Build the deployment container
./deploy.sh build

# Alternative direct build
docker build -f tf-devops/Dockerfile -t tf-devops:latest ./tf-devops

# Verify image was created
docker images | grep tf-devops
```

### 3.2 Interactive Container Shell

```bash
# Start interactive bash session in container
./deploy.sh shell

# Alternative direct command
docker run -it --rm \
  -v $(pwd):/workspace \
  -v ~/.config/gcloud:/home/tfuser/.config/gcloud \
  tf-devops:latest bash
```

### 3.3 Container Environment

Once inside the container, you have access to:

```bash
# Check available tools
terraform --version
gcloud --version
docker --version

# Navigate to project
cd /workspace

# View project structure
ls -la

# Run terraform commands
terraform init
terraform validate
terraform plan

# Run gcloud commands
gcloud auth list
gcloud projects list
```

### 3.4 Running Commands in Container

```bash
# Run single commands without entering shell
./deploy.sh run terraform --version
./deploy.sh run gcloud auth list
./deploy.sh run ls -la /workspace

# Multiple commands
./deploy.sh run bash -c "terraform init && terraform validate"
```

### 3.5 Container Development Workflow

```bash
# 1. Build container
./deploy.sh build

# 2. Start interactive session
./deploy.sh shell

# 3. Inside container - work with terraform/gcloud
terraform init
terraform plan
gcloud projects describe $GCP_PROJECT

# 4. Exit container
exit

# 5. Rebuild after changes to tf-devops/
./deploy.sh build
```

---

## Development Tips and Best Practices

### File Watching and Hot Reload

**Native Development:**
- Use `npm run dev` for automatic reloading
- Changes to pages trigger fast refresh
- Changes to components preserve React state

**Container Development:**
- Requires rebuilding image for code changes
- Consider volume mounting for development:
  ```bash
  docker run -p 3000:3000 -v $(pwd):/app next-fractals:dev
  ```

### Environment Variables

**Setup Local Environment:**
```bash
# Copy the example file to create your local environment
cp .env.local.example .env.local

# Edit .env.local with your values
# Required for deployment commands:
#   - GCP_PROJECT: Your GCP project ID
#   - GCP_REGION: GCP region (defaults to us-central1)
# Optional:
#   - GOOGLE_APPLICATION_CREDENTIALS: Path to service account key file
#   - Other app-specific variables

# Never commit .env.local (it's gitignored)
```

**Load Environment Variables:**
```bash
# Next.js automatically loads .env.local during development
npm run dev

# For deployment commands, source the file first:
export $(cat .env.local | grep -v '^#' | xargs)

# Then run deployment commands
./deploy.sh plan
./deploy.sh apply
```

**Container Development:**
```bash
# Pass environment variables to container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_APP_NAME="Next Fractals Container" \
  next-fractals:dev

# Or use env file with Docker
docker run -p 3000:3000 --env-file .env.local next-fractals:dev
```

### Performance Optimization

**Development Mode:**
- Slower than production (includes dev tools)
- Use for development only
- Hot reload affects performance

**Production Mode:**
- Optimized build with minification
- Use for performance testing
- Run `npm run build` then `npm run start`

### Debugging

**Native Development:**
```bash
# Enable Next.js debug mode
DEBUG=* npm run dev

# Enable specific debug namespaces
DEBUG=next:* npm run dev
```

**Container Debugging:**
```bash
# Run container with debug output
docker run -p 3000:3000 -e DEBUG=* next-fractals:dev

# Access container shell for debugging
docker exec -it next-fractals-container bash
```

---

## Troubleshooting

### Common Issues

**Node.js Version:**
```bash
# Check Node.js version (requires 18.0+)
node --version

# Use nvm to switch versions
nvm use 18
```

**Port Conflicts:**
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process using port 3000
kill -9 $(lsof -t -i:3000)

# Use different port
npm run dev -- -p 3001
```

**Docker Issues:**
```bash
# Clean up Docker resources
docker system prune

# Remove all containers and images
docker rm -f $(docker ps -aq)
docker rmi -f $(docker images -q)
```

**Permission Issues:**
```bash
# Fix npm permissions (if needed)
sudo chown -R $(whoami) ~/.npm

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
```

### Container Environment Issues

**TF-DevOps Container:**
```bash
# Check container has access to files
./deploy.sh run ls -la /workspace

# Verify gcloud auth
./deploy.sh run gcloud auth list

# Check environment variables
./deploy.sh run env | grep GCP
```

**Volume Mounting Issues:**
```bash
# Ensure correct paths (use absolute paths)
docker run -v /absolute/path/to/project:/workspace tf-devops:latest

# Check Docker has access to directories
# On macOS: Docker Desktop → Settings → Resources → File Sharing
```

---

## Testing Different Scenarios

### Test Production Build Locally

```bash
# 1. Build production version
npm run build

# 2. Start production server
npm run start

# 3. Test performance and functionality
open http://localhost:3000
```

### Test Docker Container

```bash
# 1. Build container
docker build -t next-fractals:test .

# 2. Run container
docker run -p 3000:3000 next-fractals:test

# 3. Test container behavior
curl http://localhost:3000
```

### Test Deployment Tools

```bash
# 1. Build tf-devops container
./deploy.sh build

# 2. Test terraform commands
./deploy.sh run terraform --version

# 3. Test gcloud commands (requires auth)
./deploy.sh run gcloud projects list
```

---

## Advanced Development

### Custom Docker Development Setup

```dockerfile
# Create Dockerfile.dev for development
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

```bash
# Use development Dockerfile
docker build -f Dockerfile.dev -t next-fractals:dev-hot .
docker run -p 3000:3000 -v $(pwd):/app next-fractals:dev-hot
```

### Multi-Stage Development

```bash
# Build development image
docker build --target development -t next-fractals:dev .

# Build production image
docker build --target production -t next-fractals:prod .
```

---

**🔧 Choose the development approach that best fits your workflow and requirements!**

- **Native Node.js**: Fastest development with hot reload
- **Application Container**: Test containerized behavior
- **TF-DevOps Container**: Test deployment tools and infrastructure