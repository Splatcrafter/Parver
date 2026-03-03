# ---- Stage 1: Build ----
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copy Maven wrapper
COPY .mvn/ .mvn/
COPY mvnw ./
RUN chmod +x mvnw

# Copy POMs first for dependency caching
COPY pom.xml .
COPY parver-frontend/pom.xml parver-frontend/
COPY parver-backend/pom.xml parver-backend/

# Download dependencies (cached unless POMs change)
RUN ./mvnw dependency:go-offline -B || true

# Copy full source code
COPY parver-frontend/ parver-frontend/
COPY parver-backend/ parver-backend/

# Build the project
RUN ./mvnw clean package -DskipTests -B

# ---- Stage 2: Runtime ----
FROM eclipse-temurin:21-jre AS runtime

WORKDIR /app

COPY --from=builder /app/parver-backend/target/parver-backend-0.1.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
