# Spec Delta

## Purpose
Integrar y desplegar automáticamente el trabajo de las dos máquinas, con verificación antes y después de cada despliegue.

## ADDED Requirements

### Requirement: Verificación en cada Pull Request
El pipeline SHALL ejecutar `./scripts/check.sh --full` en cada Pull Request hacia `main` y reportar el resultado como check "Sensores" (RNF-04, RNF-05).

#### Scenario: Pull Request correcto
- **WHEN** dev-a o dev-b abre un Pull Request cuyos tests y build pasan
- **THEN** el check "Sensores" queda en verde

#### Scenario: Pull Request con un test roto
- **WHEN** un Pull Request rompe un test del backend
- **THEN** el check "Sensores" queda en rojo y muestra el paso que falló

### Requirement: Rama principal protegida
La rama `main` MUST aceptar cambios solo por Pull Request con el check "Sensores" en verde (RNF-04).

#### Scenario: Push directo a main
- **WHEN** un desarrollador intenta `git push origin main` directamente
- **THEN** GitHub rechaza el push

#### Scenario: Merge con checks en rojo
- **GIVEN** un Pull Request con el check "Sensores" en rojo
- **THEN** GitHub no permite hacer merge

### Requirement: Despliegue automático
El pipeline SHALL desplegar en la EC2 cada merge a `main`: construir las imágenes, publicarlas en GHCR con el SHA del commit y reiniciar los contenedores con `docker compose pull && up -d` (RNF-04).

#### Scenario: Merge a main
- **WHEN** se hace merge de un Pull Request a `main`
- **THEN** el workflow "Deploy" construye y publica las imágenes `-backend` y `-frontend` con el SHA del commit y las ejecuta en la EC2

#### Scenario: Faltan los secrets de la EC2
- **GIVEN** que `EC2_HOST` no está configurado
- **WHEN** se ejecuta el workflow "Deploy"
- **THEN** el job de despliegue falla con un mensaje claro y la aplicación anterior sigue funcionando

### Requirement: Verificación después del despliegue
El pipeline SHALL ejecutar el smoke test contra `http://<EC2_HOST>` al final de cada despliegue y mostrar los logs del backend si falla (RNF-04, RNF-08).

#### Scenario: Despliegue sano
- **WHEN** termina el despliegue
- **THEN** `scripts/smoke.sh` responde "SMOKE OK" contra la IP pública

#### Scenario: Backend que no arranca
- **GIVEN** un despliegue cuyo backend falla al iniciar
- **WHEN** se ejecuta el smoke test
- **THEN** el workflow queda en rojo y muestra las últimas líneas de los logs del backend

### Requirement: Configuración de producción
Los contenedores de producción SHALL recibir `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` desde `~/app/.env` del servidor y MUST NOT tomar secretos del repositorio (RNF-01).

#### Scenario: Login en producción
- **GIVEN** la aplicación desplegada
- **WHEN** el admin inicia sesión con el `ADMIN_EMAIL` y el `ADMIN_PASSWORD` de `~/app/.env`
- **THEN** recibe un token válido

#### Scenario: Variable faltante
- **GIVEN** que `JWT_SECRET` no está en `~/app/.env`
- **WHEN** se ejecuta el despliegue
- **THEN** `docker compose` se detiene con el mensaje "falta JWT_SECRET en .env"

### Requirement: Capacidad en una t3.micro
El sistema desplegado SHALL funcionar dentro de 1 GB de RAM más el swap, con límites de memoria por contenedor: base de datos 320 MB, backend 256 MB y Nginx 64 MB (RNF-06).

#### Scenario: Uso de memoria
- **WHEN** se ejecuta `docker stats --no-stream` en la EC2 con la aplicación en uso
- **THEN** ningún contenedor supera su límite y los tres siguen en estado "healthy" o "running"
