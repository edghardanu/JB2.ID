import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";

export const desa = sqliteTable("desa", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const kelompok = sqliteTable("kelompok", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull(),
  desaId: integer("desa_id")
    .notNull()
    .references(() => desa.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const generus = sqliteTable("generus", {
  id: text("id").primaryKey(),
  nomorUnik: text("nomor_unik").notNull().unique(),
  nama: text("nama").notNull(),
  tempatLahir: text("tempat_lahir"),
  tanggalLahir: text("tanggal_lahir"),
  jenisKelamin: text("jenis_kelamin", { enum: ["L", "P"] }).notNull(),
  kategoriUsia: text("kategori_usia", {
    enum: ["PAUD", "TK", "SD", "SMP", "SMA", "SMK", "Kuliah", "Bekerja"],
  }).notNull(),
  alamat: text("alamat"),
  noTelp: text("no_telp"),
  pendidikan: text("pendidikan"),
  pekerjaan: text("pekerjaan"),
  statusNikah: text("status_nikah", { enum: ["Belum Menikah", "Menikah"] }).default("Belum Menikah"),
  hobi: text("hobi"),
  makananMinumanFavorit: text("makanan_minuman_favorit"),
  suku: text("suku"),
  foto: text("foto"),
  desaId: integer("desa_id").references(() => desa.id, { onDelete: "cascade" }),
  kelompokId: integer("kelompok_id").references(() => kelompok.id, { onDelete: "cascade" }),
  mandiriDesaId: integer("mandiri_desa_id").references(() => mandiriDesa.id, { onDelete: "set null" }),
  mandiriKelompokId: integer("mandiri_kelompok_id").references(() => mandiriKelompok.id, { onDelete: "set null" }),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
}, (table) => ({
  namaIdx: index("generus_nama_idx").on(table.nama),
  desaIdIdx: index("generus_desa_id_idx").on(table.desaId),
  kelompokIdIdx: index("generus_kelompok_id_idx").on(table.kelompokId),
  mandiriDesaIdIdx: index("generus_mandiri_desa_id_idx").on(table.mandiriDesaId),
  mandiriKelompokIdIdx: index("generus_mandiri_kelompok_id_idx").on(table.mandiriKelompokId),
  kategoriUsiaIdx: index("generus_kategori_usia_idx").on(table.kategoriUsia),
  jenisKelaminIdx: index("generus_jenis_kelamin_idx").on(table.jenisKelamin),
  statusNikahIdx: index("generus_status_nikah_idx").on(table.statusNikah),
}));

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "pengurus_daerah", "kmm_daerah", "desa", "kelompok", "generus", "creator", "pending", "tim_pnkb", "admin_romantic_room", "admin_keuangan", "admin_kegiatan"] })
    .notNull()
    .default("pending"),
  desaId: integer("desa_id").references(() => desa.id, { onDelete: "set null" }),
  kelompokId: integer("kelompok_id").references(() => kelompok.id, { onDelete: "set null" }),
  mandiriDesaId: integer("mandiri_desa_id").references(() => mandiriDesa.id, { onDelete: "set null" }),
  mandiriKelompokId: integer("mandiri_kelompok_id").references(() => mandiriKelompok.id, { onDelete: "set null" }),
  generusId: text("generus_id").references(() => generus.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (table) => ({
  nameIdx: index("users_name_idx").on(table.name),
  emailIdx: index("users_email_idx").on(table.email),
  desaIdIdx: index("users_desa_id_idx").on(table.desaId),
  kelompokIdIdx: index("users_kelompok_id_idx").on(table.kelompokId),
  mandiriDesaIdIdx: index("users_mandiri_desa_id_idx").on(table.mandiriDesaId),
  mandiriKelompokIdIdx: index("users_mandiri_kelompok_id_idx").on(table.mandiriKelompokId),
}));

export const kegiatan = sqliteTable("kegiatan", {
  id: text("id").primaryKey(),
  judul: text("judul").notNull(),
  deskripsi: text("deskripsi"),
  tanggal: text("tanggal").notNull(),
  lokasi: text("lokasi"),
  desaId: integer("desa_id").references(() => desa.id, { onDelete: "cascade" }),
  kelompokId: integer("kelompok_id").references(() => kelompok.id, { onDelete: "cascade" }),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
}, (table) => ({
  desaIdIdx: index("kegiatan_desa_id_idx").on(table.desaId),
  kelompokIdIdx: index("kegiatan_kelompok_id_idx").on(table.kelompokId),
  tanggalIdx: index("kegiatan_tanggal_idx").on(table.tanggal),
}));

export const absensi = sqliteTable("absensi", {
  id: text("id").primaryKey(),
  kegiatanId: text("kegiatan_id")
    .notNull()
    .references(() => kegiatan.id),
  generusId: text("generus_id")
    .notNull()
    .references(() => generus.id),
  timestamp: text("timestamp").default(sql`(datetime('now'))`),
  keterangan: text("keterangan", { enum: ["hadir", "izin", "alpha"] }).default("hadir"),
}, (table) => ({
  kegiatanIdIdx: index("absensi_kegiatan_id_idx").on(table.kegiatanId),
  generusIdIdx: index("absensi_generus_id_idx").on(table.generusId),
}));

