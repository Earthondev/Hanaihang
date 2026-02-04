# Firestore Schema

เอกสารนี้สรุปโครงสร้าง Firestore ของโปรเจกต์ Hanaihang รวมถึงกฎการตรวจสอบเบื้องต้นที่ใช้งานใน `firestore.rules` และสคริปต์ตรวจสอบข้อมูล

## Overview

- Root collections
  - `malls` (หลัก)
  - `stores` (legacy / cross-mall)
  - `brands`
  - `promotions`
  - `events`
- Subcollections ใต้ `malls/{mallId}`
  - `floors`
  - `stores`

## Schema: malls

Path: `malls/{mallId}`

Required
- `name`: string (slug)
- `displayName`: string

Optional
- `nameLower`: string
- `searchKeywords`: string[]
- `address`: string
- `district`: string
- `province`: string
- `brandGroup`: string
- `lat`: number
- `lng`: number
- `coords`: { lat: number, lng: number }
- `openTime`: string
- `closeTime`: string
- `hours`: { open: string, close: string }
- `contact`: { phone?: string, website?: string, social?: string }
- `category`: "shopping-center" | "community-mall" | "high-end" | "outlet" | "department-store"
- `status`: "Active" | "Closed" | "Maintenance"
- `logoUrl`: string
- `images`: string[]
- `storeCount`: number
- `floorCount`: number
- `sources`: SourceAttribution[]
- `osm`: { id: number, type: string }
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

Validation (firestore.rules)
- `name` ต้องเป็น string ที่ไม่ว่าง
- `displayName` ต้องเป็น string ที่ไม่ว่าง
- `lat`/`lng` ต้องเป็น number ถ้ามี
- `coords` ต้องมี `lat`/`lng` เป็น number ถ้ามี
- `hours` ต้องมี `open`/`close` เป็น string ถ้ามี

## Schema: floors

Path: `malls/{mallId}/floors/{floorId}`

Required
- `label`: string
- `order`: number (int)

Optional
- `name`: string
- `mallId`: string (legacy)
- `_mallId`: string
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

Validation (firestore.rules)
- `label` ต้องเป็น string ที่ไม่ว่าง
- `order` ต้องเป็น int

## Schema: stores (nested)

Path: `malls/{mallId}/stores/{storeId}`

Required
- `name`: string
- `category`: string
- `floorId`: string

Optional
- `nameLower`: string
- `searchKeywords`: string[]
- `brandSlug`: string
- `floorLabel`: string
- `unit`: string
- `phone`: string | null
- `hours`: string (HH:mm-HH:mm)
- `status`: "Active" | "Maintenance" | "Closed"
- `mallId`: string (legacy)
- `_mallId`: string
- `mallSlug`: string
- `mallName`: string
- `mallCoords`: { lat: number, lng: number }
- `location`: { lat?: number, lng?: number, geohash?: string }
- `landmarks`: string[]
- `directions`: string
- `nearbyStores`: string[]
- `searchKeywords`: string[]
- `tags`: string[]
- `sources`: SourceAttribution[]
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

Validation (firestore.rules)
- `name` ต้องเป็น string ที่ไม่ว่าง
- `category` ต้องเป็น string ที่ไม่ว่าง
- `floorId` ต้องเป็น string ที่ไม่ว่าง
- ถ้ามี `status` ต้องเป็นหนึ่งใน `Active | Maintenance | Closed`

## Schema: stores (legacy root)

Path: `stores/{storeId}`

- โครงสร้างใกล้เคียงกับ nested stores
- ใช้สำหรับ legacy / migration
- Validation ใช้กฎเดียวกับ nested stores ใน `firestore.rules`

## Schema: brands

Path: `brands/{brandId}`

Fields (ตัวอย่างทั่วไป)
- `name`: string
- `slug`: string
- `logoUrl`: string
- `categories`: string[]
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

Rules
- อ่านได้ทั้งหมด
- เขียนได้ใน dev หรือ admin เท่านั้น

## Schema: promotions

Path: `promotions/{promoId}`

Fields (ตัวอย่างทั่วไป)
- `title`: string
- `subtitle`: string
- `_mallId`: string
- `scope`: "mall" | "store" | "floor"
- `startDate`: string
- `endDate`: string
- `status`: "scheduled" | "active" | "expired"
- `hashtags`: string[]

Rules
- อ่านได้ทั้งหมด
- เขียนได้ใน dev หรือ admin เท่านั้น

## Schema: events

Path: `events/{eventId}`

Fields (ตัวอย่างทั่วไป)
- `device`: string
- `event`: string
- `store_id`?: string
- `mall_id`?: string
- `meta`?: Record<string, unknown>
- `timestamp`: string

Rules
- อ่านได้ทั้งหมด
- เขียนได้ใน dev หรือ admin เท่านั้น

## Validation Scripts

- `npm run validate:firestore`
  - ตรวจข้อมูลทั้งหมดใน `malls`, `floors`, `stores` (nested)
  - สร้างรายงานที่ `data/derived/firestore-validation.json`

- `npm run fix:firestore:hours`
  - ลบฟิลด์ `hours` ที่ผิดรูปแบบ (เช่น sentinel delete) ออกจาก malls

- `npm run migrate:search-fields`
  - เติม `nameLower` และ `searchKeywords` ให้กับ `malls` และ `stores`

## Notes

- `firestore.rules` เปิดเขียนทั้งหมดในโหมด dev ผ่าน `isDevelopment()`
- กฎ validation ถูกใช้เฉพาะฝั่ง Admin/Production เพื่อกันข้อมูลไม่ถูกต้อง
- หากต้องการคุมคุณภาพเพิ่ม แนะนำเพิ่ม rule ตรวจรูปแบบ `hours` และ `phone` เข้มขึ้น
