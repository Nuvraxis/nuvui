# syntax=docker/dockerfile:1

# The MCP server, over HTTP at /mcp, with its data built in. It reads the
# agent skill and the website's blocks and charts, so it's built from the
# root of the repository:
#
#   docker build --file apps/mcp/Dockerfile --tag nuvui-mcp .
#   docker run --rm --publish 8080:8080 nuvui-mcp
#
# The same image runs one agent's server over stdio, with nothing to
# install but Docker:
#
#   docker run --rm --interactive nuvui-mcp --stdio
#
# Each base image is named by its digest, as in apps/Dockerfile, so that a
# tag moved to other contents can't change what's built.

# The build runs on the machine's own architecture. What it makes is
# JavaScript and JSON, and no dependency of the server has a native part,
# so the same files run on either.
FROM --platform=$BUILDPLATFORM node:24-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS build

ENV CI=true \
    TURBO_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /repo

# Corepack reads the pnpm version from packageManager in package.json.
RUN corepack enable

# The lockfile alone decides what's downloaded, so this layer is reused
# until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm fetch

COPY . .
RUN pnpm install --frozen-lockfile --offline --filter "@nuvui/mcp..."
RUN pnpm --filter @nuvui/mcp build

# The server's own files and its production dependencies, and nothing of
# the rest of the workspace. Not offline: pnpm reads each package's
# metadata again, to check its age against the workspace's policy.
RUN pnpm --filter @nuvui/mcp deploy --prod /deploy

FROM node:24-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20

# What to call this build in the counts it sends, such as the commit.
ARG SERVICE_VERSION=""
ENV NODE_ENV=production \
    PORT=8080 \
    SERVICE_VERSION=$SERVICE_VERSION

WORKDIR /app
COPY --from=build /deploy ./

# The image's own user that isn't root, by number: Kubernetes can't tell
# that a name isn't root. It writes nothing, so the root filesystem can be
# read-only.
USER 1000

EXPOSE 8080
ENTRYPOINT ["node", "dist/main.mjs"]
