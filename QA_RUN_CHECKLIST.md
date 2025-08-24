# QA Workflow - First Run Checklist 🚀

## 🟢 **เริ่มรัน Workflow**

### วิธีที่ 1: Merge PR
```bash
# Merge PR เข้า main → trigger pull_request: closed
```

### วิธีที่ 2: Manual Dispatch
```
GitHub UI → Actions → QA → Run workflow
```

---

## 📋 **ตรวจสอบ Jobs ใน Actions UI**

### **1. Setup Job**
- [ ] ✅ Job ผ่าน (green checkmark)
- [ ] 🔍 Log แสดง: `Resolved BASE_URL from ...`
  - [ ] `netlify-preview` (ถ้ามี PR comments)
  - [ ] `secret` (ถ้าตั้ง QA_BASE_URL_SECRET)
  - [ ] `var` (ถ้าตั้ง QA_BASE_URL_VAR)
  - [ ] `default` (fallback: https://hanaihang.netlify.app)

### **2. E2E Job**
- [ ] ✅ Job ผ่าน (green checkmark)
- [ ] 🔍 Log แสดง: `Using BASE_URL=...`
- [ ] 📊 Playwright tests ผ่านทั้งหมด
- [ ] 📁 Artifacts: `playwright-report-<sha>`
- [ ] 📁 Artifacts: `playwright-traces-<sha>`

### **3. Audits Job**
- [ ] ✅ Job ผ่าน (green checkmark)
- [ ] 🔍 Log แสดง: `Using BASE_URL=...`
- [ ] 📊 Lighthouse mobile ผ่าน
- [ ] 📊 Lighthouse desktop ผ่าน
- [ ] 📁 Artifacts: `lighthouse-json-<sha>`

### **4. A11y Job**
- [ ] ✅ Job ผ่าน (green checkmark)
- [ ] 🔍 Log แสดง: `Using BASE_URL=...`
- [ ] 📊 Pa11y tests ผ่านทั้งหมด
- [ ] 📁 Artifacts: `pa11y-artifacts-<sha>`

### **5. Gate Job**
- [ ] ✅ Job ผ่าน (green checkmark)
- [ ] 📊 Lighthouse thresholds ผ่าน
  - [ ] Performance ≥ 85
  - [ ] Accessibility ≥ 90
  - [ ] Best Practices ≥ 90
  - [ ] SEO ≥ 90
- [ ] 💬 PR Comment สรุปผล

---

## 📁 **ตรวจสอบ Artifacts**

### **Lighthouse Reports**
- [ ] 📥 Download `lighthouse-json-<sha>`
- [ ] 📊 เปิด `lh-mobile.json` → ดูคะแนน:
  - [ ] Performance: ___/100
  - [ ] Accessibility: ___/100
  - [ ] Best Practices: ___/100
  - [ ] SEO: ___/100
- [ ] 📊 เปิด `lh-desktop.json` → ดูคะแนน:
  - [ ] Performance: ___/100
  - [ ] Accessibility: ___/100
  - [ ] Best Practices: ___/100
  - [ ] SEO: ___/100

### **Pa11y Reports**
- [ ] 📥 Download `pa11y-artifacts-<sha>`
- [ ] 📊 เปิด report → ดู errors:
  - [ ] จำนวน errors: ___
  - [ ] จำนวน warnings: ___
  - [ ] จำนวน notices: ___

### **Playwright Reports**
- [ ] 📥 Download `playwright-report-<sha>`
- [ ] 📊 เปิด HTML report → ดู:
  - [ ] จำนวน tests: ___
  - [ ] จำนวน passed: ___
  - [ ] จำนวน failed: ___

---

## 💬 **ตรวจสอบ PR Comment**

### **ควรเจอข้อความ:**
```
**QA Checks ✅**
- Playwright E2E: PASSED
- Lighthouse: Mobile & Desktop thresholds PASSED
- Pa11y: PASSED
```

---

## 🔧 **Troubleshooting**

### **ถ้า Setup Job Fail:**
- [ ] ตรวจ BASE_URL resolution
- [ ] ตรวจ GitHub token permissions
- [ ] ตรวจ secrets/variables configuration

### **ถ้า E2E Job Fail:**
- [ ] ตรวจ BASE_URL accessibility
- [ ] ตรวจ Playwright browser installation
- [ ] ตรวจ test timeout settings

### **ถ้า Audits Job Fail:**
- [ ] ตรวจ Lighthouse thresholds
- [ ] ตรวจ BASE_URL loading time
- [ ] ตรวจ artifacts directory

### **ถ้า A11y Job Fail:**
- [ ] ตรวจ Pa11y configuration
- [ ] ตรวจ BASE_URL accessibility
- [ ] ตรวจ .pa11yci.json settings

### **ถ้า Gate Job Fail:**
- [ ] ตรวจ Lighthouse scores
- [ ] ตรวจ threshold values
- [ ] ตรวจ jq installation

---

## 🎯 **หลัง Run สำเร็จ - ส่งมาให้สรุป**

### **ส่งข้อมูลนี้:**
```
✅ Setup: Resolved BASE_URL from [source]
✅ E2E: [passed/failed] - [test count]
✅ Audits: Mobile [scores] / Desktop [scores]
✅ A11y: [errors/warnings/notices]
✅ Gate: [passed/failed]
📁 Artifacts: [list downloaded files]
```

### **จะได้สรุป:**
- 📊 **คะแนน Lighthouse breakdown**
- 🚨 **Pa11y errors ที่เจอ**
- 💡 **คำแนะนำ optimize Performance**
- 🔧 **Quick wins สำหรับปรับปรุง**
- 📈 **Thresholds ที่แนะนำ**

---

## 🚀 **พร้อมเมื่อไหร่บอกได้เลย!**

> "สรุปคะแนน Lighthouse และ error Pa11y ที่เจอ พร้อมคำแนะนำปรับปรุง"
> 
> "แนะนำวิธี optimize เพื่อตัวเลข Perf > 90"
> 
> "เพิ่ม HTML/Screenshot reports ใน artifacts เพื่อ debug ง่ายขึ้น"

**กด run แรกเลยครับ แล้วส่งมาผมสรุปให้แบบครบถ้วนในข้อความเดียว! 🎉**
