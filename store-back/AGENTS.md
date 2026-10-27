# AGENTS.md: store-back

Guía para agentes de IA y desarrolladores que trabajen en el backend de la **Tienda de Confianza**. Antes de escribir código, lee este archivo completo.

---

## 1. Contexto del proyecto

En la empresa existe una alacena de productos (snacks, bebidas…). Hoy los empleados anotan lo que toman en una hoja impresa, y cada quincena la administradora les cobra por WhatsApp.

Esta aplicación reemplaza la hoja impresa:

- En la alacena hay un **código QR** que abre la web app (mobile-first) en el celular del empleado.
- El **empleado (CLIENT)** busca productos, arma su compra y elige cómo pagar:
  - **Saldado (`PAID`)**: pagó en el momento con el QR físico de Nequi.
  - **Por pagar (`ON_CREDIT`)**: el valor se suma a su deuda de la quincena.
- El **administrador (ADMIN)**:
  - Gestiona productos y clientes.
  - Cierra la quincena con el botón **"Notificar Cobro"**. El sistema genera un link `wa.me` por cliente con el saldo a pagar.

Este repositorio (`store-back`) es **solo el backend** (API REST). El frontend (Next.js) vive en otro proyecto y por ahora no se trabaja.

**Fuera de alcance:** pasarelas de pago, WhatsApp Business API y validación de que el cobro se realizó. La app asume que la persona paga.

---

## 2. Tecnologías

| Área | Herramienta |
|---|---|
| Lenguaje | TypeScript (strict null checks) |
| Framework | NestJS 11 |
| ORM | TypeORM + `@nestjs/typeorm` |
| Base de datos | PostgreSQL. **En producción es una BD compartida de la empresa**, esquema `store` |
| Validación | `class-validator` + `class-transformer` (`ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`) |
| Autenticación | `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt` (**definida, aún no integrada**, ver §5.6) |
| Configuración | `@nestjs/config` (`.env`) |
| Imágenes | Cloudinary (plan gratuito), *pendiente de integrar* |
| Notificaciones | Links `https://wa.me/<phone>?text=<mensaje>`, sin API de pago |
| Calidad | ESLint + Prettier (`singleQuote`, `trailingComma: all`) |
| BD local | Docker Compose (`postgres:15.3`) |

---

## 3. Arquitectura

**Arquitectura hexagonal (Ports & Adapters)** con tres capas, aplicando SOLID, KISS y YAGNI.

### 3.1 Regla de dependencias

```
infrastructure  ──►  application  ──►  domain
```

- **`domain`**: TypeScript puro. **Prohibido** importar `@nestjs/*`, `typeorm` o cualquier librería de infraestructura.
- **`application`**: depende solo de `domain` y de sus propios puertos. Los casos de uso **no** llevan `@Injectable()`; se cablean en `infrastructure/config`.
- **`infrastructure`**: implementa los puertos (adapters), expone la API REST y configura Nest. Es la única capa que conoce Nest, TypeORM, Cloudinary, bcrypt, JWT, etc.

### 3.2 Estructura de carpetas

```
src/
├── main.ts
├── app.module.ts
├── domain/
│   ├── model/            Modelos de dominio, value objects (Phone) y enums (Role, PaymentMethod, PaymentStatus)
│   ├── exception/        Excepciones de negocio (DomainException y subclases)
│   └── service/          Reglas puras que no pertenecen a un modelo (BillingPolicy: 10 días)
├── application/
│   ├── ports/
│   │   ├── in/           Contratos de casos de uso (abstract class)
│   │   └── out/          Contratos hacia infraestructura (repositorios, UnitOfWork, storage…)
│   └── useCases/         Implementaciones de los casos de uso (*.service.ts)
└── infrastructure/
    ├── adapters/
    │   ├── in/rest/      Controllers, DTOs, guards, decorators, filtro global de excepciones
    │   └── out/
    │       ├── persistence/   entity/, adapters TypeORM, UnitOfWork
    │       ├── storage/       Cloudinary
    │       ├── security/      bcrypt, JWT strategy
    │       └── notification/  Generador de links wa.me
    ├── config/           Módulo Nest, cableado de providers (useFactory), BD, seed del admin
    └── mappers/          Dominio ↔ Entity ↔ DTO
```

### 3.3 Responsabilidades

