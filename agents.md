# Reglas para Agentes de IA

Este documento contiene reglas estrictas para el desarrollo en este repositorio.

## TypeScript y Tipado
1. **No usar `any` ni `unknown`**: Está prohibido el uso de `any` o `unknown`. Siempre se deben definir interfaces o tipos específicos para los datos.
2. **Interfaces para API**: Todos los datos que vengan de la API deben tener una interfaz que describa su estructura.
3. **Tipado de Eventos**: Los eventos de React Native (como los de DateTimePicker) deben estar correctamente tipados.

## Estándares de Código
1. **Consistencia**: Mantener el estilo de código existente en el proyecto.
2. **Documentación**: No eliminar comentarios existentes a menos que el código que documentan sea eliminado o refactorizado significativamente.
