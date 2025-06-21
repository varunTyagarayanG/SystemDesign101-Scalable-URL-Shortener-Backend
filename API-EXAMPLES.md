# API Request & Response Examples

This document provides example requests and responses for the main endpoints of the Scalable URL Shortener Backend.
---

## 1. User Registration

**Endpoint:** `POST /register`

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "mysecurepassword"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

---

## 2. User Login

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "mysecurepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNjg3ODQ2ODAwfQ.abc123def456"
}
```

---

## 3. Who Am I (Get User Info)

**Endpoint:** `GET /whoami`
**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Response:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "alice@example.com"
}
```

---

## 4. Generate a ShortID

**Endpoint:** `GET /generate`

**Response:**
```json
{
  "shortId": "XyZ123a"
}
```

---

## 5. Generate a Short URL

**Endpoint:** `POST /api/urls`
**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Request Body:**
```json
{
  "longUrl": "https://www.openai.com/research/awesome-paper",
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "shortUrl": "http://localhost/api/urls/XyZ123a"
}
```

---

## 6. Generate Alias Short URL

**Endpoint:** `POST /api/urls`
**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`

**Request Body:**
```json
{
  "longUrl": "https://www.example.com/products/12345?ref=campaign",
  "alias": "alice-sale"
}
```

**Response:**
```json
{
  "shortUrl": "http://localhost/alice-sale"
}
```

---

## 7. Fetch Analytics by ShortID

**Endpoint:** `GET /stats/{shortId}`

**Response:**
```json
{
  "shortId": "XyZ123a",
  "redirectCount": 42,
  "cacheHits": 40,
  "cacheMisses": 2
}
```

---

## 8. Check if a Short URL Exists (Redirection)

**Endpoint:** `GET /{shortId}`

**Response:**
- HTTP 302 Redirect to the original long URL if found.
- HTTP 404 if not found.

---


