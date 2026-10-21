// ==========================
// Data & State
// ==========================
const STORAGE_KEY = "kasir-sederhana-data";

const defaultProduk = [
  { id: 1, nama: "Nasi Goreng", kategori: "Makanan", harga: 15000, tersedia: true },
  { id: 2, nama: "Mie Ayam", kategori: "Makanan", harga: 12000, tersedia: true },
  { id: 3, nama: "Es Teh Manis", kategori: "Minuman", harga: 4000, tersedia: true },
  { id: 4, nama: "Kopi Hitam", kategori: "Minuman", harga: 6000, tersedia: false },
  { id: 5, nama: "Keripik Singkong", kategori: "Snack", harga: 8000, tersedia: true },
];

let produk = muatData();
let keranjang = []; // { id, nama, harga, qty }
let kataKunci = "";

// ==========================
// Elemen DOM
// ==========================
const formProduk = document.getElementById("formProduk");
const inputNama = document.getElementById("namaProduk");
const inputKategori = document.getElementById("kategori");
const inputHarga = document.getElementById("harga");
const inputTersedia = document.getElementById("tersedia");
const pesanError = document.getElementById("pesanError");

const inputCari = document.getElementById("cari");
const daftarProduk = document.getElementById("daftarProduk");

const daftarKeranjang = document.getElementById("daftarKeranjang");
const totalBayarEl = document.getElementById("totalBayar");
const inputUang = document.getElementById("uangBayar");
const kembalianEl = document.getElementById("kembalian");
const pesanBayar = document.getElementById("pesanBayar");
const btnBayar = document.getElementById("btnBayar");
const btnKosongkan = document.getElementById("btnKosongkan");

const modalStruk = document.getElementById("modalStruk");
const isiStruk = document.getElementById("isiStruk");
const tutupStruk = document.getElementById("tutupStruk");

const statTotal = document.getElementById("statTotal");
const statTersedia = document.getElementById("statTersedia");
const statHabis = document.getElementById("statHabis");
const statNilai = document.getElementById("statNilai");

// ==========================
// Helper
// ==========================
function rupiah(angka) {
  return "Rp " + Number(angka).toLocaleString("id-ID");
}

function escapeHTML(teks) {
  const el = document.createElement("div");
  el.textContent = teks;
  return el.innerHTML;
}

function muatData() {
  try {
    const tersimpan = localStorage.getItem(STORAGE_KEY);
    if (tersimpan) return JSON.parse(tersimpan);
  } catch (e) {
    /* abaikan, pakai data default */
  }
  return [...defaultProduk];
}

function simpanData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(produk));
  } catch (e) {
    /* penyimpanan tidak tersedia */
  }
}

function hitungTotal() {
  return keranjang.reduce((jumlah, item) => jumlah + item.harga * item.qty, 0);
}

// ==========================
// Render
// ==========================
function renderStatistik() {
  const tersedia = produk.filter((p) => p.tersedia);
  statTotal.textContent = produk.length;
  statTersedia.textContent = tersedia.length;
  statHabis.textContent = produk.length - tersedia.length;
  statNilai.textContent = rupiah(tersedia.reduce((n, p) => n + p.harga, 0));
}

function renderProduk() {
  // Fitur 2: filter real-time
  const hasil = produk.filter((p) =>
    p.nama.toLowerCase().includes(kataKunci.toLowerCase())
  );

  if (hasil.length === 0) {
    daftarProduk.innerHTML = `<p class="kosong-info">Produk tidak ditemukan.</p>`;
    return;
  }

  daftarProduk.innerHTML = hasil
    .map(
      (p) => `
      <article class="card ${p.tersedia ? "" : "habis"}">
        <div class="card-top">
          <span class="badge">${escapeHTML(p.kategori)}</span>
          <span class="status ${p.tersedia ? "ada" : "kosong"}">
            ${p.tersedia ? "Tersedia" : "Habis"}
          </span>
        </div>
        <h3 class="card-title">${escapeHTML(p.nama)}</h3>
        <p class="card-price">${rupiah(p.harga)}</p>
        <div class="card-actions">
          <button class="btn btn-primary" data-aksi="tambah" data-id="${p.id}"
            ${p.tersedia ? "" : "disabled"}>+ Keranjang</button>
          <div class="row">
            <button class="btn btn-warning" data-aksi="status" data-id="${p.id}">Ubah Status</button>
            <button class="btn btn-danger" data-aksi="hapus" data-id="${p.id}">Hapus</button>
          </div>
        </div>
      </article>`
    )
    .join("");
}

function renderKeranjang() {
  if (keranjang.length === 0) {
    daftarKeranjang.innerHTML = `<li class="cart-empty">Keranjang masih kosong</li>`;
  } else {
    daftarKeranjang.innerHTML = keranjang
      .map(
        (item) => `
        <li class="cart-item">
          <div class="cart-info">
            <strong>${escapeHTML(item.nama)}</strong>
            <small>${rupiah(item.harga)} × ${item.qty} = ${rupiah(item.harga * item.qty)}</small>
          </div>
          <div class="qty">
            <button data-cart="kurang" data-id="${item.id}" aria-label="Kurangi">−</button>
            <span>${item.qty}</span>
            <button data-cart="tambah" data-id="${item.id}" aria-label="Tambah">+</button>
          </div>
        </li>`
      )
      .join("");
  }

  totalBayarEl.textContent = rupiah(hitungTotal());
  hitungKembalian();
}