export const artikel = sqliteTable("artikel", {
  id: text("id").primaryKey(),
  judul: text("judul").notNull(),
  konten: text("konten").notNull(),
  ringkasan: text("ringkasan"),
  coverImage: text("cover_image"),
  status: text("status", { enum: ["pending", "published", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  tipe: text("tipe", { enum: ["berita", "artikel"] })
    .notNull()
    .default("artikel"),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  publishedAt: text("published_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const mandiri = sqliteTable("mandiri", {
  id: text("id").primaryKey(),
  generusId: text("generus_id")
    .notNull()
    .references(() => generus.id, { onDelete: "cascade" }),
  statusMandiri: text("status_pdkt", { enum: ["Aktif", "Selesai", "Batal"] }).default("Aktif"),
  catatan: text("catatan"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const mandiriDesa = sqliteTable("mandiri_desa", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull(),
  kota: text("kota").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const mandiriKelompok = sqliteTable("mandiri_kelompok", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull(),
  mandiriDesaId: integer("mandiri_desa_id")
    .notNull()
    .references(() => mandiriDesa.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const mandiriKegiatan = sqliteTable("mandiri_kegiatan", {
  id: text("id").primaryKey(),
  judul: text("judul").notNull(),
  deskripsi: text("deskripsi"),
  tanggal: text("tanggal").notNull(),
  lokasi: text("lokasi"),
  kota: text("kota").notNull(),
  desaId: integer("desa_id").references(() => mandiriDesa.id, { onDelete: "set null" }),
  kelompokId: integer("kelompok_id").references(() => mandiriKelompok.id, { onDelete: "set null" }),
  createdBy: text("created_by"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const mandiriAbsensi = sqliteTable("mandiri_absensi", {
  id: text("id").primaryKey(),
  kegiatanId: text("kegiatan_id")
    .notNull()
    .references(() => mandiriKegiatan.id),
  generusId: text("generus_id")
    .notNull()
    .references(() => generus.id),
  timestamp: text("timestamp").default(sql`(datetime('now'))`),
  keterangan: text("keterangan", { enum: ["hadir", "izin", "alpha"] }).default("hadir"),
}, (table) => ({
  kegiatanIdIdx: index("mandiri_absensi_kegiatan_id_idx").on(table.kegiatanId),
  generusIdIdx: index("mandiri_absensi_generus_id_idx").on(table.generusId),
}));

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const visitorStats = sqliteTable("visitor_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  countryCode: text("country_code").notNull().unique(),
  countryName: text("country_name").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const mandiriAntrean = sqliteTable("mandiri_antrean", {
  id: text("id").primaryKey(),
  generusId: text("generus_id").notNull().references(() => generus.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["Menunggu", "Diproses", "Selesai", "Batal"] }).default("Menunggu"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const mandiriPemilihan = sqliteTable("mandiri_pemilihan", {
  id: text("id").primaryKey(),
  pengirimId: text("pengirim_id").notNull().references(() => generus.id, { onDelete: "cascade" }),
  penerimaId: text("penerima_id").notNull().references(() => generus.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["Menunggu", "Diterima", "Ditolak", "Selesai"] }).default("Menunggu"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const mandiriKuisioner = sqliteTable("mandiri_kuisioner", {
  id: text("id").primaryKey(),
  pemilihanId: text("pemilihan_id").references(() => mandiriPemilihan.id, { onDelete: "set null" }),
  pengisiId: text("pengisi_id").notNull().references(() => generus.id, { onDelete: "cascade" }),
  namaPnkb: text("nama_pnkb"),
  noHpPnkb: text("no_hp_pnkb"),
  tanggapan: text("tanggapan"),
  rekomendasi: text("rekomendasi"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const rab = sqliteTable("rab", {
  id: text("id").primaryKey(),
  kegiatanId: text("kegiatan_id").references(() => kegiatan.id, { onDelete: "cascade" }),
  mandiriKegiatanId: text("mandiri_kegiatan_id").references(() => mandiriKegiatan.id, { onDelete: "cascade" }),
  item: text("item").notNull(),
  volume: integer("volume").notNull(),
  satuan: text("satuan").notNull(),
  hargaSatuan: integer("harga_satuan").notNull(),
  totalHarga: integer("total_harga").notNull(),
  keterangan: text("keterangan"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
}, (table) => ({
  kegiatanIdIdx: index("rab_kegiatan_id_idx").on(table.kegiatanId),
  mandiriKegiatanIdIdx: index("rab_mandiri_kegiatan_id_idx").on(table.mandiriKegiatanId),
}));

export const rabApproval = sqliteTable("rab_approval", {
  id: text("id").primaryKey(),
  kegiatanId: text("kegiatan_id").references(() => kegiatan.id, { onDelete: "cascade" }),
  mandiriKegiatanId: text("mandiri_kegiatan_id").references(() => mandiriKegiatan.id, { onDelete: "cascade" }),
  statusPengurus: text("status_pengurus", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  statusAdmin: text("status_admin", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  isSubmitted: integer("is_submitted").default(0),
  catatanPengurus: text("catatan_pengurus"),
  catatanAdmin: text("catatan_admin"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
}, (table) => ({
  kegiatanIdIdx: index("rab_approval_kegiatan_id_idx").on(table.kegiatanId),
  mandiriKegiatanIdIdx: index("rab_approval_mandiri_kegiatan_id_idx").on(table.mandiriKegiatanId),
}));

export const rundown = sqliteTable("rundown", {
  id: text("id").primaryKey(),
  kegiatanId: text("kegiatan_id").references(() => kegiatan.id, { onDelete: "cascade" }),
  mandiriKegiatanId: text("mandiri_kegiatan_id").references(() => mandiriKegiatan.id, { onDelete: "cascade" }),
  waktu: text("waktu").notNull(),
  agenda: text("agenda").notNull(),
  pic: text("pic"),
  keterangan: text("keterangan"),
  order: integer("order").notNull().default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
}, (table) => ({
  kegiatanIdIdx: index("rundown_kegiatan_id_idx").on(table.kegiatanId),
  mandiriKegiatanIdIdx: index("rundown_mandiri_kegiatan_id_idx").on(table.mandiriKegiatanId),
}));

export const rundownApproval = sqliteTable("rundown_approval", {
  id: text("id").primaryKey(),
  kegiatanId: text("kegiatan_id").references(() => kegiatan.id, { onDelete: "cascade" }),
  mandiriKegiatanId: text("mandiri_kegiatan_id").references(() => mandiriKegiatan.id, { onDelete: "cascade" }),
  statusPengurus: text("status_pengurus", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  isSubmitted: integer("is_submitted").default(0),
  catatanPengurus: text("catatan_pengurus"),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
}, (table) => ({
  kegiatanIdIdx: index("rundown_approval_kegiatan_id_idx").on(table.kegiatanId),
  mandiriKegiatanIdIdx: index("rundown_approval_mandiri_kegiatan_id_idx").on(table.mandiriKegiatanId),
}));

export type Desa = typeof desa.$inferSelect;
export type Kelompok = typeof kelompok.$inferSelect;
export type User = typeof users.$inferSelect;
export type Generus = typeof generus.$inferSelect;
export type Kegiatan = typeof kegiatan.$inferSelect;
export type MandiriKegiatan = typeof mandiriKegiatan.$inferSelect;
export type MandiriDesa = typeof mandiriDesa.$inferSelect;
export type MandiriKelompok = typeof mandiriKelompok.$inferSelect;
export type Absensi = typeof absensi.$inferSelect;
export type MandiriAbsensi = typeof mandiriAbsensi.$inferSelect;
export type Artikel = typeof artikel.$inferSelect;
export type Mandiri = typeof mandiri.$inferSelect;
export type VisitorStats = typeof visitorStats.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type MandiriAntrean = typeof mandiriAntrean.$inferSelect;
export type MandiriPemilihan = typeof mandiriPemilihan.$inferSelect;
export type MandiriKuisioner = typeof mandiriKuisioner.$inferSelect;
export type Rab = typeof rab.$inferSelect;
export type RabApproval = typeof rabApproval.$inferSelect;
export type Rundown = typeof rundown.$inferSelect;
export type RundownApproval = typeof rundownApproval.$inferSelect;

export type NewDesa = typeof desa.$inferInsert;
export type NewKelompok = typeof kelompok.$inferInsert;
export type NewUser = typeof users.$inferInsert;
export type NewGenerus = typeof generus.$inferInsert;
export type NewKegiatan = typeof kegiatan.$inferInsert;
export type NewMandiriKegiatan = typeof mandiriKegiatan.$inferInsert;
export type NewMandiriDesa = typeof mandiriDesa.$inferInsert;
export type NewMandiriKelompok = typeof mandiriKelompok.$inferInsert;
export type NewAbsensi = typeof absensi.$inferInsert;
export type NewMandiriAbsensi = typeof mandiriAbsensi.$inferInsert;
export type NewArtikel = typeof artikel.$inferInsert;
export type NewMandiri = typeof mandiri.$inferInsert;
export type NewVisitorStats = typeof visitorStats.$inferInsert;
export type NewSettings = typeof settings.$inferInsert;
export type NewMandiriAntrean = typeof mandiriAntrean.$inferInsert;
export type NewMandiriPemilihan = typeof mandiriPemilihan.$inferInsert;
export type NewMandiriKuisioner = typeof mandiriKuisioner.$inferInsert;
export type NewRab = typeof rab.$inferInsert;
export type NewRabApproval = typeof rabApproval.$inferInsert;
export type NewRundown = typeof rundown.$inferInsert;
export type NewRundownApproval = typeof rundownApproval.$inferInsert;
