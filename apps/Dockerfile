# syntax=docker/dockerfile:1

# The whole site in one image: the website at / and the docs at /docs, as
# the plain files `pnpm build` writes to apps/showcase/out, behind nginx.
#
# Build it from the root of the repository, which is what both apps need
# around them:
#
#   docker build --file apps/Dockerfile --tag nuvui-site .
#   docker run --rm --publish 8080:8080 nuvui-site
#
# Each base image is named by its digest, so that a tag moved to other
# contents can't change what's built. Dependabot proposes the next one.

# pnpm, the version packageManager in package.json names, from its release
# on GitHub. Node 25 and later come without Corepack. ADD checks each file
# against the sha256 the release lists, so a bump changes the version and
# both sums together. There's one for each architecture a build runs on.
FROM scratch AS pnpm-amd64
ADD --checksum=sha256:9705e5704b4679fb503c963a18d1ac4f105e39aafafca8a2ed346facdf820cd0 \
    https://github.com/pnpm/pnpm/releases/download/v12.3.4/pnpm-linux-x64.tar.gz /pnpm.tar.gz

FROM scratch AS pnpm-arm64
ADD --checksum=sha256:95e71a2a30bbc0b77511f95cf096779068dcad6ffcbbfdf0cd4dde9de2b2b97c \
    https://github.com/pnpm/pnpm/releases/download/v12.3.4/pnpm-linux-arm64.tar.gz /pnpm.tar.gz

FROM pnpm-$BUILDARCH AS pnpm

# The build runs on the machine's own architecture whatever the image is
# for. What it makes is HTML, CSS and JavaScript, the same for every one.
FROM --platform=$BUILDPLATFORM node:26.12.1-bookworm-slim@sha256:28147155d47dc31abe0a46e0d12b59b2fb3d0a2dcc5dc65fce76a074180b16fe AS build

ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1 \
    PATH=/opt/pnpm:$PATH

WORKDIR /repo

# The binary needs the dist folder beside it, so both stay in /opt/pnpm.
RUN --mount=from=pnpm,source=/pnpm.tar.gz,target=/tmp/pnpm.tar.gz \
    mkdir /opt/pnpm && tar -xzf /tmp/pnpm.tar.gz -C /opt/pnpm

# The lockfile alone decides what's downloaded. With only these copied, the
# layer below is reused until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --frozen-lockfile --offline

# Where the pages send their web vitals, and what to call this build. Next
# writes both into the pages, so they're decided here and not when the
# container starts. /otlp is a path on the site's own address, which the
# ingress has to pass on to a collector. With an empty one the pages
# measure nothing and send nothing. "Telemetry" in CONTRIBUTING.md has the
# rest.
#
#   docker build --build-arg OTLP_ENDPOINT= --build-arg SITE_VERSION=abc123 ...
ARG OTLP_ENDPOINT="/otlp"
ARG SITE_VERSION=""
ENV NEXT_PUBLIC_OTLP_ENDPOINT=$OTLP_ENDPOINT     NEXT_PUBLIC_SITE_VERSION=$SITE_VERSION

# The Ask AI panel, written into the pages the same way. With no endpoint,
# which is the default, there's no panel. apps/ask/README.md has the
# service it talks to.
#
#   docker build --build-arg ASK_ENDPOINT=/api/ask \
#     --build-arg TURNSTILE_SITE_KEY=... --build-arg ASK_REGION="Sweden Central" ...
ARG ASK_ENDPOINT=""
ARG TURNSTILE_SITE_KEY=""
ARG ASK_REGION=""
ENV NEXT_PUBLIC_ASK_ENDPOINT=$ASK_ENDPOINT \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_ASK_REGION=$ASK_REGION

RUN pnpm build

# Runs as a user that isn't root, and listens on 8080. It writes only to
# /tmp, so the root filesystem can be read-only with a volume there.
FROM nginxinc/nginx-unprivileged:1.31-alpine@sha256:b9241c6e7b8e9a862f129d8d4199ab64b10390949a78bdd5603379b32c844083

COPY apps/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/showcase/out /usr/share/nginx/html

# The image's user, by number: Kubernetes can't tell that a name isn't root.
USER 101

EXPOSE 8080
