# Lightweight Alpine-based Terraform DevOps container for GCP deployments
# This container includes Terraform, gcloud CLI, and Docker CLI for complete deployment automation

FROM alpine:3.19

# Set versions as build arguments for easy updates
ARG TERRAFORM_VERSION=1.7.0
ARG GCLOUD_VERSION=455.0.0

# Set labels for container metadata
LABEL maintainer="Next Fractals DevOps"
LABEL description="Terraform deployment container for GCP Cloud Run"
LABEL terraform.version=${TERRAFORM_VERSION}
LABEL gcloud.version=${GCLOUD_VERSION}

# Install base dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    gnupg \
    jq \
    openssh-client \
    python3 \
    py3-pip \
    docker-cli \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Install Terraform
RUN cd /tmp && \
    curl -sSL https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip -o terraform.zip && \
    unzip terraform.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform.zip && \
    terraform version

# Install Google Cloud SDK
# Using Python-based installation for Alpine compatibility
RUN curl -sSL https://sdk.cloud.google.com | bash -s -- \
    --disable-prompts \
    --install-dir=/opt && \
    rm -rf /opt/google-cloud-sdk/.install/.backup

# Add gcloud to PATH
ENV PATH="/opt/google-cloud-sdk/bin:${PATH}"

# Install additional gcloud components
RUN gcloud components install \
    gke-gcloud-auth-plugin \
    alpha \
    beta \
    --quiet

# Create a non-root user for running commands
RUN addgroup -g 1000 tfuser && \
    adduser -D -u 1000 -G tfuser tfuser && \
    mkdir -p /workspace /home/tfuser/.config/gcloud && \
    chown -R tfuser:tfuser /workspace /home/tfuser

# Set up workspace directory
WORKDIR /workspace

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER tfuser

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default command shows help
CMD []