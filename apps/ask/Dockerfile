# syntax=docker/dockerfile:1

# The service behind the Ask AI panel, over HTTP at /api/ask, with the docs
# it answers from built in. It reads the docs the way the MCP server does,
# with its code, so it's built from the root of the repository:
#
#   docker build --file apps/ask/Dockerfile --tag nuvui-ask .
#
# Each base image is named by its digest, as in apps/Dockerfile, so that a
# tag moved to other contents can't change what's built. apps/ask/README.md
# has what it needs to run.

# pnpm from its release on GitHub, checked against the sums it lists, as
# in apps/Dockerfile: Node 25 and later come without Corepack.
FROM scratch AS pnpm-amd64
ADD --checksum=sha256:9705e5704b4679fb503c963a18d1ac4f105e39aafafca8a2ed346facdf820cd0 \
    https://github.com/pnpm/pnpm/releases/download/v12.3.4/pnpm-linux-x64.tar.gz /pnpm.tar.gz

FROM scratch AS pnpm-arm64
ADD --checksum=sha256:95e71a2a30bbc0b77511f95cf096779068dcad6ffcbbfdf0cd4dde9de2b2b97c \
    https://github.com/pnpm/pnpm/releases/download/v12.3.4/pnpm-linux-arm64.tar.gz /pnpm.tar.gz

FROM pnpm-$BUILDARCH AS pnpm

# The build runs on the machine's own architecture. What it makes is
# JavaScript and JSON, and no dependency of the service has a native part,
# so the same files run on either.
FROM --platform=$BUILDPLATFORM node:26.12.1-bookworm-slim@sha256:28147155d47dc31abe0a46e0d12b59b2fb3d0a2dcc5dc65fce76a074180b16fe AS build

ENV CI=true \
    TURBO_TELEMETRY_DISABLED=1 \
    PATH=/opt/pnpm:$PATH

WORKDIR /repo

# The binary needs the dist folder beside it, so both stay in /opt/pnpm.
RUN --mount=from=pnpm,source=/pnpm.tar.gz,target=/tmp/pnpm.tar.gz \
    mkdir /opt/pnpm && tar -xzf /tmp/pnpm.tar.gz -C /opt/pnpm

# The lockfile alone decides what's downloaded, so this layer is reused
# until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --frozen-lockfile --offline --filter "@nuvui/ask..."
RUN pnpm --filter @nuvui/ask build

# The service's own files and its production dependencies, and nothing of
# the rest of the workspace. Not offline: pnpm reads each package's
# metadata again, to check its age against the workspace's policy.
RUN pnpm --filter @nuvui/ask deploy --prod /deploy

FROM node:26.12.1-bookworm-slim@sha256:28147155d47dc31abe0a46e0d12b59b2fb3d0a2dcc5dc65fce76a074180b16fe

# What to call this build in its traces, such as the commit.
ARG SERVICE_VERSION=""
ENV NODE_ENV=production \
    PORT=8080 \
    METRICS_PORT=9464 \
    SERVICE_VERSION=$SERVICE_VERSION

WORKDIR /app
COPY --from=build /deploy ./

# The image's own user that isn't root, by number: Kubernetes can't tell
# that a name isn't root. It writes nothing, so the root filesystem can be
# read-only.
USER 1000

# The API, and the counts for Prometheus.
EXPOSE 8080 9464
ENTRYPOINT ["node", "dist/main.mjs"]