| Pieza | Hace | No hace |
|---|---|---|
| Controller | Recibe el DTO, llama al puerto de entrada, mapea la respuesta | Lógica de negocio, acceso a la BD |
| Caso de uso | Orquesta repositorios y aplica reglas dentro de una transacción | Conocer HTTP o TypeORM |
| Modelo de dominio | Invariantes y cálculos (`Purchase.create`, `total`) | Persistirse a sí mismo |
| Adapter de persistencia | Traducir el puerto a TypeORM / SQL | Decidir reglas de negocio |
| Mapper | Convertir entre representaciones | Validar |

### 3.4 Patrones adoptados

- **Puertos como `abstract class`:** sirven de contrato y de token de inyección en Nest. No usar `interface` + `Symbol`.
- **Repository** por agregado, con solo los métodos necesarios (ISP). No crear un repositorio genérico base.
- **Unit of Work (`UnitOfWorkPort.run(work)`):** toda operación que escribe en más de una tabla pasa por aquí. El adapter usa `dataSource.transaction(...)`.
- **Factory method** en el dominio: los modelos tienen constructor privado, `create(...)` (registro nuevo, valida invariantes y genera el id con `randomUUID`) y `restore(props)` (rehidratación desde persistencia, sin validar). Ej.: `Purchase.create`, `BillingCycle.close`.
- **Data Mapper** en `infrastructure/mappers`.
- **CRUD agrupado:** un puerto de entrada por agregado para el CRUD (`ManageProductsUseCase`); una clase por operación con lógica de negocio real (`RegisterPurchaseService`, `CloseBillingCycleService`).

**Descartados a propósito (YAGNI):**
- Strategy para métodos de pago.
- CQRS completo, event sourcing y eventos de dominio.
- Microservicios.
- Librerías de transacciones "mágicas" (`typeorm-transactional`, CLS).

---

## 4. Convenciones de código

### 4.1 Nombres

- **Identificadores en inglés**: clases, variables, tablas, columnas y endpoints. **Mensajes al usuario y comentarios de documentación en español.**
- **Archivos en kebab-case con sufijo de rol:**

  | Rol | Archivo |
  |---|---|
  | Modelo de dominio / value object | `user.model.ts`, `phone.model.ts` |
  | Servicio de dominio | `billing-policy.service.ts` |
  | Excepción | `insufficient-stock.exception.ts` |
  | Entity | `user.entity.ts` |
  | Enum | `role.enum.ts` |
  | Puerto de entrada | `register-purchase.use-case.ts` |
  | Puerto de salida | `product-repository.port.ts` |
  | Caso de uso | `register-purchase.service.ts` |
  | Adapter de persistencia | `typeorm-product.adapter.ts` |
  | Controller | `product.controller.ts` |
  | DTO | `create-product.dto.ts` |
  | Mapper | `product.mapper.ts` |

- **Clases:**

  | Rol | Nombre |
  |---|---|
  | Entity | `XxxEntity` |
  | Puerto de entrada | `XxxUseCase` |
  | Caso de uso | `XxxService` |
  | Puerto de salida | `XxxPort` / `XxxRepositoryPort` |
  | Adapter | `TypeOrmXxxAdapter` / `CloudinaryXxxAdapter` |
  | Excepción | `XxxException` |

- **Base de datos:** tablas en plural y `snake_case`; columnas en `snake_case` mapeadas explícitamente con `name: 'user_id'`; propiedades TS en `camelCase`.
- **Constraints con nombre explícito:**

  | Tipo | Prefijo | Ejemplo |
  |---|---|---|
  | Unique | `uq_` | `uq_users_name` |
  | Check | `chk_` | `chk_users_debt` |
  | Índice | `idx_` | `idx_purchases_created` |

- **Enums de Postgres** con `enumName` explícito (`user_role`, `payment_method`, `payment_status`). Los enums TS viven en `domain/model` y la infraestructura los importa.

### 4.2 Entities (TypeORM)

