// Logika Client-Side JavaScript CRUD Mahasiswa
document.addEventListener("DOMContentLoaded", () => {
    // 1. Tangkap elemen DOM
    const mhsForm = document.querySelector("#mhsForm");
    const mhsIdInput = document.querySelector("#mhsId");
    const nimInput = document.querySelector("#nim");
    const namaInput = document.querySelector("#nama");
    const jurusanInput = document.querySelector("#jurusan");
    const emailInput = document.querySelector("#email");
    const btnSubmit = document.querySelector("#btnSubmit");
    const btnCancel = document.querySelector("#btnCancel");
    const formTitle = document.querySelector("#formTitle");
    const mhsTableBody = document.querySelector("#mhsTableBody");
    const alertMessage = document.querySelector("#alertMessage");
    const searchInput = document.querySelector("#searchInput");
    const totalMahasiswa = document.querySelector("#totalMahasiswa");

    let listMahasiswa = [];

    // Notifikasi pada halaman
    const showAlert = (text, type = "success") => {
        alertMessage.textContent = text;
        alertMessage.className = `alert alert-${type}`;
        alertMessage.style.display = "block";
        window.clearTimeout(showAlert.timeout);
        showAlert.timeout = window.setTimeout(() => {
            alertMessage.style.display = "none";
        }, 3000);
    };

    // Fitur 3: perbarui jumlah berdasarkan seluruh data, bukan hasil pencarian
    const updateCounter = () => {
        totalMahasiswa.textContent =
            `Total Mahasiswa Terdaftar: ${listMahasiswa.length} Orang`;
    };

    // Fitur 1: tampilkan data sesuai kata kunci nama atau NIM
    const filterMahasiswa = () => {
        const keyword = searchInput.value.trim().toLowerCase();
        const hasilFilter = listMahasiswa.filter((mhs) =>
            String(mhs.nama).toLowerCase().includes(keyword) ||
            String(mhs.nim).toLowerCase().includes(keyword)
        );
        renderTable(hasilFilter);
    };

    // READ: ambil data mahasiswa dari API
    const loadMahasiswa = async () => {
        try {
            const res = await fetch("/api/mahasiswa");
            if (!res.ok) throw new Error("Gagal mengambil data mahasiswa.");
            listMahasiswa = await res.json();
            updateCounter();
            filterMahasiswa();
        } catch (err) {
            showAlert("Gagal memuat data dari server backend.", "error");
            console.error(err);
        }
    };

    const renderTable = (data) => {
        mhsTableBody.innerHTML = "";

        if (data.length === 0) {
            const row = document.createElement("tr");
            const cell = document.createElement("td");
            cell.colSpan = 6;
            cell.className = "empty-state";
            cell.textContent = searchInput.value.trim()
                ? "Data mahasiswa tidak ditemukan."
                : "Belum ada data mahasiswa tersimpan.";
            row.appendChild(cell);
            mhsTableBody.appendChild(row);
            return;
        }

        data.forEach((mhs, idx) => {
            const tr = document.createElement("tr");
            // Gunakan textContent agar data tidak diperlakukan sebagai HTML.
            [idx + 1, mhs.nim, mhs.nama, mhs.jurusan, mhs.email].forEach((value) => {
                const td = document.createElement("td");
                td.textContent = value ?? "";
                tr.appendChild(td);
            });

            const actionCell = document.createElement("td");
            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "btn-action btn-edit";
            editButton.dataset.id = mhs.id;
            editButton.textContent = "Edit";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "btn-action btn-delete";
            deleteButton.dataset.id = mhs.id;
            deleteButton.textContent = "Hapus";

            actionCell.append(editButton, deleteButton);
            tr.appendChild(actionCell);
            mhsTableBody.appendChild(tr);
        });
    };

    // Event input: tabel langsung tersaring saat pengguna mengetik
    searchInput.addEventListener("input", filterMahasiswa);

    // CREATE & UPDATE: submit formulir
    mhsForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            nim: nimInput.value.trim(),
            nama: namaInput.value.trim(),
            jurusan: jurusanInput.value,
            email: emailInput.value.trim()
        };

        const id = mhsIdInput.value;
        const isEdit = Boolean(id);

        // Fitur 2: validasi NIM duplikat di frontend sebelum fetch ke backend.
        // Saat edit, data dengan ID yang sedang diedit tidak dianggap duplikat.
        const nimSudahAda = listMahasiswa.some((mhs) =>
            String(mhs.nim).trim().toLowerCase() === payload.nim.toLowerCase() &&
            String(mhs.id) !== String(id)
        );

        if (nimSudahAda) {
            window.alert("NIM sudah terdaftar!");
            return;
        }

        const url = isEdit ? `/api/mahasiswa/${id}` : "/api/mahasiswa";
        const method = isEdit ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                showAlert(result.message || "Gagal menyimpan data mahasiswa.", "error");
                return;
            }

            showAlert(result.message);
            resetForm();
            await loadMahasiswa(); // counter dan tabel diperbarui setelah berhasil
        } catch (err) {
            showAlert("Gagal mengirim data ke server.", "error");
            console.error(err);
        }
    });

    // EDIT & DELETE: event delegation pada tabel
    mhsTableBody.addEventListener("click", async (e) => {
        const button = e.target.closest("button[data-id]");
        if (!button) return;

        const id = Number(button.dataset.id);
        if (!id) return;

        if (button.classList.contains("btn-edit")) {
            const targetMhs = listMahasiswa.find((m) => Number(m.id) === id);
            if (!targetMhs) return;

            mhsIdInput.value = targetMhs.id;
            nimInput.value = targetMhs.nim;
            namaInput.value = targetMhs.nama;
            jurusanInput.value = targetMhs.jurusan;
            emailInput.value = targetMhs.email;

            formTitle.textContent = "Edit Data Mahasiswa";
            btnSubmit.textContent = "Perbarui Mahasiswa";
            btnCancel.style.display = "inline-block";
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (button.classList.contains("btn-delete")) {
            if (!window.confirm("Apakah Anda yakin ingin menghapus data mahasiswa ini?")) return;

            try {
                const res = await fetch(`/api/mahasiswa/${id}`, { method: "DELETE" });
                const result = await res.json();

                if (!res.ok || !result.success) {
                    showAlert(result.message || "Gagal menghapus data mahasiswa.", "error");
                    return;
                }

                showAlert(result.message);
                await loadMahasiswa(); // counter berkurang setelah data berhasil dihapus
            } catch (err) {
                showAlert("Gagal menghapus data dari server.", "error");
                console.error(err);
            }
        }
    });

    // Reset form ke mode tambah
    const resetForm = () => {
        mhsForm.reset();
        mhsIdInput.value = "";
        formTitle.textContent = "Tambah Mahasiswa Baru";
        btnSubmit.textContent = "Simpan Mahasiswa";
        btnCancel.style.display = "none";
    };

    btnCancel.addEventListener("click", resetForm);

    // Ambil data pertama kali
    loadMahasiswa();
});
