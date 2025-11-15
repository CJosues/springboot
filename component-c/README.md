Component C - Shared Library

This module contains shared utilities that can be published to an internal Maven repository
and consumed by Spring Boot components A and B.

Artifacts:
- groupId: com.example
- artifactId: component-c
- version: 1.0.0

Includes:
- SharedUtils.java: simple utility methods for summing amounts and id validation.

Usage:
- Install locally: mvn install
- Add as dependency in components A and B pom.xml:

<dependency>
  <groupId>com.example</groupId>
  <artifactId>component-c</artifactId>
  <version>1.0.0</version>
</dependency>