Hay que seguir el estilo de los archivos existentes en `infrastructure/adapters/out/persistence/entity/`:
- **Un decorador por línea** sobre cada propiedad.
- **Propiedades obligatorias con `!:`**; **columnas nullable con `?: T | null`**.
- **Siempre `type` explícito** en `@Column`.
- **Dinero:** `type: 'integer'`, COP sin decimales. Nunca `decimal`, `float` ni `numeric`.
- **Fechas:** `timestamptz`.
- **Ids:** `@PrimaryGeneratedColumn('uuid')`.
- **Relaciones:** columna FK explícita (`userId`) + relación (`user`) con `@JoinColumn`. Las relaciones bidireccionales se tipan con `Relation<T>` (evita errores por imports circulares). Usar `onDelete: 'RESTRICT'` y nunca `CASCADE` de borrado.
- **Auditoría:** extender `TimestampedEntity` cuando la tabla necesite `created_at` / `updated_at`.
- **Soft delete** (`@DeleteDateColumn deleted_at`) en `users` y `products`. Las tablas financieras (`purchases`, `purchase_items`, `billing_cycles`, `charges`) son inmutables: no se borran.
- **Comentarios mínimos:** solo cuando expliquen un *porqué* no evidente.

### 4.3 Estilo

- Prettier: comillas simples, trailing commas. Ejecutar `npm run format` y `npm run lint` antes de terminar.
- Inyección por constructor con `private readonly`.
- `async/await`; no mezclar con `.then()`.
- No usar `any`. Preferir tipos explícitos en las firmas públicas de puertos y casos de uso.
- Los DTO validan forma y formato con `class-validator`; las reglas de negocio van en el dominio.

### 4.4 Manejo de errores

- **El dominio y la capa de aplicación lanzan solo subclases de `DomainException`.** Nunca `HttpException` de Nest.
- **Un filtro global** (`infrastructure/adapters/in/rest/global-exception.filter.ts`) traduce las excepciones a HTTP:

  | Excepción | HTTP |
  |---|---|
  | `ResourceNotFoundException` | 404 |
  | `InvalidCredentialsException` | 401 |
  | `AlreadyExistsException`, `InsufficientStockException`, `BillingTooSoonException` | 409 |
  | `BusinessRuleException` | 422 |
  | Errores no controlados | 500, con un mensaje genérico (no exponer `error.message` ni stack) |

- **Formato de respuesta de error:** `{ timestamp, status, error, message }`.
- **Las violaciones de constraints de Postgres** (`23505` unique, `23514` check) se traducen en el adapter o en el filtro a la excepción de dominio que corresponda. No deben llegar como 500.

---

## 5. Reglas de negocio (obligatorias)

### 5.1 Modelo de datos

| Tabla | Propósito |
|---|---|
| `users` | Clientes y admins (`role`). `debt` = caché del saldo "Por pagar". |
| `products` | Catálogo (`name`, `price`, `stock`, `image_url`, `image_public_id`). |
| `purchases` | Encabezado de compra: `payment_method`, `status`, `total`, `request_id`, `charge_id`. |
| `purchase_items` | Detalle con `unit_price` congelado al momento de la compra. |
| `billing_cycles` | Un registro por cada "Notificar Cobro" (cierre de quincena). |
| `charges` | Snapshot de cuánto se cobró a cada cliente en cada quincena. |

### 5.2 Usuarios y clientes

- **Nombre único entre usuarios activos.** El login es un `select` con los nombres.
- **Al crear un cliente, el admin solo envía `name`.** La contraseña inicial es `12345*` (guardada con hash bcrypt) y `must_change_password = true`.
- **El admin NO puede modificar `debt` ni `phone`.** Los DTO no deben incluir esos campos.
- **El admin solo puede restablecer la contraseña a `12345*`**, lo que vuelve a poner `must_change_password = true`.
- **El teléfono lo registra el propio empleado** en el primer login, junto con la nueva contraseña.
  - Formato de entrada: `3XXXXXXXXX`.
  - Se guarda como `573XXXXXXXXX`, listo para `wa.me`.
- **No se puede eliminar un cliente con `debt > 0`.** Los borrados de usuarios y productos son siempre soft delete.

### 5.3 Compras

- **Una compra tiene al menos un item.** Los items repetidos del mismo producto se agrupan (`quantity` acumulada).
- **El precio se congela en `purchase_items.unit_price`.** Cambiar el precio de un producto no afecta compras pasadas.
- **El stock se descuenta de forma atómica:** `UPDATE ... SET stock = stock - :qty WHERE id = :id AND stock >= :qty`. Si `affected = 0`, se lanza `InsufficientStockException` y se hace rollback de toda la compra. Nunca leer el stock, restarlo en memoria y guardarlo.
- **Estados válidos** (garantizados por `chk_purchases_state`):

  | payment_method | status | charge_id | Significado |
  |---|---|---|---|
  | `PAID` | `SETTLED` | `NULL` | Pagado al instante |
  | `ON_CREDIT` | `PENDING` | `NULL` | Fiado, aún sin cobrar |
  | `ON_CREDIT` | `SETTLED` | `NOT NULL` | Fiado y cobrado en esa quincena |

