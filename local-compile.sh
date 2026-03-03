#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
./mvnw clean package -DskipTests