function hitungKembalian() {
  const uang = Number(inputUang.value) || 0;
  const kembali = uang - hitungTotal();
  kembalianEl.textContent = rupiah(kembali > 0 ? kembali : 0);
}

function renderSemua() {
  renderStatistik();
  renderProduk();
  renderKeranjang();
}

// ==========================
// Fitur 1: Form tambah produk
// ==========================
formProduk.addEventListener("submit", (e) => {
  e.preventDefault();

  const nama = inputNama.value.trim();
  const harga = Number(inputHarga.value);

  if (nama === "") {
    pesanError.textContent = "Nama produk tidak boleh kosong.";
    return;
  }
  if (!harga || harga <= 0) {
    pesanError.textContent = "Harga harus lebih besar dari 0.";
    return;
  }
  pesanError.textContent = "";

  const produkBaru = {
    id: Date.now(),
    nama,
    kategori: inputKategori.value,
    harga,
    tersedia: inputTersedia.checked,
  };

  produk = [...produk, produkBaru];
  simpanData();
  formProduk.reset();
  inputTersedia.checked = true;
  renderStatistik();
  renderProduk();
});

// ==========================
// Fitur 2: Live search
// ==========================
inputCari.addEventListener("input", (e) => {
  kataKunci = e.target.value;
  renderProduk();
});

// ==========================
// Fitur 3: Aksi kartu produk
// ==========================
daftarProduk.addEventListener("click", (e) => {
  const tombol = e.target.closest("button[data-aksi]");
  if (!tombol) return;

  const id = Number(tombol.dataset.id);
  const aksi = tombol.dataset.aksi;

  if (aksi === "tambah") {
    tambahKeKeranjang(id);
  } else if (aksi === "status") {
    produk = produk.map((p) => (p.id === id ? { ...p, tersedia: !p.tersedia } : p));
    // Produk yang jadi habis dikeluarkan dari keranjang
    const target = produk.find((p) => p.id === id);
    if (target && !target.tersedia) {
      keranjang = keranjang.filter((item) => item.id !== id);
    }
    simpanData();
    renderSemua();
  } else if (aksi === "hapus") {
    produk = produk.filter((p) => p.id !== id);
    keranjang = keranjang.filter((item) => item.id !== id);
    simpanData();
    renderSemua();
  }
});

// ==========================
// Keranjang
// ==========================
function tambahKeKeranjang(id) {
  const p = produk.find((x) => x.id === id);
  if (!p || !p.tersedia) return;

  const ada = keranjang.find((item) => item.id === id);
  if (ada) {
    ada.qty += 1;
  } else {
    keranjang = [...keranjang, { id: p.id, nama: p.nama, harga: p.harga, qty: 1 }];
  }
  pesanBayar.textContent = "";
  renderKeranjang();
}

daftarKeranjang.addEventListener("click", (e) => {
  const tombol = e.target.closest("button[data-cart]");
  if (!tombol) return;

  const id = Number(tombol.dataset.id);
  const item = keranjang.find((x) => x.id === id);
  if (!item) return;

  if (tombol.dataset.cart === "tambah") {
    item.qty += 1;
  } else {
    item.qty -= 1;
    if (item.qty <= 0) keranjang = keranjang.filter((x) => x.id !== id);
  }
  renderKeranjang();
});

inputUang.addEventListener("input", hitungKembalian);

btnKosongkan.addEventListener("click", () => {
  keranjang = [];
  inputUang.value = "";
  pesanBayar.textContent = "";
  renderKeranjang();
});

btnBayar.addEventListener("click", () => {
  const total = hitungTotal();
  const uang = Number(inputUang.value) || 0;

  if (keranjang.length === 0) {
    pesanBayar.textContent = "Keranjang masih kosong.";
    return;
  }
  if (uang < total) {
    pesanBayar.textContent = "Uang yang dibayar kurang.";
    return;
  }
  pesanBayar.textContent = "";

  tampilkanStruk(total, uang);
  keranjang = [];
  inputUang.value = "";
  renderKeranjang();
});

// ==========================
// Struk
// ==========================
function tampilkanStruk(total, uang) {
  const waktu = new Date().toLocaleString("id-ID");
  const baris = keranjang
    .map((i) => `${i.nama}\n  ${i.qty} x ${rupiah(i.harga)} = ${rupiah(i.qty * i.harga)}`)
    .join("\n");

  isiStruk.textContent =
    `KASIR SEDERHANA\n${waktu}\n` +
    `--------------------------\n${baris}\n--------------------------\n` +
    `Total     : ${rupiah(total)}\n` +
    `Bayar     : ${rupiah(uang)}\n` +
    `Kembalian : ${rupiah(uang - total)}\n\nTerima kasih!`;

  modalStruk.hidden = false;
}

tutupStruk.addEventListener("click", () => {
  modalStruk.hidden = true;
});
modalStruk.addEventListener("click", (e) => {
  if (e.target === modalStruk) modalStruk.hidden = true;
});

// ==========================
// Jalankan pertama kali
// ==========================
renderSemua();