- **Si es `ON_CREDIT`**, se incrementa `users.debt` en la **misma transacción**.
- **Idempotencia:** el front envía un `requestId` (UUID) por compra. Si ya existe, se devuelve la compra existente y no se crea otra.
- **Orden de bloqueo** dentro de la transacción, para evitar deadlocks:
  1. Fila del usuario (`FOR UPDATE`).
  2. Verificación de `requestId`.
  3. Productos en orden ascendente de `id`.

### 5.4 Cierre de quincena ("Notificar Cobro")

Todo ocurre en **una sola transacción**:

1. `pg_advisory_xact_lock` sobre una clave fija, para serializar cierres concurrentes (doble clic).
2. `BillingPolicy`: deben haber pasado **al menos 10 días calendario (zona `America/Bogota`)** desde el `closed_at` del último ciclo. Si no, `BillingTooSoonException` (409). El primer cierre siempre se permite.
3. Se bloquean los usuarios con `debt > 0` (`FOR UPDATE`). Si no hay ninguno, `BusinessRuleException` y **no** se crea el ciclo.
4. Se crea un `billing_cycle` con un `charge` por deudor (`amount` = su `debt`).
5. Sus compras `ON_CREDIT` + `PENDING` + `charge_id IS NULL` pasan a `SETTLED` con su `charge_id`.
6. `users.debt = 0` para esos usuarios.

Después del cierre:
- **Los mensajes de WhatsApp se generan con `charges.amount`**, nunca con `users.debt`, que ya está en 0. Así el admin puede regenerar los links de un ciclo pasado.
- **La app asume que el cobro se pagó.** No existe un estado "cobrado pero no pagado" ni una validación de pago.
- **Formato del link:** `https://wa.me/<phone>?text=<encodeURIComponent(mensaje)>`. El mensaje incluye saludo, nombre, periodo y monto formateado como `es-CO` / `COP` sin decimales.

### 5.5 Integridad (no eliminar ni debilitar)

Los siguientes constraints garantizan las reglas anteriores:
- `chk_users_debt`
- `chk_users_phone`
- `chk_products_price`
- `chk_products_stock`
- `chk_purchases_total`
- `chk_purchases_state`
- `uq_charges_cycle_user`
- `purchases.request_id UNIQUE`
- `chk_items_quantity`
- `chk_items_unit_price`
- `chk_cycles_total`
- `chk_cycles_period`

### 5.6 Autenticación (definida, NO implementada aún)

Mientras tanto se usa un `DevAuthGuard` **temporal** que llena `req.user` desde los headers `x-user-id` y `x-user-role`. Esto permite probar los endpoints sin tokens. Los controllers ya usan `@CurrentUser()` y `@Roles(...)`, así que integrar JWT solo debe cambiar el guard global.

Diseño acordado:
- **Login:**
  1. `GET /api/auth/users` (público) devuelve `[{ id, name }]` para el select.
  2. `POST /api/auth/login { userId, password }`.
  3. Si `must_change_password`, el backend devuelve un JWT temporal (`pwdChange: true`, 10 min).
  4. Ese token solo sirve para `POST /api/auth/first-login { newPassword, phone }`, que devuelve el JWT completo (`{ sub, role }`, 8 h).
- **Contraseña nueva:** distinta de `12345*`, mínimo 6 caracteres.
- **Guards globales** (`APP_GUARD`):
  - `JwtAuthGuard`, que respeta `@Public()`.
  - `PasswordChangeGuard`.
  - `RolesGuard`.
- **Passport** solo se usa para la estrategia JWT. El login lo resuelve un caso de uso con `PasswordHasherPort` y `TokenPort`.
- **Throttling** obligatorio en `/auth/login`: la contraseña por defecto es conocida y la lista de usuarios es pública.

### 5.7 Endpoints (prefijo global `/api`)

