// Backend Node.js Express & MySQL untuk CRUD Mahasiswa
const express = require("express");
const mysql = require("mysql2");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "db_kampus"
});

db.connect((err) => {
    if (err) {
        console.error("Koneksi database gagal:", err.message);
        return;
    }
    console.log("Terhubung ke database MySQL Laragon");
});

// READ
app.get("/api/mahasiswa", (req, res) => {
    db.query("SELECT * FROM mahasiswa ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json(results);
    });
});

// CREATE dengan pemeriksaan duplikat di backend sebagai perlindungan tambahan
app.post("/api/mahasiswa", (req, res) => {
    const { nim, nama, jurusan, email } = req.body;
    if (!nim || !nama || !jurusan || !email) {
        return res.status(400).json({ success: false, message: "Semua kolom wajib diisi." });
    }

    db.query("SELECT id FROM mahasiswa WHERE nim = ? LIMIT 1", [nim], (checkErr, rows) => {
        if (checkErr) return res.status(500).json({ success: false, message: checkErr.message });
        if (rows.length > 0) {
            return res.status(409).json({ success: false, message: "NIM sudah terdaftar!" });
        }

        const sql = "INSERT INTO mahasiswa (nim, nama, jurusan, email) VALUES (?, ?, ?, ?)";
        db.query(sql, [nim, nama, jurusan, email], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: err.message });
            res.json({ success: true, message: "Data mahasiswa berhasil disimpan!" });
        });
    });
});

// UPDATE: NIM boleh tetap sama untuk mahasiswa yang sedang diedit,
// tetapi tidak boleh sama dengan NIM milik mahasiswa lain.
app.put("/api/mahasiswa/:id", (req, res) => {
    const { id } = req.params;
    const { nim, nama, jurusan, email } = req.body;
    if (!nim || !nama || !jurusan || !email) {
        return res.status(400).json({ success: false, message: "Semua kolom wajib diisi." });
    }

    db.query(
        "SELECT id FROM mahasiswa WHERE nim = ? AND id <> ? LIMIT 1",
        [nim, id],
        (checkErr, rows) => {
            if (checkErr) return res.status(500).json({ success: false, message: checkErr.message });
            if (rows.length > 0) {
                return res.status(409).json({ success: false, message: "NIM sudah terdaftar!" });
            }

            const sql = "UPDATE mahasiswa SET nim = ?, nama = ?, jurusan = ?, email = ? WHERE id = ?";
            db.query(sql, [nim, nama, jurusan, email, id], (err, result) => {
                if (err) return res.status(500).json({ success: false, message: err.message });
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: "Data mahasiswa tidak ditemukan." });
                }
                res.json({ success: true, message: "Data mahasiswa berhasil diperbarui!" });
            });
        }
    );
});

// DELETE
app.delete("/api/mahasiswa/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM mahasiswa WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Data mahasiswa tidak ditemukan." });
        }
        res.json({ success: true, message: "Data mahasiswa berhasil dihapus!" });
    });
});

app.listen(PORT, () => {
    console.log(`Server CRUD aktif di http://localhost:${PORT}`);
});
