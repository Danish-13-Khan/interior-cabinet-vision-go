# Cycles render service: Blender 4.2 LTS + the repo's runner behind scripts/cycles/serve.mjs.
# Build from the repo root (after `git lfs pull`, so render-sources holds real PNGs):
#   docker build -f docker/cycles/Dockerfile -t cabinet-cycles .
#   docker run --rm -p 8787:8787 -v cycles-jobs:/jobs cabinet-cycles
# Same image runs on a laptop, a shop PC, or an EC2 box. For a GPU instance use the
# NVIDIA container runtime and add `--gpus all`; CPU-only renders work without it.
FROM ubuntu:24.04

ARG BLENDER_SERIES=4.2
ARG BLENDER_VERSION=4.2.3
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl xz-utils nodejs npm \
      libx11-6 libxi6 libxrender1 libxkbcommon0 libxxf86vm1 libxfixes3 libsm6 libgl1 libegl1 libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL "https://download.blender.org/release/Blender${BLENDER_SERIES}/blender-${BLENDER_VERSION}-linux-x64.tar.xz" \
      | tar -xJ -C /opt \
    && ln -s "/opt/blender-${BLENDER_VERSION}-linux-x64/blender" /usr/local/bin/blender \
    && blender --version

WORKDIR /app
COPY package.json ./
COPY scripts/cycles ./scripts/cycles
COPY render-sources ./render-sources
COPY public/environments ./public/environments
COPY public/models ./public/models

ENV BLENDER=/usr/local/bin/blender \
    PORT=8787 \
    CYCLES_JOBS_DIR=/jobs
VOLUME ["/jobs"]
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD curl -fsS http://localhost:8787/health || exit 1
CMD ["node", "scripts/cycles/serve.mjs"]
