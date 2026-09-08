# ⛽ Gasko

**Gasko** es una aplicación móvil para buscar gasolineras cercanas o en una ubicación elegida, con filtros avanzados de combustible, precio, marca, horario y servicios.

Desarrollada con **React Native + Expo (TypeScript)** bajo **Arquitectura Hexagonal (Ports & Adapters)** para garantizar la mantenibilidad y facilitar la migración a un backend propio en el futuro.

---

## 🚀 Descargar APK

Descarga el APK más reciente desde la sección [**Releases**](../../releases/latest) de este repositorio.

---

## ✨ Funcionalidades

- 📍 **Detección automática** de gasolineras cercanas via GPS
- 🔍 **Búsqueda** por municipio, código postal o dirección
- 🔽 **Filtros avanzados**:
  - Tipo de combustible (Gasolina 95/98, Diésel, Diésel Plus, GLP, GNC, GNL, Hidrógeno)
  - Radio de búsqueda (1 – 50 km)
  - Marcas / cadenas
  - Solo abiertas 24h
  - Servicios: lavado, tienda, cafetería, carga eléctrica, inflado
  - Ordenar por precio o distancia
- ⭐ **Favoritas** con persistencia local
- 🗺️ Botón para abrir navegación en **Google Maps / Waze**
- 📡 Datos **en tiempo real** de precios mediante la [API oficial del MITECO](https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/)

---

## 🏗️ Arquitectura Hexagonal

```
src/
├── core/
│   ├── domain/            ← Entidades puras, Puertos (interfaces)
│   └── application/       ← Casos de Uso (lógica de negocio pura)
├── infrastructure/
│   └── adapters/          ← Adaptadores secundarios (API MITECO, Expo Location, AsyncStorage)
│       └── config/        ← Inyección de dependencias (serviceLocator)
└── presentation/          ← Adaptador primario (React Native UI, Hooks, Pantallas)
```

> Para migrar a un backend propio, basta con crear un nuevo adaptador que implemente `GasStationRepository` y conectarlo en `serviceLocator.ts`.

---

## 🛠️ Desarrollo local

### Requisitos
- Node.js 18+
- Expo Go app en tu móvil ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

### Instalación

```bash
npm install
npm start
```

Escanea el código QR con la cámara (iOS) o con Expo Go (Android).

---

## 📦 Release APK

Los APKs se generan automáticamente con [EAS Build](https://docs.expo.dev/build/introduction/) via GitHub Actions al hacer push a `main`.

---

## 📄 Licencia

MIT © J2K-AI
