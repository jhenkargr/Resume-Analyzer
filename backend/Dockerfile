FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /workspace

# copy maven files first to leverage cache
COPY pom.xml mvnw* ./
COPY .mvn .mvn
RUN mvn -B -ntp -e -DskipTests dependency:go-offline

# copy source and build
COPY src ./src
RUN mvn -B -ntp -DskipTests package

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /workspace/target/*.jar ./app.jar
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
