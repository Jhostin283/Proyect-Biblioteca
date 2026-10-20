# ADR-0001: Registrar las decisiones de arquitectura con ADR

- **Estado:** Accepted
- **Fecha:** 2026-10-20
- **Decisores:** dev-a, dev-b
- **Cambio de OpenSpec relacionado:** global
- **Reemplaza a:** —

## Contexto y problema
El proyecto lo construyen dos desarrolladores, cada uno con un agente de IA guiado por OpenSpec en su propia máquina.
Las specs describen QUÉ hace el sistema, pero no POR QUÉ la arquitectura es así. Sin ese registro, cada agente
podría proponer diseños que contradicen decisiones ya tomadas por el otro.

## Decisión
Registraremos cada decisión estructural como un ADR en ./adr/ (formato MADR simplificado, en español),
gestionado con los comandos /adr, /adr-supersede y /adr-review, e integrado a `develop` por Pull Request.

## Consecuencias
- **Positivas:** el porqué queda trazable y ambos agentes leen los mismos ADR antes de diseñar.
- **Negativas / costos:** unos minutos extra por cada decisión estructural y una revisión del otro desarrollador.

## Reglas para futuros cambios
- Todo design.md que tome una decisión estructural referencia un ADR existente o propone uno nuevo.
- Un ADR con estado Accepted no se edita: se reemplaza.
