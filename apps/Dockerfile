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

# The build runs on the machine's own architecture whatever the image is
# for. What it makes is HTML, CSS and JavaScript, the same for every one.
FROM --platform=$BUILDPLATFORM node:24-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS build

ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /repo

# Corepack reads the pnpm version from packageManager in package.json.
RUN corepack enable

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

RUN pnpm build

# Runs as a user that isn't root, and listens on 8080. It writes only to
# /tmp, so the root filesystem can be read-only with a volume there.
FROM nginxinc/nginx-unprivileged:1.29-alpine@sha256:0c79d56aee561a1d81c63f00eee5fb5fe29279560cdc55e91425133104c7fbe6

COPY apps/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/showcase/out /usr/share/nginx/html

# The image's user, by number: Kubernetes can't tell that a name isn't root.
USER 101

EXPOSE 8080
