# Java EE to Quarkus Migration Skill

## Objective
Migrate a Java EE application to Quarkus 3.x, converting EE-specific APIs to Quarkus/MicroProfile equivalents.

## Transformations

### EJB → CDI
- Replace `@Stateless`, `@Stateful`, `@Singleton` with `@ApplicationScoped`
- Replace `@EJB` injection with `@Inject`
- Remove remote interfaces

### JPA
- Keep JPA annotations (Quarkus supports them via Hibernate ORM)
- Add `quarkus-hibernate-orm` and `quarkus-jdbc-*` extensions
- Convert `persistence.xml` to `application.properties`

### JAX-RS
- Keep JAX-RS annotations (Quarkus supports RESTEasy)
- Add `quarkus-rest` extension
- Remove `@ApplicationPath` if using default

### JMS → Reactive Messaging
- Replace JMS `@MessageDriven` with `@Incoming` / `@Outgoing`
- Add `quarkus-messaging-*` extension
- Convert connection factories to config properties

### JSF → Qute or REST
- Remove JSF pages and managed beans
- Replace with Qute templates or REST + SPA frontend

### Build
- Convert Maven EAR/WAR packaging to single JAR
- Add `quarkus-maven-plugin`
- Replace Java EE BOM with Quarkus BOM

## Validation
After migration:
1. Application compiles with `./mvnw compile`
2. Tests pass with `./mvnw test`
3. Application starts with `./mvnw quarkus:dev`

## Output
- All changes on a new branch
- Commit message: "feat: migrate from Java EE to Quarkus 3.x"
