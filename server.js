const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// อนุญาตให้ระบบอ่าน JSON และไฟล์ในโฟลเดอร์ public
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ dest: 'uploads/' });

// 💥 ตัวแปรเก็บข้อมูลพนักงานชั่วคราวใน RAM
let staffAccounts = []; 

// 📁 1. API สำหรับรับไฟล์ CSV มาสร้าง Account พนักงาน
app.post('/api/upload-staff', upload.single('staffFile'), (req, res) => {
    const results = [];
    if (!req.file) return res.status(400).send('กรุณาเลือกไฟล์ก่อนครับ');

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            // ดึงข้อมูลจากไฟล์มา แล้วตั้งรหัสผ่านเริ่มต้นให้ทุกคนเป็น "salad1234"
            results.push({
                id: data.id,
                name: data.name,
                role: data.role,
                password: 'salad1234' 
            });
        })
        .on('end', () => {
            fs.unlinkSync(req.file.path); // ลบไฟล์ขยะทิ้ง
            staffAccounts = results;     // บันทึกรายชื่อเข้าเซิร์ฟเวอร์
            
            res.send(`
                <body style="font-family:sans-serif; padding:40px; background:#f4f4f0; text-align:center;">
                    <h2 style="color:#16a34a;">🚀 อัปโหลดรายชื่อพนักงานสำเร็จ!</h2>
                    <p>ระบบสร้างบัญชีพนักงานเรียบร้อย จำนวน <b>${staffAccounts.length}</b> คน</p>
                    <p>🔑 รหัสผ่านเริ่มต้นของทุกคนคือ: <span style="color:#dc2626; font-weight:bold;">salad1234</span></p>
                    <a href="/login.html" style="background:#000; color:#fff; padding:10px 20px; text-decoration:none; display:inline-block; margin-top:20px;">กลับไปลองล็อกอิน</a>
                </body>
            `);
        });
});

// 👤 2. API สำหรับตรวจสอบการล็อกอินของพนักงาน
app.post('/api/login', (req, res) => {
    const { employeeId, password } = req.body;

    // ค้นหาพนักงานจาก ID
    const user = staffAccounts.find(account => account.id === employeeId);

    if (!user) {
        return res.status(401).json({ success: false, message: '❌ ไม่พบรหัสพนักงานนี้ในระบบ บัตรอาจจะยังไม่ถูกลงทะเบียน' });
    }

    if (user.password !== password) {
        return res.status(401).json({ success: false, message: '🔒 รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่' });
    }

    // ถ้าถูกต้องทั้งหมด
    res.json({ success: true, message: `🎉 ยินดีต้อนรับคุณ ${user.name} [ตำแหน่ง: ${user.role}] เข้าสู่ระบบหลังบ้านร้านสลัดสุดโหด!` });
});

app.listen(port, () => {
    console.log(`\n🔥 เซิร์ฟเวอร์ร้านสลัดเปิดแล้วที่: http://localhost:${port}\n`);
});