| Método | Ruta | Rol |
|---|---|---|
| GET | `/auth/users` | público |
| POST | `/auth/login`, `/auth/first-login` | público / token temporal |
| CRUD | `/products` | ADMIN (GET: todos; acepta `?search=`) |
| CRUD | `/clients` | ADMIN |
| POST | `/clients/:id/reset-password` | ADMIN |
| POST | `/billing-cycles` | ADMIN ("Notificar Cobro") |
| GET | `/billing-cycles`, `/billing-cycles/:id` | ADMIN |
| POST | `/purchases` | CLIENT |
| GET | `/me`, `/me/purchases` | CLIENT |

---

## 6. Instrucciones de desarrollo

Todos los comandos se ejecutan dentro de `store-back/`.

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.template .env        # ajustar credenciales

# 3. Base de datos local (Postgres 15 en Docker; datos en ./postgres)
#    synchronize: true crea/actualiza las tablas a partir de las entities al arrancar
docker compose up -d

# 4. Compilar
npm run build                # → dist/

# 5. Ejecutar
npm run start:dev            # watch mode → http://localhost:3000/api

```

### Variables de entorno (`.env.template`)

`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SCHEMA` (= `store`), `PORT`.

Variables pendientes de agregar cuando se integren los servicios:
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## 7. Restricciones

### No modificar

- **`.env`**: es local y contiene secretos. Los cambios de variables van en `.env.template`.
- **`postgres/`** (datos del contenedor), **`dist/`** y **`node_modules/`**.
- **`package-lock.json` a mano.** Solo cambia vía `npm install`.
- **Nombres de tablas, columnas, constraints y enums de Postgres**, salvo aprobación explícita.
- **La configuración global de `main.ts`:** prefijo `api` y `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`.

### No agregar sin aprobación

- **ORMs o query builders alternativos** (Prisma, Sequelize, Knex, Drizzle) y bases de datos adicionales (Mongo, Redis).
- **`typeorm-transactional`** u otras librerías basadas en CLS: las transacciones van por `UnitOfWorkPort`.
- **Utilidades genéricas** como lodash, moment o dayjs: usar las APIs nativas (`Intl`, `Date`, `toLocaleDateString` con `timeZone`).
- **Clientes de WhatsApp Business API, Twilio** o cualquier servicio de mensajería de pago.
- **Proveedores de almacenamiento de imágenes** distintos de Cloudinary.

Dependencias previstas y aprobadas para cuando se necesiten:
- `cloudinary`
- `@types/multer`
- `@nestjs/throttler`
- `@nestjs/swagger`

### No alterar estas funcionalidades

- **Cálculo y edición de la deuda.** `users.debt` solo la modifican `RegisterPurchase` (incrementa) y `CloseBillingCycle` (pone en 0). No exponerla en ningún DTO de escritura.
- **Regla de 10 días** entre cobros, ni el advisory lock del cierre.
- **Inmutabilidad de compras, items, ciclos y cobros:** no hay endpoints de edición ni borrado para estas tablas.
- **Contraseña por defecto `12345*`** y el flujo obligatorio de primer login (contraseña + teléfono).
- **No implementar JWT/Passport** ni activar guards de autenticación reales hasta que se pida explícitamente.
- **Capas:** no meter lógica de negocio en controllers ni adapters, y no importar Nest ni TypeORM en `domain`.
- **No trabajar el frontend** desde este repositorio.

---

## 8. Estado actual

| Elemento | Estado |
|---|---|
| Scaffold Nest + conexión TypeORM a la BD local (`app.module.ts`) | ✅ |
| Enums de dominio (`Role`, `PaymentMethod`, `PaymentStatus`) | ✅ |
| Entities TypeORM (6 tablas + `TimestampedEntity`) | ✅ |
| Modelos de dominio y excepciones | ✅ |
| `BillingPolicy` (domain/service) | ✅ |
| Puertos `application/ports/in` y `application/ports/out` | ✅ |
| Casos de uso y adapters de persistencia + `UnitOfWork` | ⏳ |
| Controllers, DTOs, filtro global, `DevAuthGuard` | ⏳ |
| Seed del admin inicial | ⏳ |
| Cloudinary | ⏳ |
| JWT + Passport | ⏳ (al final) |

**Orden de implementación acordado:**
1. Dominio.
2. CRUD de productos y clientes.
3. `RegisterPurchase`.
4. `CloseBillingCycle`.
5. Cloudinary.
6. Autenticación.

Actualiza esta tabla al completar cada paso.
