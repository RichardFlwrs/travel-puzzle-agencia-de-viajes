# FreeTour IP Whitelisting - Guía

## Problema

FreeTour requiere que la IP de salida del servidor esté whitelisted para permitir bookings. La IP será diferente en:
- **Desarrollo (local)**: IP de tu conexión local
- **Producción (Vercel)**: IP del servidor de Vercel (diferente)

## Solución

### 1. Obtener la IP de Producción

Después de desplegar a Vercel, ejecuta:

```bash
# Opción 1: Desde la terminal
curl https://tu-dominio.vercel.app/api/freetour/outbound-ip

# Opción 2: Desde el navegador
https://tu-dominio.vercel.app/api/freetour/outbound-ip
```

**Respuesta esperada:**
```json
{
  "ip": "52.1.2.3",
  "environment": "production",
  "timestamp": "2025-12-12T21:26:19.632Z",
  "services": ["ifconfig.me: success"]
}
```

### 2. Enviar IP a FreeTour

Envía la IP obtenida al equipo de desarrollo de FreeTour con el siguiente mensaje:

```
Estimados,

Hemos desplegado nuestra integración a producción y necesitamos whitelistear 
la siguiente IP de salida para permitir bookings:

IP de Producción: [IP_OBTENIDA]
Ambiente: Producción (Vercel)
Dominio: [tu-dominio.vercel.app]

Por favor, agreguen esta IP a la whitelist para permitir peticiones POST 
al endpoint /booking.

Gracias.
```

### 3. Verificar Diagnóstico Completo

Para un diagnóstico completo (IP, autenticación, headers, etc.):

```bash
curl https://tu-dominio.vercel.app/api/freetour/diagnose-booking
```

Este endpoint te dará:
- IP de salida
- Estado de autenticación
- Headers que se envían
- Recomendaciones

## Endpoints Disponibles

### `/api/freetour/outbound-ip` (GET)
- **Propósito**: Obtener solo la IP de salida del servidor
- **Uso**: Simple y rápido para obtener la IP para whitelisting
- **Respuesta**: `{ ip: string, environment: string, timestamp: string }`

### `/api/freetour/diagnose-booking` (GET)
- **Propósito**: Diagnóstico completo del sistema de booking
- **Uso**: Troubleshooting y verificación de configuración
- **Respuesta**: Información completa de IP, auth, headers, etc.

## Notas Importantes

1. **IP Dinámica en Vercel**: Vercel puede usar múltiples IPs. Si tienes problemas, considera usar un servicio de IP fija o contactar a Vercel para IPs estáticas.

2. **IPv4 vs IPv6**: Asegúrate de que FreeTour acepte el tipo de IP que estás usando (IPv4 o IPv6).

3. **Regiones de Vercel**: Si tu app está en múltiples regiones, cada región puede tener IPs diferentes. Verifica `VERCEL_REGION` en el diagnóstico.

4. **Token Scopes**: Además de la IP, verifica que el token JWT tenga los scopes necesarios para bookings. Usa jwt.io para decodificar el token.

## Troubleshooting

### Si la IP cambia frecuentemente:
- Considera usar un servicio de IP fija
- O solicita a FreeTour un rango de IPs de Vercel

### Si sigue dando 403 después de whitelistear:
1. Verifica que la IP sea exactamente la misma (sin espacios, formato correcto)
2. Verifica los scopes del token JWT
3. Revisa los logs del servidor para ver qué IP está usando realmente
4. Contacta a FreeTour con evidencia técnica (headers, IP, token scopes)
