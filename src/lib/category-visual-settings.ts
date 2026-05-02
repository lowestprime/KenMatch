import "server-only";

import { communityExecute, communityOne, communityRows, rowNullableString, rowString } from "@/lib/community-db";

export interface CategoryVisualSetting {
  categoryId: string;
  slug: string;
  name: string;
  description: string;
  thesis: string;
  currentSymbolKey: string;
  symbolKey: string;
  motif: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  backgroundColor: string;
  customSvg: string;
  note: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

const fallback = {
  motif: "prism",
  primaryColor: "#6d28d9",
  secondaryColor: "#1d4ed8",
  tertiaryColor: "#b08d1a",
  backgroundColor: "#03020a",
};

function normalizeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 84) || "prism";
}

function normalizeColor(value: string | null | undefined, defaultValue: string) {
  const candidate = (value ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(candidate) ? candidate.toLowerCase() : defaultValue;
}

export async function listCategoryVisualSettings(): Promise<CategoryVisualSetting[]> {
  const rows = await communityRows(
    `SELECT c.id AS categoryId, c.slug, c.name, c.description, c.thesis, c.symbolKey AS currentSymbolKey,
      v.symbolKey, v.motif, v.primaryColor, v.secondaryColor, v.tertiaryColor, v.backgroundColor, v.customSvg, v.note, v.updatedAt, v.updatedBy
    FROM categories c
    LEFT JOIN category_visual_overrides v ON v.categoryId = c.id
    ORDER BY c.name ASC`,
  );
  return rows.map((row) => ({
    categoryId: rowString(row, "categoryId"),
    slug: rowString(row, "slug"),
    name: rowString(row, "name"),
    description: rowString(row, "description"),
    thesis: rowString(row, "thesis"),
    currentSymbolKey: rowString(row, "currentSymbolKey"),
    symbolKey: rowString(row, "symbolKey") || rowString(row, "currentSymbolKey") || rowString(row, "slug"),
    motif: rowString(row, "motif") || fallback.motif,
    primaryColor: rowString(row, "primaryColor") || fallback.primaryColor,
    secondaryColor: rowString(row, "secondaryColor") || fallback.secondaryColor,
    tertiaryColor: rowString(row, "tertiaryColor") || fallback.tertiaryColor,
    backgroundColor: rowString(row, "backgroundColor") || fallback.backgroundColor,
    customSvg: rowString(row, "customSvg"),
    note: rowString(row, "note"),
    updatedAt: rowNullableString(row, "updatedAt"),
    updatedBy: rowNullableString(row, "updatedBy"),
  }));
}

export async function upsertCategoryVisualSetting(input: {
  categoryId: string;
  symbolKey: string;
  motif: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  backgroundColor: string;
  customSvg?: string;
  note?: string;
  updatedBy?: string | null;
}) {
  const category = await communityOne("SELECT id FROM categories WHERE id = ?", [input.categoryId]);
  if (!category) throw new Error("Category not found.");
  const symbolKey = normalizeSlug(input.symbolKey || input.motif || input.categoryId);
  const now = new Date().toISOString();
  await communityExecute("UPDATE categories SET symbolKey = ? WHERE id = ?", [symbolKey, input.categoryId]);
  await communityExecute(
    `INSERT INTO category_visual_overrides (categoryId, symbolKey, motif, primaryColor, secondaryColor, tertiaryColor, backgroundColor, customSvg, note, updatedAt, updatedBy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(categoryId) DO UPDATE SET
       symbolKey = excluded.symbolKey,
       motif = excluded.motif,
       primaryColor = excluded.primaryColor,
       secondaryColor = excluded.secondaryColor,
       tertiaryColor = excluded.tertiaryColor,
       backgroundColor = excluded.backgroundColor,
       customSvg = excluded.customSvg,
       note = excluded.note,
       updatedAt = excluded.updatedAt,
       updatedBy = excluded.updatedBy`,
    [
      input.categoryId,
      symbolKey,
      input.motif || "prism",
      normalizeColor(input.primaryColor, fallback.primaryColor),
      normalizeColor(input.secondaryColor, fallback.secondaryColor),
      normalizeColor(input.tertiaryColor, fallback.tertiaryColor),
      normalizeColor(input.backgroundColor, fallback.backgroundColor),
      (input.customSvg ?? "").slice(0, 6000),
      (input.note ?? "").slice(0, 1000),
      now,
      input.updatedBy ?? null,
    ],
  );
}

function cssEscapeAttribute(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

export async function getCategoryVisualOverrideCss() {
  const settings = await listCategoryVisualSettings();
  const rules = settings
    .filter((setting) => setting.updatedAt)
    .map((setting) => {
      const slug = cssEscapeAttribute(setting.slug);
      return `.category-symbol[data-category-slug="${slug}"],.ken-symbol[data-category-slug="${slug}"]{--category-visual-primary:${normalizeColor(setting.primaryColor, fallback.primaryColor)};--category-visual-secondary:${normalizeColor(setting.secondaryColor, fallback.secondaryColor)};--category-visual-tertiary:${normalizeColor(setting.tertiaryColor, fallback.tertiaryColor)};--category-visual-background:${normalizeColor(setting.backgroundColor, fallback.backgroundColor)}}`;
    })
    .join("\n");
  return rules ? `/* DB-backed category visual overrides */\n${rules}` : "";
}
